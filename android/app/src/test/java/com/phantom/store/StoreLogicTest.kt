package com.phantom.store

import com.phantom.store.data.CuratedCatalog
import com.phantom.store.logic.StoreLogic
import com.phantom.store.model.AndroidAppItem
import com.phantom.store.model.AndroidArch
import com.phantom.store.model.ApkAsset
import com.phantom.store.model.AppCategory
import com.phantom.store.model.AppSyncOverride
import com.phantom.store.model.SortOption
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class StoreLogicTest {

    @Test
    fun cleanReleaseVersion_stripsPrefixAndCommitHash() {
        assertEquals("153.0.8010.37", StoreLogic.cleanReleaseVersion("v153.0.8010.37-11507ac1061b5ea225269e0"))
        assertEquals("0.29.3", StoreLogic.cleanReleaseVersion("V0.29.3"))
    }

    @Test
    fun hasUpdateAvailable_comparesSemverProperly() {
        assertTrue(StoreLogic.hasUpdateAvailable("3.8.9", "3.9.0"))
        assertFalse(StoreLogic.hasUpdateAvailable("v3.9.0", "3.9.0"))
        assertFalse(StoreLogic.hasUpdateAvailable("4.0.0", "3.9.9"))
    }

    @Test
    fun validateGitHubRepoInput_acceptsUrlsAndSlugs() {
        val validUrl = StoreLogic.validateGitHubRepoInput("https://github.com/TeamNewPipe/NewPipe.git")
        assertTrue(validUrl.valid)
        assertEquals("TeamNewPipe/NewPipe", validUrl.slug)

        val invalid = StoreLogic.validateGitHubRepoInput("https://example.com/a/b")
        assertFalse(invalid.valid)
    }

    @Test
    fun isValidAndroidPackageId_validatesFormat() {
        assertTrue(StoreLogic.isValidAndroidPackageId("com.termux"))
        assertTrue(StoreLogic.isValidAndroidPackageId("org.schabi.newpipe"))
        assertFalse(StoreLogic.isValidAndroidPackageId("TeamNewPipe/NewPipe"))
    }

    @Test
    fun stripHtmlAndMapCategory_handleFDroidMetadataCleanly() {
        val cleaned = StoreLogic.stripHtmlToText("<p>Scanner <b>Wi-Fi</b> &amp; rede.</p><ul><li>Auditoria</li></ul>")
        assertEquals("Scanner Wi-Fi & rede.\n• Auditoria", cleaned)

        assertEquals(AppCategory.SECURITY, StoreLogic.mapFDroidCategoriesToStore(listOf("Security", "NetHunter")))
        assertEquals(AppCategory.MUSIC, StoreLogic.mapFDroidCategoriesToStore(listOf("Music", "Audio")))
        assertEquals(AppCategory.DEVELOPMENT, StoreLogic.mapFDroidCategoriesToStore(listOf("Development")))
        assertEquals(12, CuratedCatalog.initialRepositories.size)
    }

    @Test
    fun selectBestApkAsset_matchesDeviceArchOrFallsBackToUniversal() {
        val assets = listOf(
            ApkAsset("app-arm64.apk", AndroidArch.ARM64_V8A, 10L, "https://x.y/1.apk", "abc"),
            ApkAsset("app-universal.apk", AndroidArch.UNIVERSAL, 20L, "https://x.y/2.apk", "def")
        )
        assertEquals("app-arm64.apk", StoreLogic.selectBestApkAsset(assets, AndroidArch.ARM64_V8A)?.name)
        assertEquals("app-universal.apk", StoreLogic.selectBestApkAsset(assets, AndroidArch.ARMEABI_V7A)?.name)
    }

    @Test
    fun resolveAppWithSync_mergesVersionAndRemoteMediaCleanly() {
        val base = AndroidAppItem(
            id = "newpipe",
            name = "NewPipe",
            packageName = "org.schabi.newpipe",
            category = "Vídeo",
            tagline = "Player leve",
            description = "Desc",
            developer = "TeamNewPipe",
            version = "0.27.4",
            minAndroid = "6.0+",
            license = "GPL-3.0",
            updatedAt = "2026-11-12",
            downloadsCount = 1000L,
            repoSlug = "TeamNewPipe/NewPipe",
            monogram = "NP",
            assets = emptyList()
        )
        val merged = StoreLogic.resolveAppWithSync(
            base,
            AppSyncOverride(
                version = "v0.29.3-abc12345def",
                remoteIconUrl = "https://raw.githubusercontent.com/TeamNewPipe/NewPipe/dev/icon.png",
                remoteGalleryUrls = listOf("https://raw.githubusercontent.com/TeamNewPipe/NewPipe/dev/1.png"),
                starsCount = 35000,
                lastSyncedAt = "2026-11-16T23:50:00Z",
                syncSource = "github"
            )
        )
        assertEquals("0.29.3", merged.version)
        assertEquals(35000, merged.starsCount)
        assertEquals(1, merged.remoteGalleryUrls.size)
    }
}
