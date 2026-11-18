package com.phantom.store.logic

import com.phantom.store.model.AndroidAppItem
import com.phantom.store.model.AndroidArch
import com.phantom.store.model.ApkAsset
import com.phantom.store.model.AppCategory
import com.phantom.store.model.AppSyncOverride
import com.phantom.store.model.RepoInputValidation
import com.phantom.store.model.SortOption
import java.util.Locale

object StoreLogic {

    private val gitHashSuffixRegex = Regex("-[0-9a-fA-F]{8,}$")
    private val slugRegex = Regex("^([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)$")
    private val androidPkgRegex = Regex("^[a-zA-Z][a-zA-Z0-9_]*(\\.[a-zA-Z0-9_]+)+$")

    fun cleanReleaseVersion(rawVersion: String): String {
        val trimmed = rawVersion.trim()
        val withoutPrefix = if (trimmed.startsWith("v", ignoreCase = true)) {
            trimmed.substring(1)
        } else {
            trimmed
        }
        return gitHashSuffixRegex.replace(withoutPrefix, "").trim()
    }

    fun parseSemver(version: String): List<Int> {
        val base = cleanReleaseVersion(version).substringBefore('-')
        if (base.isBlank()) return listOf(0)
        return base.split('.').map { part ->
            part.filter { it.isDigit() }.toIntOrNull() ?: 0
        }
    }

    fun hasUpdateAvailable(installedVersion: String, latestVersion: String): Boolean {
        val a = parseSemver(installedVersion)
        val b = parseSemver(latestVersion)
        val maxLen = maxOf(a.size, b.size, 3)
        for (i in 0 until maxLen) {
            val va = a.getOrElse(i) { 0 }
            val vb = b.getOrElse(i) { 0 }
            if (vb > va) return true
            if (vb < va) return false
        }
        return false
    }

    fun inferApkArchFromFilename(filename: String): AndroidArch {
        val lower = filename.lowercase(Locale.ROOT)
        return when {
            lower.contains("arm64") || lower.contains("aarch64") -> AndroidArch.ARM64_V8A
            lower.contains("armeabi") || lower.contains("armv7") -> AndroidArch.ARMEABI_V7A
            else -> AndroidArch.UNIVERSAL
        }
    }

    fun selectBestApkAsset(assets: List<ApkAsset>, preferredArch: AndroidArch): ApkAsset? {
        if (assets.isEmpty()) return null
        return assets.firstOrNull { it.arch == preferredArch }
            ?: assets.firstOrNull { it.arch == AndroidArch.UNIVERSAL }
            ?: assets.first()
    }

    fun formatBytes(bytes: Long): String {
        if (bytes <= 0L) return "0 MB"
        val mb = bytes.toDouble() / (1024.0 * 1024.0)
        return when {
            mb >= 1000.0 -> String.format(Locale.US, "%.2f GB", mb / 1024.0)
            mb < 1.0 -> "${(bytes / 1024L).coerceAtLeast(1L)} KB"
            else -> String.format(Locale.US, "%.1f MB", mb)
        }
    }

    fun formatCompactCount(count: Long): String {
        return when {
            count >= 1_000_000L -> String.format(Locale.US, "%.1fM", count / 1_000_000.0)
            count >= 1_000L -> "${count / 1_000L}K"
            else -> count.coerceAtLeast(0L).toString()
        }
    }

    fun parseChangelogLines(notes: String?, fallback: List<String>): List<String> {
        if (notes.isNullOrBlank()) return fallback
        val parsed = notes.lines()
            .map { line -> line.trimStart(' ', '*', '-', '•', '#').trim() }
            .filter { line ->
                line.length >= 6 &&
                    !line.startsWith("http", ignoreCase = true) &&
                    !line.contains("full changelog", ignoreCase = true)
            }
            .take(5)
        return parsed.ifEmpty { fallback }
    }

    fun isValidAndroidPackageId(raw: String): Boolean {
        return androidPkgRegex.matches(raw.trim())
    }

