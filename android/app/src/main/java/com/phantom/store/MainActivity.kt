package com.phantom.store

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.phantom.store.model.StoreTab
import com.phantom.store.ui.components.AppDetailBottomSheet
import com.phantom.store.ui.components.FloatingLiquidDock
import com.phantom.store.ui.screens.AppsCatalogScreen
import com.phantom.store.ui.screens.LibraryScreen
import com.phantom.store.ui.screens.ReposScreen
import com.phantom.store.ui.screens.TodayScreen
import com.phantom.store.ui.theme.PhantomColors
import com.phantom.store.ui.theme.PhantomTheme
import com.phantom.store.viewmodel.StoreViewModel

class MainActivity : ComponentActivity() {

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ -> }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }

        setContent {
            PhantomTheme {
                PhantomStoreRoot()
            }
        }
    }
}

@Composable
fun PhantomStoreRoot(vm: StoreViewModel = viewModel()) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val lifecycleOwner = LocalLifecycleOwner.current
    val snackbarHostState = remember { SnackbarHostState() }

    // Re-scan PackageManager automatically whenever user returns from system APK installer
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                vm.refreshInstalledPackages()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(state.statusBanner) {
        val msg = state.statusBanner ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(msg, duration = SnackbarDuration.Short)
        vm.dismissBanner()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFF1A0F35),
                        PhantomColors.ObsidianBg,
                        Color(0xFF0B0615)
                    )
                )
            )
            .statusBarsPadding()
    ) {
        when (state.activeTab) {
            StoreTab.TODAY -> TodayScreen(
                state = state,
                onSyncAll = { vm.syncAllCatalog(silent = false) },
                onSearchChange = vm::setSearchQuery,
                onOpenApp = { vm.openAppDetails(it.id) },
                onDownloadApp = { vm.downloadAndInstall(it) },
                onNavigateTab = vm::selectTab,
                onJumpCategory = vm::jumpToCategory
            )

            StoreTab.APPS -> AppsCatalogScreen(
                state = state,
                onSyncAll = { vm.syncAllCatalog(silent = false) },
                onSearchChange = vm::setSearchQuery,
                onCategorySelect = vm::setCategory,
                onArchFilterSelect = vm::setArchFilter,
                onOpenApp = { vm.openAppDetails(it.id) },
                onDownloadApp = { vm.downloadAndInstall(it) }
            )

            StoreTab.REPOS -> ReposScreen(
                state = state,
                onSyncAll = { vm.syncAllCatalog(silent = false) },
                onSyncRepo = vm::syncRepositoryNow,
                onAddRepoInput = vm::addRepositoryInput,
                onToggleRepo = vm::toggleRepository,
                onRemoveRepo = vm::removeRepository
            )

            StoreTab.LIBRARY -> LibraryScreen(
                state = state,
                onVerifyUpdates = { vm.syncAllCatalog(silent = false) },
                onOpenApp = { vm.openAppDetails(it.id) },
                onDownloadApp = { vm.downloadAndInstall(it) },
                onLaunchInstalledApp = vm::openInstalledApp
            )
        }

        FloatingLiquidDock(
            activeTab = state.activeTab,
            installedCount = state.installedPackages.size,
            onSelectTab = vm::selectTab,
            modifier = Modifier.align(Alignment.BottomCenter)
        )

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 96.dp, start = 16.dp, end = 16.dp)
        ) { data ->
            Snackbar(
                snackbarData = data,
                shape = RoundedCornerShape(16.dp),
                containerColor = Color(0xF0171127),
                contentColor = Color.White
            )
        }

        state.selectedApp?.let { selectedApp ->
            AppDetailBottomSheet(
                app = selectedApp,
                deviceArch = state.devicePrimaryArch,
                installed = state.installedPackages[selectedApp.packageName],
                activeTask = state.activeTasks[selectedApp.id],
                onDismiss = { vm.openAppDetails(null) },
                onSyncNow = { app, done -> vm.syncSingleAppNow(app, done) },
                onDownloadAndInstall = { app, asset -> vm.downloadAndInstall(app, asset) },
                onOpenInstalledApp = vm::openInstalledApp
            )
        }
    }
}
