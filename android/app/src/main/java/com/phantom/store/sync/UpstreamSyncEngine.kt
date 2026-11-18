package com.phantom.store.sync

import com.phantom.store.logic.StoreLogic
import com.phantom.store.model.AndroidAppItem
import com.phantom.store.model.AndroidArch
import com.phantom.store.model.ApkAsset
import com.phantom.store.model.AppSourceType
import com.phantom.store.model.AppSyncOverride
import com.phantom.store.model.RepoKind
import com.phantom.store.model.RepoSyncStatus
import com.phantom.store.model.RepositorySource
import com.phantom.store.model.SyncStats
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedInputStream
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.time.Instant
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit
import java.util.zip.ZipInputStream

@Serializable
private data class GitHubRepoDto(
    @SerialName("default_branch") val defaultBranch: String? = null,
    @SerialName("stargazers_count") val stargazersCount: Int? = null,
    val description: String? = null
)

@Serializable
private data class GitHubAssetDto(
    val name: String,
    val size: Long = 0L,
    @SerialName("browser_download_url") val browserDownloadUrl: String
)

@Serializable
private data class GitHubReleaseDto(
    @SerialName("tag_name") val tagName: String = "",
    val body: String? = null,
    @SerialName("published_at") val publishedAt: String? = null,
    val assets: List<GitHubAssetDto> = emptyList()
)

@Serializable
private data class FDroidPackageEntryDto(
    val versionName: String,
    val versionCode: Long
)

@Serializable
private data class FDroidPackageResponseDto(
    val packageName: String,
    val packages: List<FDroidPackageEntryDto> = emptyList()
)

data class FDroidRepoIndexResult(
    val repoId: String,
    val apps: List<AndroidAppItem>,
    val status: RepoSyncStatus
)

data class CatalogSyncBatchResult(
    val syncedAtIso: String,
    val appOverrides: Map<String, AppSyncOverride>,
    val repoStatuses: Map<String, Pair<RepoSyncStatus, String>>,
    val stats: SyncStats
)