    fun validateGitHubRepoInput(rawInput: String): RepoInputValidation {
        val trimmed = rawInput.trim()
        if (trimmed.isEmpty()) {
            return RepoInputValidation(
                valid = false,
                error = "Informe um repositório no formato proprietario/repositorio ou URL do GitHub."
            )
        }

        var candidate = trimmed
        if (candidate.startsWith("http://", ignoreCase = true) ||
            candidate.startsWith("https://", ignoreCase = true)
        ) {
            val cleanedUrl = candidate.substringAfter("://")
            val host = cleanedUrl.substringBefore('/').lowercase(Locale.ROOT)
            if (!host.contains("github.com")) {
                return RepoInputValidation(
                    valid = false,
                    error = "Use uma URL válida do GitHub (ex.: https://github.com/TeamNewPipe/NewPipe)."
                )
            }
            val segments = cleanedUrl.substringAfter('/', "")
                .split('/')
                .filter { it.isNotBlank() }
            if (segments.size < 2) {
                return RepoInputValidation(
                    valid = false,
                    error = "URL incompleta. Inclua usuário e nome do repositório."
                )
            }
            val repoSegment = segments[1].removeSuffix(".git")
            candidate = "${segments[0]}/$repoSegment"
        }

        val match = slugRegex.matchEntire(candidate)
            ?: return RepoInputValidation(
                valid = false,
                error = "Formato inválido. Use proprietario/repositorio (ex.: TeamNewPipe/NewPipe)."
            )

        val slug = "${match.groupValues[1]}/${match.groupValues[2]}"
        return RepoInputValidation(
            valid = true,
            slug = slug,
            url = "https://github.com/$slug"
        )
    }

    private val htmlBreakRegex = Regex("<br\\s*/?>", RegexOption.IGNORE_CASE)
    private val htmlBlockEndRegex = Regex("</(p|div|li|h[1-6])>", RegexOption.IGNORE_CASE)
    private val htmlLiRegex = Regex("<li>", RegexOption.IGNORE_CASE)
    private val htmlTagRegex = Regex("<[^>]+>")
    private val multiNewlineRegex = Regex("\\n{3,}")

    fun stripHtmlToText(raw: String?): String {
        if (raw.isNullOrBlank()) return ""
        var text = raw
        text = htmlBreakRegex.replace(text, "\n")
        text = htmlBlockEndRegex.replace(text, "\n")
        text = htmlLiRegex.replace(text, "• ")
        text = htmlTagRegex.replace(text, "")
        text = text
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&#39;", "'")
            .replace("&nbsp;", " ")
        return multiNewlineRegex.replace(text, "\n\n").trim()
    }

    fun mapFDroidCategoriesToStore(rawCategories: List<String>): AppCategory {
        val joined = rawCategories.joinToString(" ").lowercase(Locale.ROOT)
        return when {
            joined.contains("security") ||
                joined.contains("password") ||
                joined.contains("two-factor") ||
                joined.contains("firewall") ||
                joined.contains("nethunter") ||
                joined.contains("pentest") -> AppCategory.SECURITY

            joined.contains("privacy") ||
                joined.contains("guardian") ||
                joined.contains("tor") ||
                joined.contains("vpn") -> AppCategory.PRIVACY

            joined.contains("music") ||
                joined.contains("audio") ||
                joined.contains("podcast") ||
                joined.contains("radio") ||
                joined.contains("audiobook") -> AppCategory.MUSIC

            joined.contains("video") ||
                joined.contains("multimedia") ||
                joined.contains("camera") ||
                joined.contains("graphics") ||
                joined.contains("photo") -> AppCategory.VIDEO

            joined.contains("internet") ||
                joined.contains("browser") ||
                joined.contains("connectivity") ||
                joined.contains("messaging") ||
                joined.contains("email") ||
                joined.contains("network") -> AppCategory.INTERNET

            joined.contains("development") ||
                joined.contains("terminal") ||
                joined.contains("code") ||
                joined.contains("git") -> AppCategory.DEVELOPMENT

            joined.contains("reading") ||
                joined.contains("book") ||
                joined.contains("news") ||
                joined.contains("wiki") ||
                joined.contains("science & education") ||
                joined.contains("writing") -> AppCategory.READING

            joined.contains("system") ||
                joined.contains("launcher") ||
                joined.contains("keyboard") ||
                joined.contains("battery") ||
                joined.contains("app manager") ||
                joined.contains("app store") -> AppCategory.SYSTEM

            else -> AppCategory.UTILITIES
        }
    }

