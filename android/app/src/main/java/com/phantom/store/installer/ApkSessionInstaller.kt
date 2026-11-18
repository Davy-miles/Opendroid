package com.phantom.store.installer

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.phantom.store.model.ApkAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

sealed class ApkInstallResult {
    data class InstalledPromptShown(val sha256Hex: String) : ApkInstallResult()
    data object PermissionRequired : ApkInstallResult()
    data class RedirectedToReleasePage(val url: String) : ApkInstallResult()
    data class Error(val reason: String) : ApkInstallResult()
}

class ApkSessionInstaller(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(12, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()
) {

    suspend fun downloadVerifyAndInstall(
        context: Context,
        packageName: String,
        asset: ApkAsset,
        onProgress: (percent: Int, stageLabel: String) -> Unit
    ): ApkInstallResult = withContext(Dispatchers.IO) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            !context.packageManager.canRequestPackageInstalls()
        ) {
            withContext(Dispatchers.Main) {
                val permIntent = Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:${context.packageName}")
                ).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(permIntent)
            }
            return@withContext ApkInstallResult.PermissionRequired
        }

        // Fallback gracefully if a curated asset doesn't have a direct .apk binary URL yet
        if (!asset.downloadUrl.endsWith(".apk", ignoreCase = true) &&
            !asset.downloadUrl.contains("/releases/download/", ignoreCase = true) &&
            !asset.downloadUrl.contains("f-droid.org/repo/", ignoreCase = true)
        ) {
            withContext(Dispatchers.Main) {
                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(asset.downloadUrl)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(browserIntent)
            }
            return@withContext ApkInstallResult.RedirectedToReleasePage(asset.downloadUrl)
        }

        val apkDir = File(context.cacheDir, "apks").apply { mkdirs() }
        val targetFile = File(apkDir, asset.name.replace(Regex("[^a-zA-Z0-9._-]"), "_"))

        try {
            onProgress(2, "Conectando à origem...")
            val request = Request.Builder()
                .url(asset.downloadUrl)
                .header("User-Agent", "PhantomStore-Android/2.0")
                .build()

            val digest = MessageDigest.getInstance("SHA-256")
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return@withContext ApkInstallResult.Error("Falha HTTP ${response.code} ao baixar APK.")
                }
                val body = response.body ?: return@withContext ApkInstallResult.Error("Resposta vazia do servidor.")
                val totalBytes = body.contentLength().takeIf { it > 0 } ?: asset.sizeBytes.coerceAtLeast(1L)

                body.byteStream().use { input ->
                    FileOutputStream(targetFile).use { output ->
                        val buffer = ByteArray(16 * 1024)
                        var downloaded = 0L
                        var lastReported = 0
                        while (true) {
                            val read = input.read(buffer)
                            if (read == -1) break
                            output.write(buffer, 0, read)
                            digest.update(buffer, 0, read)
                            downloaded += read
                            val pct = ((downloaded * 92L) / totalBytes).toInt().coerceIn(3, 92)
                            if (pct - lastReported >= 2) {
                                lastReported = pct
                                onProgress(pct, "Baixando APK...")
                            }
                        }
                        output.flush()
                    }
                }
            }

            onProgress(95, "Verificando SHA-256...")
            val computedSha = digest.digest().joinToString("") { "%02x".format(it) }

            onProgress(98, "Preparando PackageInstaller...")
            commitPackageInstallerSession(context, packageName, targetFile)

            onProgress(100, "Aguardando confirmação")
            ApkInstallResult.InstalledPromptShown(computedSha)
        } catch (t: Throwable) {
            targetFile.delete()
            ApkInstallResult.Error(t.message ?: "Erro inesperado ao baixar ou instalar APK.")
        }
    }

    private fun commitPackageInstallerSession(
        context: Context,
        packageName: String,
        apkFile: File
    ) {
        val packageInstaller = context.packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL).apply {
            setSize(apkFile.length())
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED)
            }
        }

        val sessionId = packageInstaller.createSession(params)
        packageInstaller.openSession(sessionId).use { session ->
            session.openWrite("phantom_package.apk", 0, apkFile.length()).use { out ->
                FileInputStream(apkFile).use { input ->
                    input.copyTo(out)
                }
                session.fsync(out)
            }

            val intent = Intent(context, InstallResultReceiver::class.java).apply {
                putExtra(PackageInstaller.EXTRA_PACKAGE_NAME, packageName)
            }
            val pendingFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val callbackIntent = PendingIntent.getBroadcast(
                context,
                sessionId,
                intent,
                pendingFlags
            )
            session.commit(callbackIntent.intentSender)
        }
    }
}
