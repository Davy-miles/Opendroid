package com.phantom.store.data

import android.content.Context
import com.phantom.store.model.AndroidAppItem
import com.phantom.store.model.AppSyncOverride
import com.phantom.store.model.RepositorySource
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class StorePreferences(context: Context) {

    private val prefs = context.getSharedPreferences("phantom_store_v2", Context.MODE_PRIVATE)
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    fun loadOverrides(): Map<String, AppSyncOverride> {
        val raw = prefs.getString(KEY_OVERRIDES, null) ?: return emptyMap()
        return runCatching {
            json.decodeFromString<Map<String, AppSyncOverride>>(raw)
        }.getOrDefault(emptyMap())
    }

    fun saveOverrides(overrides: Map<String, AppSyncOverride>) {
        prefs.edit().putString(KEY_OVERRIDES, json.encodeToString(overrides)).apply()
    }

    fun loadRepositories(defaultRepos: List<RepositorySource>): List<RepositorySource> {
        val raw = prefs.getString(KEY_REPOS, null) ?: return defaultRepos
        return runCatching {
            json.decodeFromString<List<RepositorySource>>(raw).ifEmpty { defaultRepos }
        }.getOrDefault(defaultRepos)
    }

    fun saveRepositories(repos: List<RepositorySource>) {
        prefs.edit().putString(KEY_REPOS, json.encodeToString(repos)).apply()
    }

    fun loadCustomApps(): List<AndroidAppItem> {
        val raw = prefs.getString(KEY_CUSTOM_APPS, null) ?: return emptyList()
        return runCatching {
            json.decodeFromString<List<AndroidAppItem>>(raw)
        }.getOrDefault(emptyList())
    }

    fun saveCustomApps(apps: List<AndroidAppItem>) {
        prefs.edit().putString(KEY_CUSTOM_APPS, json.encodeToString(apps)).apply()
    }

    fun loadLastSyncIso(): String? = prefs.getString(KEY_LAST_SYNC, null)

    fun saveLastSyncIso(iso: String) {
        prefs.edit().putString(KEY_LAST_SYNC, iso).apply()
    }

    companion object {
        private const val KEY_OVERRIDES = "sync_overrides_v2"
        private const val KEY_REPOS = "repositories_v2"
        private const val KEY_CUSTOM_APPS = "custom_apps_v2"
        private const val KEY_LAST_SYNC = "last_sync_iso_v2"
    }
}