    fun filterAndSortApps(
        apps: List<AndroidAppItem>,
        category: AppCategory,
        query: String,
        archFilter: AndroidArch?,
        sortBy: SortOption
    ): List<AndroidAppItem> {
        val q = query.trim().lowercase(Locale.ROOT)
        val filtered = apps.filter { app ->
            val matchesCat = category == AppCategory.ALL || app.category.equals(category.label, ignoreCase = true)
            val matchesArch = archFilter == null || app.assets.any {
                it.arch == archFilter || it.arch == AndroidArch.UNIVERSAL
            }
            val matchesQuery = q.isEmpty() ||
                app.name.lowercase(Locale.ROOT).contains(q) ||
                app.tagline.lowercase(Locale.ROOT).contains(q) ||
                app.packageName.lowercase(Locale.ROOT).contains(q) ||
                app.developer.lowercase(Locale.ROOT).contains(q) ||
                app.category.lowercase(Locale.ROOT).contains(q) ||
                app.repoName.lowercase(Locale.ROOT).contains(q) ||
                app.repoSlug.lowercase(Locale.ROOT).contains(q)
            matchesCat && matchesArch && matchesQuery
        }

        return when (sortBy) {
            SortOption.DOWNLOADS -> filtered.sortedByDescending { it.downloadsCount }
            SortOption.RECENT -> filtered.sortedByDescending { it.updatedAt }
            SortOption.NAME -> filtered.sortedBy { it.name.lowercase(Locale.ROOT) }
            SortOption.SIZE -> filtered.sortedBy { it.assets.firstOrNull()?.sizeBytes ?: Long.MAX_VALUE }
            SortOption.FEATURED -> filtered.sortedWith(
                compareByDescending<AndroidAppItem> { it.featured }
                    .thenByDescending { it.downloadsCount }
            )
        }
    }

    fun resolveAppWithSync(app: AndroidAppItem, override: AppSyncOverride?): AndroidAppItem {
        if (override == null) return app

        val mergedGallery = LinkedHashSet<String>()
        override.remoteGalleryUrls?.forEach { if (it.isNotBlank()) mergedGallery.add(it) }
        app.remoteGalleryUrls.forEach { if (it.isNotBlank()) mergedGallery.add(it) }

        val cleanedVersion = override.version?.let { cleanReleaseVersion(it) }?.takeIf { it.isNotBlank() }
        val resolvedRemoteIcon = override.remoteIconUrl?.takeIf { it.isNotBlank() } ?: app.remoteIconUrl

        return app.copy(
            version = cleanedVersion ?: app.version,
            assets = override.assets?.takeIf { it.isNotEmpty() } ?: app.assets,
            updatedAt = override.updatedAt?.takeIf { it.isNotBlank() } ?: app.updatedAt,
            description = override.description?.takeIf { it.isNotBlank() } ?: app.description,
            changelog = override.changelog?.takeIf { it.isNotEmpty() } ?: app.changelog,
            starsCount = override.starsCount ?: app.starsCount,
            lastSyncedAt = override.lastSyncedAt,
            remoteIconUrl = resolvedRemoteIcon,
            remotePreviewUrl = override.remotePreviewUrl?.takeIf { it.isNotBlank() }
                ?: mergedGallery.firstOrNull()
                ?: app.remotePreviewUrl,
            remoteGalleryUrls = mergedGallery.toList()
        )
    }
}