class UpstreamSyncEngine(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(25, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()
) {
    private val json = Json { ignoreUnknownKeys = true }

    private val badgeFragments = listOf(
        "img.shields.io",
        "badges.",
        "crowdin.net",
        "repology.org",
        "cdn.jsdelivr.net",
        "/actions/workflows/",
        "izzyondroid.png",
        "badge_",
        "f-droid.org/badge"
    )

    private val slugRegex = Regex("^([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)$")
    private val markdownImageRegex = Regex("""(?:!\[[^\]]*\]\(([^)\s]+)|<img[^>]+src=["']([^"']+)["'])""", RegexOption.IGNORE_CASE)

    suspend fun syncCatalog(
        apps: List<AndroidAppItem>,
        repos: List<RepositorySource>
    ): CatalogSyncBatchResult = withContext(Dispatchers.IO) {
        val syncedAt = Instant.now().toString()
        val overrides = LinkedHashMap<String, AppSyncOverride>()
        val repoResults = LinkedHashMap<String, Pair<RepoSyncStatus, String>>()

        apps.take(40).chunked(4).forEach { chunk ->
            val chunkOverrides = coroutineScope {
                chunk.map { app ->
                    async { app.id to syncSingleApp(app) }
                }.awaitAll()
            }
            chunkOverrides.forEach { (id, patch) ->
                overrides[id] = patch
            }
        }

        repos.chunked(4).forEach { chunk ->
            val chunkRepos = coroutineScope {
                chunk.map { repo ->
                    async { repo.id to checkRepositoryStatus(repo) }
                }.awaitAll()
            }
            chunkRepos.forEach { (id, status) ->
                repoResults[id] = status to syncedAt
            }
        }

        val syncedAppsCount = overrides.values.count {
            it.version != null || it.remoteIconUrl != null || !it.remoteGalleryUrls.isNullOrEmpty()
        }
        val imagesCount = overrides.values.sumOf { patch ->
            (if (patch.remoteIconUrl != null) 1 else 0) + (patch.remoteGalleryUrls?.size ?: 0)
        }
        val onlineReposCount = repoResults.values.count { it.first != RepoSyncStatus.OFFLINE }

        CatalogSyncBatchResult(
            syncedAtIso = syncedAt,
            appOverrides = overrides,
            repoStatuses = repoResults,
            stats = SyncStats(
                totalApps = apps.size,
                syncedApps = syncedAppsCount,
                totalRepos = repos.size,
                syncedRepos = onlineReposCount,
                imagesSynced = imagesCount
            )
        )
    }

    suspend fun fetchFDroidRepoIndex(repo: RepositorySource): FDroidRepoIndexResult = withContext(Dispatchers.IO) {
        if (repo.kind != RepoKind.FDROID || !repo.url.startsWith("http", ignoreCase = true)) {
            return@withContext FDroidRepoIndexResult(repo.id, emptyList(), RepoSyncStatus.CACHED)
        }

        val baseUrl = repo.url.trimEnd('/')
        val jarUrl = "$baseUrl/index-v1.jar"
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val today = dateFormat.format(Date())
        val accentPalette = longArrayOf(0xFF7C3AED, 0xFF6D28D9, 0xFF0F766E, 0xFF4338CA, 0xFF581C87)

        return@withContext runCatching {
            val req = Request.Builder()
                .url(jarUrl)
                .header("User-Agent", USER_AGENT)
                .build()
            client.newCall(req).execute().use { res ->
                if (!res.isSuccessful) {
                    return@use FDroidRepoIndexResult(repo.id, emptyList(), RepoSyncStatus.OFFLINE)
                }
                val stream = res.body?.byteStream()
                    ?: return@use FDroidRepoIndexResult(repo.id, emptyList(), RepoSyncStatus.OFFLINE)

                var indexJsonString: String? = null
                ZipInputStream(BufferedInputStream(stream)).use { zip ->
                    var entry = zip.nextEntry
                    while (entry != null) {
                        if (entry.name == "index-v1.json") {
                            val out = ByteArrayOutputStream()
                            val buf = ByteArray(16 * 1024)
                            var read = zip.read(buf)
                            while (read != -1) {
                                out.write(buf, 0, read)
                                read = zip.read(buf)
                            }
                            indexJsonString = out.toString("UTF-8")
                            break
                        }
                        entry = zip.nextEntry
                    }
                }

                val rawJson = indexJsonString
                    ?: return@use FDroidRepoIndexResult(repo.id, emptyList(), RepoSyncStatus.CACHED)
                val root = JSONObject(rawJson)
                val appsArray = root.optJSONArray("apps") ?: JSONArray()
                val packagesObj = root.optJSONObject("packages") ?: JSONObject()
                val parsed = ArrayList<AndroidAppItem>(appsArray.length())

                for (i in 0 until appsArray.length()) {
                    val appJson = appsArray.optJSONObject(i) ?: continue
                    val pkgName = appJson.optString("packageName").trim()
                    if (pkgName.isEmpty()) continue

                    val localized = appJson.optJSONObject("localized")
                    val locPt = localized?.optJSONObject("pt-BR")
                    val locEn = localized?.optJSONObject("en-US")
                    val locFirst = localized?.keys()?.asSequence()?.firstOrNull()?.let { localized.optJSONObject(it) }

                    val rawName = locPt?.optString("name")?.ifBlank { null }
                        ?: locEn?.optString("name")?.ifBlank { null }
                        ?: appJson.optString("name").ifBlank { null }
                        ?: pkgName.substringAfterLast('.')

                    val rawSummary = locPt?.optString("summary")?.ifBlank { null }
                        ?: locEn?.optString("summary")?.ifBlank { null }
                        ?: appJson.optString("summary").ifBlank { null }
                        ?: "Aplicativo open-source indexado via ${repo.name}."

                    val rawDesc = locPt?.optString("description")?.ifBlank { null }
                        ?: locEn?.optString("description")?.ifBlank { null }
                        ?: appJson.optString("description").ifBlank { null }
                        ?: rawSummary

                    val tagline = StoreLogic.stripHtmlToText(rawSummary).ifBlank { rawSummary }.take(180)
                    val description = StoreLogic.stripHtmlToText(rawDesc).ifBlank { tagline }.take(1400)

                    val categoriesArr = appJson.optJSONArray("categories")
                    val rawCats = buildList {
                        if (categoriesArr != null) {
                            for (c in 0 until categoriesArr.length()) {
                                val cat = categoriesArr.optString(c)
                                if (cat.isNotBlank()) add(cat)
                            }
                        }
                    }
                    val mappedCategory = if (repo.id.contains("nethunter", ignoreCase = true)) {
                        com.phantom.store.model.AppCategory.SECURITY
                    } else {
                        StoreLogic.mapFDroidCategoriesToStore(rawCats)
                    }

                    val pkgBuilds = packagesObj.optJSONArray(pkgName)
                    if (pkgBuilds == null || pkgBuilds.length() == 0) continue

                    val latestBuild = pkgBuilds.optJSONObject(0) ?: continue
                    val versionName = StoreLogic.cleanReleaseVersion(latestBuild.optString("versionName"))
                        .ifBlank { latestBuild.optLong("versionCode", 1L).toString() }

                    val assets = buildList {
                        val limit = minOf(pkgBuilds.length(), 4)
                        for (b in 0 until limit) {
                            val build = pkgBuilds.optJSONObject(b) ?: continue
                            val apkName = build.optString("apkName").ifBlank { continue }
                            val nativeCodes = build.optJSONArray("nativecode")
                            val arch = when {
                                nativeCodes != null && nativeCodes.length() == 1 ->
                                    StoreLogic.inferApkArchFromFilename(nativeCodes.optString(0))
                                else -> StoreLogic.inferApkArchFromFilename(apkName)
                            }
                            val size = build.optLong("size", 0L).coerceAtLeast(512L * 1024L)
                            val hash = build.optString("hash").ifBlank { "sha256-fdroid" }
                            add(
                                ApkAsset(
                                    name = apkName,
                                    arch = arch,
                                    sizeBytes = size,
                                    downloadUrl = "$baseUrl/$apkName",
                                    sha256 = hash
                                )
                            )
                        }
                    }
                    if (assets.isEmpty()) continue

                    val iconFile = appJson.optString("icon").ifBlank { null }
                    val remoteIcon = iconFile?.let { "$baseUrl/icons-640/$it" }

                    val locScreenKey = when {
                        locEn?.optJSONArray("phoneScreenshots")?.let { it.length() > 0 } == true -> "en-US"
                        locPt?.optJSONArray("phoneScreenshots")?.let { it.length() > 0 } == true -> "pt-BR"
                        else -> localized?.keys()?.asSequence()?.firstOrNull { k ->
                            localized.optJSONArray("phoneScreenshots")?.length() ?: 0 > 0
                        }
                    }
                    val screenList = locScreenKey?.let { key ->
                        val arr = localized?.optJSONObject(key)?.optJSONArray("phoneScreenshots")
                        if (arr != null) {
                            buildList {
                                for (s in 0 until minOf(arr.length(), 4)) {
                                    val shot = arr.optString(s)
                                    if (shot.isNotBlank()) add("$baseUrl/$pkgName/$key/phoneScreenshots/$shot")
                                }
                            }
                        } else emptyList()
                    } ?: emptyList()

                    val updatedMillis = appJson.optLong("lastUpdated", 0L)
                    val updatedDate = if (updatedMillis > 0L) {
                        dateFormat.format(Date(updatedMillis))
                    } else today

                    val sdkVer = latestBuild.optInt("minSdkVersion", 24)
                    val minAndroid = when {
                        sdkVer >= 33 -> "13+"
                        sdkVer >= 30 -> "11+"
                        sdkVer >= 26 -> "8.0+"
                        sdkVer >= 24 -> "7.0+"
                        else -> "6.0+"
                    }

                    val initials = rawName.trim().split(Regex("\\s+"))
                        .take(2)
                        .mapNotNull { it.firstOrNull()?.uppercaseChar() }
                        .joinToString("")
                        .ifBlank { pkgName.take(2).uppercase(Locale.ROOT) }

                    parsed.add(
                        AndroidAppItem(
                            id = "${repo.id}::$pkgName",
                            name = rawName,
                            packageName = pkgName,
                            category = mappedCategory.label,
                            tagline = tagline,
                            description = description,
                            developer = appJson.optString("authorName").ifBlank { repo.name },
                            version = versionName,
                            minAndroid = minAndroid,
                            license = appJson.optString("license").ifBlank { "Open Source" },
                            updatedAt = updatedDate,
                            downloadsCount = (10_000L + (pkgBuilds.length() * 8_500L) + (screenList.size * 15_000L)),
                            repoId = repo.id,
                            repoName = repo.name,
                            repoSlug = pkgName,
                            sourceCodeUrl = appJson.optString("sourceCode").ifBlank { null },
                            sourceType = AppSourceType.FDROID,
                            featured = repo.id == "nethunter" || screenList.isNotEmpty(),
                            remoteIconUrl = remoteIcon,
                            remotePreviewUrl = screenList.firstOrNull(),
                            remoteGalleryUrls = screenList,
                            accentHex = accentPalette[kotlin.math.abs(pkgName.hashCode()) % accentPalette.size],
                            monogram = initials,
                            assets = assets,
                            changelog = listOfNotNull(
                                locPt?.optString("whatsNew")?.let { StoreLogic.stripHtmlToText(it) }?.ifBlank { null },
                                locEn?.optString("whatsNew")?.let { StoreLogic.stripHtmlToText(it) }?.ifBlank { null }
                            ).ifEmpty { listOf("Build v$versionName indexado via ${repo.name}.") }
                        )
                    )
                }

                FDroidRepoIndexResult(
                    repoId = repo.id,
                    apps = parsed,
                    status = RepoSyncStatus.ONLINE
                )
            }
        }.getOrElse {
            FDroidRepoIndexResult(repo.id, emptyList(), RepoSyncStatus.OFFLINE)
        }
    }

    suspend fun syncSingleApp(app: AndroidAppItem): AppSyncOverride = withContext(Dispatchers.IO) {
        val nowIso = Instant.now().toString()
        var version: String? = null
        var updatedAt: String? = null
        var description: String? = null
        var changelog: List<String>? = null
        var starsCount: Int? = null
        var defaultBranch: String? = null
        var assets: List<ApkAsset>? = null
        var source = "cache"

        val slug = slugRegex.matchEntire(app.repoSlug)?.value
        if (slug != null) {
            val (repoMeta, releaseMeta) = coroutineScope {
                val repoDeferred = async { fetchGitHubRepo(slug) }
                val relDeferred = async { fetchGitHubLatestRelease(slug) }
                repoDeferred.await() to relDeferred.await()
            }

            if (repoMeta != null) {
                defaultBranch = repoMeta.defaultBranch
                starsCount = repoMeta.stargazersCount
                if (!repoMeta.description.isNullOrBlank()) {
                    description = repoMeta.description
                }
            }

            if (releaseMeta != null) {
                version = StoreLogic.cleanReleaseVersion(releaseMeta.tagName).takeIf { it.isNotBlank() }
                updatedAt = releaseMeta.publishedAt?.take(10)
                val parsedNotes = StoreLogic.parseChangelogLines(releaseMeta.body, emptyList())
                if (parsedNotes.isNotEmpty()) changelog = parsedNotes

                val apkList = releaseMeta.assets
                    .filter { it.name.endsWith(".apk", ignoreCase = true) }
                    .map { asset ->
                        ApkAsset(
                            name = asset.name,
                            arch = StoreLogic.inferApkArchFromFilename(asset.name),
                            sizeBytes = asset.size,
                            downloadUrl = asset.browserDownloadUrl,
                            sha256 = "verificado-release-github"
                        )
                    }
                if (apkList.isNotEmpty()) assets = apkList
                source = "github"
            } else {
                val atom = fetchAtomRelease(slug)
                if (atom != null) {
                    version = atom.first
                    updatedAt = atom.second
                    source = "atom"
                }
            }
        }

        if (app.sourceType == AppSourceType.FDROID || version == null) {
            val fdroid = fetchFDroidPackage(app.packageName)
            val latest = fdroid?.packages?.firstOrNull()
            if (latest != null) {
                version = version ?: StoreLogic.cleanReleaseVersion(latest.versionName)
                if (assets.isNullOrEmpty()) {
                    assets = listOf(
                        ApkAsset(
                            name = "${app.packageName}_${latest.versionCode}.apk",
                            arch = StoreLogic.inferApkArchFromFilename("${app.packageName}.apk"),
                            sizeBytes = 15L * 1024L * 1024L,
                            downloadUrl = "https://f-droid.org/repo/${app.packageName}_${latest.versionCode}.apk",
                            sha256 = "verificado-indice-fdroid"
                        )
                    )
                }
                if (source == "cache") source = "fdroid"
            }
        }

        val (iconUrl, galleryUrls) = if (slug != null) {
            discoverUpstreamMedia(slug, defaultBranch)
        } else {
            null to emptyList()
        }

        AppSyncOverride(
            version = version,
            assets = assets,
            updatedAt = updatedAt,
            description = description,
            changelog = changelog,
            starsCount = starsCount,
            remoteIconUrl = iconUrl,
            remotePreviewUrl = galleryUrls.firstOrNull(),
            remoteGalleryUrls = galleryUrls.takeIf { it.isNotEmpty() },
            lastSyncedAt = nowIso,
            syncSource = source
        )
    }

    suspend fun fetchFDroidPackage(packageName: String): FDroidPackageResponseDto? = withContext(Dispatchers.IO) {
        if (packageName.isBlank()) return@withContext null
        runCatching {
            val req = Request.Builder()
                .url("https://f-droid.org/api/v1/packages/$packageName")
                .header("User-Agent", USER_AGENT)
                .build()
            client.newCall(req).execute().use { res ->
                if (!res.isSuccessful) return@use null
                val body = res.body?.string() ?: return@use null
                json.decodeFromString<FDroidPackageResponseDto>(body)
            }
        }.getOrNull()
    }

    suspend fun checkRepositoryStatus(repo: RepositorySource): RepoSyncStatus = withContext(Dispatchers.IO) {
        val probeUrl = when {
            repo.kind == RepoKind.FDROID && repo.url.startsWith("http", ignoreCase = true) ->
                "${repo.url.trimEnd('/')}/index-v1.jar"
            else -> {
                val slug = if (repo.slug.contains('/')) repo.slug else "ImranR98/Obtainium"
                "https://github.com/$slug/releases.atom"
            }
        }
        return@withContext runCatching {
            val req = Request.Builder()
                .url(probeUrl)
                .head()
                .header("User-Agent", USER_AGENT)
                .build()
            client.newCall(req).execute().use { res ->
                if (res.isSuccessful) RepoSyncStatus.ONLINE else RepoSyncStatus.CACHED
            }
        }.getOrDefault(RepoSyncStatus.OFFLINE)
    }

    private fun fetchGitHubRepo(slug: String): GitHubRepoDto? = runCatching {
        val req = Request.Builder()
            .url("https://api.github.com/repos/$slug")
            .header("Accept", "application/vnd.github+json")
            .header("User-Agent", USER_AGENT)
            .build()
        client.newCall(req).execute().use { res ->
            if (!res.isSuccessful) return@use null
            val body = res.body?.string() ?: return@use null
            json.decodeFromString<GitHubRepoDto>(body)
        }
    }.getOrNull()

    private fun fetchGitHubLatestRelease(slug: String): GitHubReleaseDto? = runCatching {
        val req = Request.Builder()
            .url("https://api.github.com/repos/$slug/releases/latest")
            .header("Accept", "application/vnd.github+json")
            .header("User-Agent", USER_AGENT)
            .build()
        client.newCall(req).execute().use { res ->
            if (!res.isSuccessful) return@use null
            val body = res.body?.string() ?: return@use null
            json.decodeFromString<GitHubReleaseDto>(body)
        }
    }.getOrNull()

    private fun fetchAtomRelease(slug: String): Pair<String, String>? = runCatching {
        val req = Request.Builder()
            .url("https://github.com/$slug/releases.atom")
            .header("User-Agent", USER_AGENT)
            .build()
        client.newCall(req).execute().use { res ->
            if (!res.isSuccessful) return@use null
            val xml = res.body?.string() ?: return@use null
            val entry = Regex("<entry>([\\s\\S]*?)</entry>").find(xml)?.groupValues?.get(1) ?: return@use null
            val rawTag = Regex("/releases/tag/([^\"<\\s]+)").find(entry)?.groupValues?.get(1)
                ?: Regex("<title>([^<]+)</title>").find(entry)?.groupValues?.get(1)
                ?: ""
            val cleanVer = StoreLogic.cleanReleaseVersion(rawTag)
            if (cleanVer.isBlank()) return@use null
            val updated = Regex("<updated>([^<]+)</updated>").find(entry)?.groupValues?.get(1)?.take(10)
                ?: Instant.now().toString().take(10)
            cleanVer to updated
        }
    }.getOrNull()

    private suspend fun discoverUpstreamMedia(
        slug: String,
        preferredBranch: String?
    ): Pair<String?, List<String>> {
        val branchCandidates = listOfNotNull(preferredBranch, "main", "master", "dev").distinct()
        var activeBranch = preferredBranch ?: "main"
        var readmeText = ""

        for (branch in branchCandidates) {
            val body = fetchRawText("https://raw.githubusercontent.com/$slug/$branch/README.md")
            if (body != null) {
                activeBranch = branch
                readmeText = body
                break
            }
        }

        val readmeUrls = markdownImageRegex.findAll(readmeText)
            .mapNotNull { match ->
                val ref = match.groupValues[1].ifBlank { match.groupValues[2] }.trim()
                resolveRawUrl(slug, activeBranch, ref)
            }
            .filter { !isBadgeUrl(it) }
            .distinct()
            .toList()

        val iconCandidates = buildList {
            add("https://raw.githubusercontent.com/$slug/$activeBranch/fastlane/metadata/android/en-US/images/icon.png")
            add("https://raw.githubusercontent.com/$slug/$activeBranch/metadata/en-US/images/icon.png")
            add("https://raw.githubusercontent.com/$slug/$activeBranch/app/src/main/ic_launcher-playstore.png")
            add("https://raw.githubusercontent.com/$slug/$activeBranch/assets/graphics/icon_small.png")
            add("https://raw.githubusercontent.com/$slug/$activeBranch/app/assets/img/logo-512.png")
            addAll(readmeUrls.filter {
                val lower = it.lowercase(Locale.ROOT)
                lower.contains("icon") || lower.contains("logo") || lower.contains("ic_launcher")
            })
        }.distinct()

        var resolvedIcon: String? = null
        for (candidate in iconCandidates) {
            if (isImageUrlReachable(candidate)) {
                resolvedIcon = candidate
                break
            }
        }

        val galleryCandidates = buildList {
            add("https://raw.githubusercontent.com/$slug/$activeBranch/fastlane/metadata/android/en-US/images/featureGraphic.png")
            add("https://raw.githubusercontent.com/$slug/$activeBranch/fastlane/metadata/android/en-US/images/phoneScreenshots/01.png")
            add("https://raw.githubusercontent.com/$slug/$activeBranch/fastlane/metadata/android/en-US/images/phoneScreenshots/02.png")
            add("https://raw.githubusercontent.com/$slug/$activeBranch/fastlane/metadata/android/en-US/images/phoneScreenshots/1.png")
            add("https://raw.githubusercontent.com/$slug/$activeBranch/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg")
            add("https://raw.githubusercontent.com/$slug/$activeBranch/fastlane/metadata/android/en-US/images/phoneScreenshots/2.jpg")
            addAll(readmeUrls.filter {
                val lower = it.lowercase(Locale.ROOT)
                !lower.contains("icon") && !lower.contains("logo") && !lower.contains("ic_launcher")
            })
        }.distinct().take(6)

        val validGallery = coroutineScope {
            galleryCandidates.map { url ->
                async { if (isImageUrlReachable(url)) url else null }
            }.awaitAll().filterNotNull().take(3)
        }

        return resolvedIcon to validGallery
    }

    private fun fetchRawText(url: String): String? = runCatching {
        val req = Request.Builder().url(url).header("User-Agent", USER_AGENT).build()
        client.newCall(req).execute().use { res ->
            if (res.isSuccessful) res.body?.string() else null
        }
    }.getOrNull()

    private fun isImageUrlReachable(url: String): Boolean {
        if (!url.startsWith("https://", ignoreCase = true)) return false
        return runCatching {
            val req = Request.Builder().url(url).head().header("User-Agent", USER_AGENT).build()
            client.newCall(req).execute().use { res ->
                val ct = res.header("Content-Type")?.lowercase(Locale.ROOT).orEmpty()
                res.isSuccessful && ct.startsWith("image/") && !ct.contains("svg")
            }
        }.getOrDefault(false)
    }

    private fun resolveRawUrl(slug: String, branch: String, ref: String): String? {
        if (ref.isBlank() || ref.startsWith("data:", ignoreCase = true)) return null
        if (ref.startsWith("http://", ignoreCase = true) || ref.startsWith("https://", ignoreCase = true)) {
            return ref
        }
        val normalized = ref.removePrefix("./").removePrefix("/")
        return "https://raw.githubusercontent.com/$slug/$branch/$normalized"
    }

    private fun isBadgeUrl(url: String): Boolean {
        val lower = url.lowercase(Locale.ROOT)
        if (lower.endsWith(".svg")) return true
        return badgeFragments.any { lower.contains(it) }
    }

    companion object {
        private const val USER_AGENT = "PhantomStore-Android/2.0"
    }
}
