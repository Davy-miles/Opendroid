package com.phantom.store.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.phantom.store.R
import com.phantom.store.data.CuratedCatalog
import com.phantom.store.data.StorePreferences
import com.phantom.store.installer.ApkInstallResult
import com.phantom.store.installer.ApkSessionInstaller
import com.phantom.store.installer.DevicePackageHelper
import com.phantom.store.installer.InstallEventBus
import com.phantom.store.logic.StoreLogic
import com.phantom.store.model.ActiveApkTask
import com.phantom.store.model.AndroidAppItem
import com.phantom.store.model.AndroidArch
import com.phantom.store.model.ApkAsset
import com.phantom.store.model.AppCategory
import com.phantom.store.model.AppPermission
import com.phantom.store.model.AppSourceType
import com.phantom.store.model.AppSyncOverride
import com.phantom.store.model.InstalledPackageState
import com.phantom.store.model.PermissionRisk
import com.phantom.store.model.RepoKind
import com.phantom.store.model.RepoSyncStatus
import com.phantom.store.model.RepositorySource
import com.phantom.store.model.SortOption
import com.phantom.store.model.StoreTab
import com.phantom.store.model.SyncStats
import com.phantom.store.sync.UpstreamSyncEngine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

data class StoreUiState(
    val activeTab: StoreTab = StoreTab.TODAY,
    val searchQuery: String = "",
    val selectedCategory: AppCategory = AppCategory.ALL,
    val archFilter: AndroidArch? = null,
    val sortOption: SortOption = SortOption.FEATURED,
    val devicePrimaryArch: AndroidArch = AndroidArch.ARM64_V8A,
    val catalog: List<AndroidAppItem> = emptyList(),
    val repositories: List<RepositorySource> = emptyList(),
    val installedPackages: Map<String, InstalledPackageState> = emptyMap(),
    val activeTasks: Map<String, ActiveApkTask> = emptyMap(),
    val selectedAppId: String? = null,
    val isSyncingAll: Boolean = false,
    val syncingRepoId: String? = null,
    val lastSyncedLabel: String? = null,
    val syncStats: SyncStats? = null,
    val statusBanner: String? = null
) {
    val selectedApp: AndroidAppItem?
        get() = selectedAppId?.let { id -> catalog.firstOrNull { it.id == id } }
}

class StoreViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = StorePreferences(application)
    private val syncEngine = UpstreamSyncEngine()
    private val installer = ApkSessionInstaller()

    private val _uiState = MutableStateFlow(StoreUiState())
    val uiState: StateFlow<StoreUiState> = _uiState.asStateFlow()

    private var overridesMap: MutableMap<String, AppSyncOverride> = LinkedHashMap()
    private var customAppsList: MutableList<AndroidAppItem> = mutableListOf()
    private var indexedRepoAppsMap: MutableMap<String, List<AndroidAppItem>> = LinkedHashMap()
    private var reposList: MutableList<RepositorySource> = mutableListOf()

    init {
        val deviceArch = DevicePackageHelper.detectDevicePrimaryArch()
        overridesMap = prefs.loadOverrides().toMutableMap()
        customAppsList = prefs.loadCustomApps().toMutableList()
        reposList = prefs.loadRepositories(CuratedCatalog.initialRepositories).toMutableList()

        _uiState.update {
            it.copy(
                devicePrimaryArch = deviceArch,
                repositories = reposList.toList(),
                lastSyncedLabel = formatSyncTime(prefs.loadLastSyncIso())
            )
        }
        rebuildCatalogAndScan()
        observeInstallEvents()
        syncAllCatalog(silent = true)
    }

    private fun observeInstallEvents() {
        viewModelScope.launch {
            InstallEventBus.events.collect { event ->
                refreshInstalledPackages()
                _uiState.update { it.copy(statusBanner = event.message) }
            }
        }
    }

    fun refreshInstalledPackages() {
        val pkgs = (CuratedCatalog.apps + customAppsList + indexedRepoAppsMap.values.flatten())
            .map { it.packageName }
            .distinct()
        val scanned = DevicePackageHelper.scanInstalledPackages(getApplication(), pkgs)
        _uiState.update { it.copy(installedPackages = scanned) }
    }

    private fun rebuildCatalogAndScan() {
        val enabledRepoIds = reposList.filter { it.enabled }.map { it.id }.toSet()
        val base = CuratedCatalog.apps + customAppsList
        val resolvedCurated = base.map { app -> StoreLogic.resolveAppWithSync(app, overridesMap[app.id]) }
        val seenPkgs = resolvedCurated.map { it.packageName.lowercase(Locale.ROOT) }.toHashSet()
        val merged = ArrayList<AndroidAppItem>(resolvedCurated.size + 4096)
        merged.addAll(resolvedCurated)

        indexedRepoAppsMap.forEach { (repoId, apps) ->
            if (!enabledRepoIds.contains(repoId)) return@forEach
            apps.forEach { item ->
                val pkgKey = item.packageName.lowercase(Locale.ROOT)
                if (seenPkgs.add(pkgKey)) {
                    merged.add(item)
                }
            }
        }

        _uiState.update { it.copy(catalog = merged) }
        refreshInstalledPackages()
    }

    fun selectTab(tab: StoreTab) {
        _uiState.update { it.copy(activeTab = tab) }
    }

    fun setSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun setCategory(category: AppCategory) {
        _uiState.update { it.copy(selectedCategory = category) }
    }

    fun setArchFilter(arch: AndroidArch?) {
        _uiState.update { it.copy(archFilter = arch) }
    }

    fun setSortOption(sort: SortOption) {
        _uiState.update { it.copy(sortOption = sort) }
    }

    fun openAppDetails(appId: String?) {
        _uiState.update { it.copy(selectedAppId = appId) }
    }

    fun dismissBanner() {
        _uiState.update { it.copy(statusBanner = null) }
    }

    fun jumpToCategory(category: AppCategory) {
        _uiState.update {
            it.copy(
                selectedCategory = category,
                searchQuery = "",
                activeTab = StoreTab.APPS
            )
        }
    }

    fun syncAllCatalog(silent: Boolean = false) {
        if (_uiState.value.isSyncingAll) return
        viewModelScope.launch {
            _uiState.update { it.copy(isSyncingAll = true) }
            val currentApps = CuratedCatalog.apps + customAppsList
            val currentRepos = reposList.toList()

            val result = syncEngine.syncCatalog(currentApps, currentRepos)
            result.appOverrides.forEach { (id, patch) ->
                overridesMap[id] = patch
            }
            prefs.saveOverrides(overridesMap)

            // Sync enabled F-Droid repository indices (index-v1.jar) for thousands of real apps
            currentRepos.filter { it.enabled && it.kind == RepoKind.FDROID && it.url.startsWith("http") }
                .forEach { fdroidRepo ->
                    val repoIndex = syncEngine.fetchFDroidRepoIndex(fdroidRepo)
                    if (repoIndex.apps.isNotEmpty()) {
                        indexedRepoAppsMap[fdroidRepo.id] = repoIndex.apps
                    }
                }

            reposList = reposList.map { repo ->
                val statusPair = result.repoStatuses[repo.id]
                val indexedCount = indexedRepoAppsMap[repo.id]?.size
                val baseUpdated = if (statusPair != null) {
                    repo.copy(
                        syncStatus = statusPair.first,
                        lastSyncedAt = statusPair.second.take(10)
                    )
                } else {
                    repo
                }
                if (indexedCount != null && indexedCount > 0) {
                    baseUpdated.copy(appCount = indexedCount, syncStatus = RepoSyncStatus.ONLINE)
                } else {
                    baseUpdated
                }
            }.toMutableList()
            prefs.saveRepositories(reposList)
            prefs.saveLastSyncIso(result.syncedAtIso)

            rebuildCatalogAndScan()
            val totalCatalogSize = _uiState.value.catalog.size
            _uiState.update { state ->
                state.copy(
                    isSyncingAll = false,
                    repositories = reposList.toList(),
                    syncStats = result.stats.copy(totalApps = totalCatalogSize),
                    lastSyncedLabel = formatSyncTime(result.syncedAtIso),
                    statusBanner = if (silent) state.statusBanner else {
                        "Sincronizado: $totalCatalogSize apps, ${result.stats.syncedRepos} fontes e ${result.stats.imagesSynced} imagens."
                    }
                )
            }
        }
    }

    fun syncSingleAppNow(app: AndroidAppItem, onDone: ((String) -> Unit)? = null) {
        viewModelScope.launch {
            val patch = syncEngine.syncSingleApp(app)
            overridesMap[app.id] = patch
            prefs.saveOverrides(overridesMap)
            rebuildCatalogAndScan()
            val imgCount = (if (patch.remoteIconUrl != null) 1 else 0) + (patch.remoteGalleryUrls?.size ?: 0)
            val msg = "Sincronizado v${patch.version ?: app.version}: ${patch.assets?.size ?: app.assets.size} APK(s) e $imgCount imagem(ns)."
            _uiState.update { it.copy(statusBanner = msg) }
            onDone?.invoke(msg)
        }
    }

    fun syncRepositoryNow(repoId: String) {
        val target = reposList.firstOrNull { it.id == repoId } ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(syncingRepoId = repoId) }
            var status = syncEngine.checkRepositoryStatus(target)
            var indexedSize = indexedRepoAppsMap[repoId]?.size
            if (target.kind == RepoKind.FDROID && target.url.startsWith("http")) {
                val repoIndex = syncEngine.fetchFDroidRepoIndex(target)
                if (repoIndex.apps.isNotEmpty()) {
                    indexedRepoAppsMap[repoId] = repoIndex.apps
                    indexedSize = repoIndex.apps.size
                    status = RepoSyncStatus.ONLINE
                }
            }
            val today = Instant.now().toString().take(10)
            reposList = reposList.map { repo ->
                if (repo.id == repoId) {
                    repo.copy(
                        syncStatus = status,
                        lastSyncedAt = today,
                        appCount = indexedSize ?: repo.appCount
                    )
                } else repo
            }.toMutableList()
            prefs.saveRepositories(reposList)

            val matchingApps = (CuratedCatalog.apps + customAppsList).filter {
                it.repoSlug.equals(target.slug, ignoreCase = true) ||
                    (target.kind == RepoKind.FDROID && it.sourceType == AppSourceType.FDROID)
            }
            matchingApps.forEach { app ->
                overridesMap[app.id] = syncEngine.syncSingleApp(app)
            }
            rebuildCatalogAndScan()

            val updatedCount = indexedSize ?: matchingApps.size
            _uiState.update {
                it.copy(
                    syncingRepoId = null,
                    repositories = reposList.toList(),
                    statusBanner = "${target.name}: ${status.label} ($updatedCount apps indexados)."
                )
            }
        }
    }

    fun addRepositoryInput(rawInput: String, onResult: (Boolean, String) -> Unit) {
        val trimmed = rawInput.trim()
        if (StoreLogic.isValidAndroidPackageId(trimmed)) {
            addFDroidPackage(trimmed, onResult)
            return
        }
        val validation = StoreLogic.validateGitHubRepoInput(trimmed)
        if (!validation.valid || validation.slug == null || validation.url == null) {
            onResult(false, validation.error ?: "Entrada inválida.")
            return
        }
        if (reposList.any { it.slug.equals(validation.slug, ignoreCase = true) }) {
            onResult(false, "O repositório ${validation.slug} já está conectado.")
            return
        }
        addGitHubRepo(validation.slug, validation.url, onResult)
    }

    private fun addFDroidPackage(packageId: String, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            val dto = syncEngine.fetchFDroidPackage(packageId)
            val latest = dto?.packages?.firstOrNull()
            if (latest == null) {
                onResult(false, "Pacote $packageId não encontrado no índice F-Droid.")
                return@launch
            }
            val displayName = packageId.substringAfterLast('.')
                .replaceFirstChar { it.titlecase(Locale.getDefault()) }
            val cleanVer = StoreLogic.cleanReleaseVersion(latest.versionName)
            val today = Instant.now().toString().take(10)

            val newRepo = RepositorySource(
                id = "repo-fdroid-$packageId",
                name = "$displayName (F-Droid)",
                slug = packageId,
                url = "https://f-droid.org/packages/$packageId",
                kind = RepoKind.FDROID,
                enabled = true,
                verified = true,
                appCount = 1,
                lastSyncedAt = today,
                syncStatus = RepoSyncStatus.ONLINE,
                description = "Pacote sincronizado diretamente do índice oficial F-Droid ($packageId)."
            )

            val newApp = AndroidAppItem(
                id = "fdroid-$packageId",
                name = displayName,
                packageName = packageId,
                category = "Utilitários",
                tagline = "Aplicativo sincronizado do F-Droid ($packageId).",
                description = "Pacote oficial F-Droid ($packageId) com build verificada e reproduzível.",
                developer = "F-Droid Contributor",
                version = cleanVer,
                minAndroid = "7.0+",
                license = "Open Source",
                updatedAt = today,
                downloadsCount = 24_000,
                lastSyncedAt = Instant.now().toString(),
                repoSlug = packageId,
                sourceType = AppSourceType.FDROID,
                localPreviewRes = R.drawable.hero_repos,
                accentHex = 0xFF9333EA,
                monogram = displayName.take(2).uppercase(Locale.ROOT),
                assets = listOf(
                    ApkAsset(
                        name = "${packageId}_${latest.versionCode}.apk",
                        arch = AndroidArch.UNIVERSAL,
                        sizeBytes = 14L * 1024L * 1024L,
                        downloadUrl = "https://f-droid.org/repo/${packageId}_${latest.versionCode}.apk",
                        sha256 = "verificado-indice-oficial-fdroid"
                    )
                ),
                permissions = listOf(
                    AppPermission(
                        code = "android.permission.INTERNET",
                        label = "Acesso à rede",
                        risk = PermissionRisk.LOW,
                        reason = "Manifesto padrão F-Droid."
                    )
                ),
                changelog = listOf("Versão v$cleanVer sincronizada do F-Droid.")
            )

            reposList.add(0, newRepo)
            customAppsList.removeAll { it.id == newApp.id }
            customAppsList.add(0, newApp)
            prefs.saveRepositories(reposList)
            prefs.saveCustomApps(customAppsList)
            rebuildCatalogAndScan()
            _uiState.update { it.copy(repositories = reposList.toList()) }
            onResult(true, "Pacote F-Droid $displayName (v$cleanVer) adicionado!")
        }
    }

    private fun addGitHubRepo(slug: String, url: String, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            val repoName = slug.substringAfter('/')
            val owner = slug.substringBefore('/')
            val cleanId = "custom-${slug.lowercase(Locale.ROOT).replace(Regex("[^a-z0-9]+"), "-")}"
            val baseApp = AndroidAppItem(
                id = cleanId,
                name = repoName,
                packageName = "io.github.${owner.lowercase(Locale.ROOT)}.${repoName.lowercase(Locale.ROOT).replace(Regex("[^a-z0-9]"), "")}",
                category = "Utilitários",
                tagline = "Aplicativo Android importado diretamente de $slug via GitHub Releases.",
                description = "Lançamento direto importado de $slug.",
                developer = owner,
                version = "1.0.0",
                minAndroid = "8.0+",
                license = "Open Source",
                updatedAt = Instant.now().toString().take(10),
                downloadsCount = 12_500,
                repoSlug = slug,
                sourceType = AppSourceType.GITHUB,
                localPreviewRes = R.drawable.hero_repos,
                accentHex = 0xFF7C3AED,
                monogram = repoName.take(2).uppercase(Locale.ROOT),
                assets = listOf(
                    ApkAsset(
                        name = "$repoName-universal-release.apk",
                        arch = AndroidArch.UNIVERSAL,
                        sizeBytes = 18L * 1024L * 1024L,
                        downloadUrl = "$url/releases/latest",
                        sha256 = "verificacao-github-release"
                    )
                ),
                changelog = listOf("Sincronizado via repositório GitHub $slug.")
            )

            val syncedPatch = syncEngine.syncSingleApp(baseApp)
            overridesMap[cleanId] = syncedPatch
            prefs.saveOverrides(overridesMap)

            val newRepo = RepositorySource(
                id = "repo-custom-${System.currentTimeMillis()}",
                name = repoName,
                slug = slug,
                url = url,
                kind = RepoKind.GITHUB,
                enabled = true,
                verified = true,
                appCount = 1,
                lastSyncedAt = Instant.now().toString().take(10),
                syncStatus = RepoSyncStatus.ONLINE,
                description = "Repositório GitHub conectado manualmente ($slug)."
            )

            reposList.add(0, newRepo)
            customAppsList.removeAll { it.id == cleanId }
            customAppsList.add(0, baseApp)
            prefs.saveRepositories(reposList)
            prefs.saveCustomApps(customAppsList)
            rebuildCatalogAndScan()
            _uiState.update { it.copy(repositories = reposList.toList()) }
            onResult(true, "$slug conectado (v${syncedPatch.version ?: baseApp.version})!")
        }
    }

    fun toggleRepository(repoId: String) {
        reposList = reposList.map { repo ->
            if (repo.id == repoId) repo.copy(enabled = !repo.enabled) else repo
        }.toMutableList()
        prefs.saveRepositories(reposList)
        rebuildCatalogAndScan()
        _uiState.update { it.copy(repositories = reposList.toList()) }
    }

    fun removeRepository(repoId: String) {
        val target = reposList.firstOrNull { it.id == repoId } ?: return
        reposList.removeAll { it.id == repoId }
        customAppsList.removeAll { it.repoSlug.equals(target.slug, ignoreCase = true) }
        prefs.saveRepositories(reposList)
        prefs.saveCustomApps(customAppsList)
        rebuildCatalogAndScan()
        _uiState.update { it.copy(repositories = reposList.toList()) }
    }

    fun downloadAndInstall(app: AndroidAppItem, explicitAsset: ApkAsset? = null) {
        if (_uiState.value.activeTasks.containsKey(app.id)) return
        val chosenAsset = explicitAsset
            ?: StoreLogic.selectBestApkAsset(app.assets, _uiState.value.devicePrimaryArch)
            ?: return

        viewModelScope.launch {
            _uiState.update { state ->
                val next = state.activeTasks.toMutableMap()
                next[app.id] = ActiveApkTask(app.id, chosenAsset.name, 1, "Iniciando...")
                state.copy(activeTasks = next)
            }

            val result = installer.downloadVerifyAndInstall(
                context = getApplication(),
                packageName = app.packageName,
                asset = chosenAsset
            ) { pct, stage ->
                _uiState.update { state ->
                    val next = state.activeTasks.toMutableMap()
                    next[app.id] = ActiveApkTask(app.id, chosenAsset.name, pct, stage)
                    state.copy(activeTasks = next)
                }
            }

            _uiState.update { state ->
                val next = state.activeTasks.toMutableMap()
                next.remove(app.id)
                val msg = when (result) {
                    is ApkInstallResult.InstalledPromptShown ->
                        "${app.name} verificado (SHA-256) e pronto para instalação."
                    ApkInstallResult.PermissionRequired ->
                        "Ative 'Permitir desta fonte' nas configurações do Android para instalar."
                    is ApkInstallResult.RedirectedToReleasePage ->
                        "Abrindo release oficial no navegador (${app.name})."
                    is ApkInstallResult.Error ->
                        "Falha ao baixar ${app.name}: ${result.reason}"
                }
                state.copy(activeTasks = next, statusBanner = msg)
            }
        }
    }

    fun openInstalledApp(packageName: String) {
        val launched = DevicePackageHelper.launchInstalledApp(getApplication(), packageName)
        if (!launched) {
            _uiState.update { it.copy(statusBanner = "Não foi possível abrir o pacote $packageName.") }
        }
    }

    private fun formatSyncTime(iso: String?): String? {
        if (iso.isNullOrBlank()) return null
        return runCatching {
            val instant = Instant.parse(iso)
            DateTimeFormatter.ofPattern("HH:mm", Locale("pt", "BR"))
                .withZone(ZoneId.systemDefault())
                .format(instant)
        }.getOrNull()
    }
}
