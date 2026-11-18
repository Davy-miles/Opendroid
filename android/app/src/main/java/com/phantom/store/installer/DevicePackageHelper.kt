package com.phantom.store.installer

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import com.phantom.store.model.AndroidArch
import com.phantom.store.model.InstalledPackageState

object DevicePackageHelper {

    fun detectDevicePrimaryArch(): AndroidArch {
        val abis = Build.SUPPORTED_ABIS.orEmpty()
        return when {
            abis.any { it.contains("arm64", ignoreCase = true) } -> AndroidArch.ARM64_V8A
            abis.any { it.contains("armeabi", ignoreCase = true) } -> AndroidArch.ARMEABI_V7A
            else -> AndroidArch.UNIVERSAL
        }
    }

    fun scanInstalledPackages(
        context: Context,
        packageNames: Collection<String>
    ): Map<String, InstalledPackageState> {
        val pm = context.packageManager
        val result = LinkedHashMap<String, InstalledPackageState>()
        for (pkg in packageNames) {
            if (pkg.isBlank()) continue
            runCatching {
                val info = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    pm.getPackageInfo(pkg, PackageManager.PackageInfoFlags.of(0))
                } else {
                    @Suppress("DEPRECATION")
                    pm.getPackageInfo(pkg, 0)
                }
                val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    info.longVersionCode
                } else {
                    @Suppress("DEPRECATION")
                    info.versionCode.toLong()
                }
                result[pkg] = InstalledPackageState(
                    packageName = pkg,
                    installedVersionName = info.versionName ?: "1.0",
                    installedVersionCode = versionCode
                )
            }
        }
        return result
    }

    fun launchInstalledApp(context: Context, packageName: String): Boolean {
        val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName) ?: return false
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(launchIntent)
        return true
    }
}
