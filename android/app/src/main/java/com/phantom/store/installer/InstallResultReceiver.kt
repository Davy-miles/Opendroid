package com.phantom.store.installer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

data class InstallEvent(
    val packageName: String,
    val success: Boolean,
    val message: String
)

object InstallEventBus {
    private val _events = MutableSharedFlow<InstallEvent>(extraBufferCapacity = 8)
    val events = _events.asSharedFlow()

    fun emit(event: InstallEvent) {
        _events.tryEmit(event)
    }
}

class InstallResultReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)
        val pkg = intent.getStringExtra(PackageInstaller.EXTRA_PACKAGE_NAME).orEmpty()

        when (status) {
            PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                val confirmIntent: Intent? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableExtra(Intent.EXTRA_INTENT)
                }
                if (confirmIntent != null) {
                    confirmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(confirmIntent)
                }
            }

            PackageInstaller.STATUS_SUCCESS -> {
                InstallEventBus.emit(
                    InstallEvent(
                        packageName = pkg,
                        success = true,
                        message = "Aplicativo instalado com sucesso no Android!"
                    )
                )
            }

            PackageInstaller.STATUS_FAILURE_ABORTED -> {
                InstallEventBus.emit(
                    InstallEvent(
                        packageName = pkg,
                        success = false,
                        message = "Instalação cancelada pelo usuário."
                    )
                )
            }

            else -> {
                val statusMsg = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE).orEmpty()
                InstallEventBus.emit(
                    InstallEvent(
                        packageName = pkg,
                        success = false,
                        message = statusMsg.ifBlank { "Não foi possível concluir a instalação." }
                    )
                )
            }
        }
    }
}
