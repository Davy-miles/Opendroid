package com.phantom.store.model

import androidx.annotation.DrawableRes
import kotlinx.serialization.Serializable

enum class StoreTab(val label: String) {
    TODAY("Explorar"),
    APPS("Catálogo"),
    REPOS("Fontes"),
    LIBRARY("Biblioteca")
}

enum class AppCategory(val label: String) {
    ALL("Todos"),
    SECURITY("Segurança"),
    PRIVACY("Privacidade"),
    MUSIC("Música"),
    VIDEO("Vídeo"),
    INTERNET("Internet"),
    DEVELOPMENT("Desenvolvimento"),
    READING("Leitura"),
    SYSTEM("Sistema"),
    UTILITIES("Utilitários")
}

@Serializable
enum class AndroidArch(val label: String) {
    ARM64_V8A("arm64-v8a"),
    ARMEABI_V7A("armeabi-v7a"),
    UNIVERSAL("universal")
}

enum class SortOption(val label: String) {
    FEATURED("Destaques"),
    RECENT("Mais recentes"),
    DOWNLOADS("Mais baixados"),
    NAME("Alfabética (A–Z)"),
    SIZE("Menor tamanho")
}

@Serializable
enum class PermissionRisk(val label: String) {
    LOW("Risco baixo"),
    MODERATE("Risco moderado"),
    SENSITIVE("Risco sensível")
}

@Serializable
data class AppPermission(
    val code: String,
    val label: String,
    val risk: PermissionRisk,
    val reason: String
)

@Serializable
data class ApkAsset(
    val name: String,
    val arch: AndroidArch,
    val sizeBytes: Long,
    val downloadUrl: String,
    val sha256: String
)

@Serializable
enum class AppSourceType {
    CURATED,
    GITHUB,
    FDROID
}

@Serializable
data class AndroidAppItem(
    val id: String,
    val name: String,
    val packageName: String,
    val category: String,
    val tagline: String,
    val description: String,
    val developer: String,
    val version: String,
    val minAndroid: String,
    val license: String,
    val updatedAt: String,
    val downloadsCount: Long,
    val starsCount: Int? = null,
    val lastSyncedAt: String? = null,
    val repoId: String = "github-flagship",
    val repoName: String = "GitHub Direct APK Releases",
    val repoSlug: String,
    val sourceCodeUrl: String? = null,
    val sourceType: AppSourceType = AppSourceType.CURATED,
    val featured: Boolean = false,
    val remoteIconUrl: String? = null,
    val remotePreviewUrl: String? = null,
    val remoteGalleryUrls: List<String> = emptyList(),
    @DrawableRes val localIconRes: Int? = null,
    @DrawableRes val localPreviewRes: Int? = null,
    val iconZoom: Boolean = false,
    val accentHex: Long = 0xFF9333EA,
    val monogram: String,
    val assets: List<ApkAsset>,
    val permissions: List<AppPermission> = emptyList(),
    val changelog: List<String> = emptyList()
)

@Serializable
data class AppSyncOverride(
    val version: String? = null,
    val assets: List<ApkAsset>? = null,
    val updatedAt: String? = null,
    val description: String? = null,
    val changelog: List<String>? = null,
    val starsCount: Int? = null,
    val remoteIconUrl: String? = null,
    val remotePreviewUrl: String? = null,
    val remoteGalleryUrls: List<String>? = null,
    val lastSyncedAt: String,
    val syncSource: String
)

@Serializable
enum class RepoKind {
    GITHUB,
    FDROID
}

@Serializable
enum class RepoSyncStatus(val label: String) {
    ONLINE("Online"),
    CACHED("Em cache"),
    OFFLINE("Offline")
}

@Serializable
data class RepositorySource(
    val id: String,
    val name: String,
    val slug: String,
    val url: String,
    val kind: RepoKind,
    val enabled: Boolean = true,
    val verified: Boolean = true,
    val appCount: Int = 0,
    val lastSyncedAt: String,
    val syncStatus: RepoSyncStatus = RepoSyncStatus.CACHED,
    val description: String
)

data class InstalledPackageState(
    val packageName: String,
    val installedVersionName: String,
    val installedVersionCode: Long
)

data class ActiveApkTask(
    val appId: String,
    val assetName: String,
    val progressPercent: Int,
    val stageLabel: String,
    val verifiedSha256: String? = null
)

data class SyncStats(
    val totalApps: Int = 0,
    val syncedApps: Int = 0,
    val totalRepos: Int = 0,
    val syncedRepos: Int = 0,
    val imagesSynced: Int = 0
)

data class RepoInputValidation(
    val valid: Boolean,
    val slug: String? = null,
    val url: String? = null,
    val error: String? = null
)
