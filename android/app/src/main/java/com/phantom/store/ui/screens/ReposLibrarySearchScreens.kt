package com.phantom.store.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.phantom.store.logic.StoreLogic
import com.phantom.store.model.AndroidAppItem
import com.phantom.store.model.AppCategory
import com.phantom.store.model.RepoSyncStatus
import com.phantom.store.model.SortOption
import com.phantom.store.ui.components.AppIconArtwork
import com.phantom.store.ui.components.AppStoreRow
import com.phantom.store.ui.components.StoreSearchField
import com.phantom.store.ui.theme.PhantomColors
import com.phantom.store.ui.theme.liquidGlassSurface
import com.phantom.store.viewmodel.StoreUiState

@Composable
fun ReposScreen(
    state: StoreUiState,
    onSyncAll: () -> Unit,
    onSyncRepo: (String) -> Unit,
    onAddRepoInput: (String, (Boolean, String) -> Unit) -> Unit,
    onToggleRepo: (String) -> Unit,
    onRemoveRepo: (String) -> Unit
) {
    var repoInput by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var feedbackMsg by remember { mutableStateOf<Pair<Boolean, String>?>(null) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 112.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "FONTES & ÍNDICES",
                        color = PhantomColors.PurpleSoft,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Repositórios",
                        style = MaterialTheme.typography.displaySmall,
                        color = Color.White
                    )
                }

                OutlinedButton(
                    onClick = onSyncAll,
                    enabled = !state.isSyncingAll,
                    shape = CircleShape,
                    border = androidx.compose.foundation.BorderStroke(1.dp, PhantomColors.RimSubtle),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = Color(0x14FFFFFF),
                        contentColor = Color.White
                    )
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Refresh,
                        contentDescription = null,
                        tint = PhantomColors.PurpleSoft,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = if (state.isSyncingAll) "Checando..." else "Sincronizar", fontSize = 12.sp)
                }
            }
        }

        // Add custom GitHub repo or F-Droid package ID
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .liquidGlassSurface()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = "Conectar GitHub Repo ou Pacote F-Droid",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Text(
                    text = "Digite proprietario/repositorio (ex.: TeamNewPipe/NewPipe) ou um ID Android F-Droid (ex.: com.termux).",
                    color = PhantomColors.TextSecondary,
                    fontSize = 12.sp
                )

                StoreSearchField(
                    value = repoInput,
                    onValueChange = { repoInput = it },
                    placeholder = "owner/repo ou com.exemplo.app"
                )

                Button(
                    onClick = {
                        if (repoInput.isBlank() || isSubmitting) return@Button
                        isSubmitting = true
                        onAddRepoInput(repoInput) { ok, msg ->
                            isSubmitting = false
                            feedbackMsg = ok to msg
                            if (ok) repoInput = ""
                        }
                    },
                    enabled = !isSubmitting,
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PhantomColors.PurplePrimary),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Add,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (isSubmitting) "Consultando origem..." else "Adicionar e Sincronizar",
                        fontWeight = FontWeight.Bold
                    )
                }

                feedbackMsg?.let { (ok, msg) ->
                    Text(
                        text = msg,
                        color = if (ok) PhantomColors.EmeraldOk else PhantomColors.AmberRisk,
                        fontSize = 12.sp
                    )
                }
            }
        }

        items(state.repositories, key = { it.id }) { repo ->
            val isSyncingThis = state.syncingRepoId == repo.id
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .liquidGlassSurface(RoundedCornerShape(22.dp))
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = repo.name,
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            if (repo.verified) {
                                Icon(
                                    imageVector = Icons.Rounded.Verified,
                                    contentDescription = "Verificado",
                                    tint = PhantomColors.PurpleSoft,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                        Text(
                            text = repo.slug,
                            color = PhantomColors.PurpleSoft.copy(alpha = 0.85f),
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp
                        )
                    }

                    Switch(
                        checked = repo.enabled,
                        onCheckedChange = { onToggleRepo(repo.id) },
                        colors = SwitchDefaults.colors(checkedTrackColor = PhantomColors.PurplePrimary)
                    )
                }

                Text(
                    text = repo.description,
                    color = PhantomColors.TextSecondary,
                    fontSize = 12.sp
                )

                val statusText = when (repo.syncStatus) {
                    RepoSyncStatus.ONLINE -> "Online"
                    RepoSyncStatus.CACHED -> "Em cache"
                    RepoSyncStatus.OFFLINE -> "Offline"
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "$statusText · ${repo.appCount} app(s) · Sync ${repo.lastSyncedAt}",
                        color = PhantomColors.TextMuted,
                        fontSize = 11.sp
                    )

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        TextButton(
                            onClick = { onSyncRepo(repo.id) },
                            enabled = !isSyncingThis
                        ) {
                            Text(
                                text = if (isSyncingThis) "Sincronizando..." else "Sincronizar",
                                color = PhantomColors.PurpleSoft,
                                fontSize = 12.sp
                            )
                        }
                        if (repo.id.startsWith("repo-custom") || repo.id.startsWith("repo-fdroid-")) {
                            IconButton(
                                onClick = { onRemoveRepo(repo.id) },
                                modifier = Modifier.size(34.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.DeleteOutline,
                                    contentDescription = "Remover repositório",
                                    tint = PhantomColors.TextMuted,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LibraryScreen(
    state: StoreUiState,
    onVerifyUpdates: () -> Unit,
    onOpenApp: (AndroidAppItem) -> Unit,
    onDownloadApp: (AndroidAppItem) -> Unit,
    onLaunchInstalledApp: (String) -> Unit
) {
    val installedCatalogApps = remember(state.catalog, state.installedPackages) {
        state.catalog.filter { state.installedPackages.containsKey(it.packageName) }
    }
    val updatesCount = remember(installedCatalogApps, state.installedPackages) {
        installedCatalogApps.count { app ->
            val inst = state.installedPackages[app.packageName] ?: return@count false
            StoreLogic.hasUpdateAvailable(inst.installedVersionName, app.version)
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 112.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "PACOTES NO DISPOSITIVO",
                        color = PhantomColors.PurpleSoft,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Biblioteca",
                        style = MaterialTheme.typography.displaySmall,
                        color = Color.White
                    )
                }

                Button(
                    onClick = onVerifyUpdates,
                    enabled = !state.isSyncingAll,
                    shape = CircleShape,
                    colors = ButtonDefaults.buttonColors(containerColor = PhantomColors.PurplePrimary)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (state.isSyncingAll) "Checando..." else "Verificar atualizações",
                        fontSize = 12.sp
                    )
                }
            }
        }

        // Device Summary Card (uses live Android ABI + PackageManager scan!)
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .liquidGlassSurface()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "${installedCatalogApps.size} instalado(s)",
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Detectados no Android · ABI ${state.devicePrimaryArch.label}",
                        color = PhantomColors.TextMuted,
                        fontSize = 12.sp
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "$updatesCount atualização(ões)",
                        color = if (updatesCount > 0) PhantomColors.AmberRisk else PhantomColors.EmeraldOk,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "via PackageManager",
                        color = PhantomColors.TextMuted,
                        fontSize = 11.sp
                    )
                }
            }
        }

        if (installedCatalogApps.isEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .liquidGlassSurface()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Nenhum app do catálogo detectado neste aparelho",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    Text(
                        text = "Quando você instalar qualquer app (NewPipe, Mihon, Cromite, etc.), a Phantom Store lê a versão instalada diretamente pelo Android PackageManager e avisa quando houver atualização.",
                        color = PhantomColors.TextSecondary,
                        fontSize = 13.sp
                    )
                }
            }
        } else {
            items(installedCatalogApps, key = { "lib-${it.id}" }) { app ->
                val installed = state.installedPackages[app.packageName]!!
                val needsUpdate = StoreLogic.hasUpdateAvailable(installed.installedVersionName, app.version)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .liquidGlassSurface(RoundedCornerShape(22.dp))
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    AppIconArtwork(app = app, size = 50.dp, cornerRadius = 13.dp)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = app.name,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                        Text(
                            text = "Instalado v${installed.installedVersionName} · Disponível v${app.version}",
                            color = if (needsUpdate) PhantomColors.AmberRisk else PhantomColors.TextMuted,
                            fontSize = 12.sp
                        )
                    }

                    if (needsUpdate) {
                        Button(
                            onClick = { onDownloadApp(app) },
                            shape = CircleShape,
                            colors = ButtonDefaults.buttonColors(containerColor = PhantomColors.PurplePrimary),
                            contentPadding = PaddingValues(horizontal = 14.dp)
                        ) {
                            Text("Atualizar", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        OutlinedButton(
                            onClick = { onLaunchInstalledApp(app.packageName) },
                            shape = CircleShape,
                            border = androidx.compose.foundation.BorderStroke(1.dp, PhantomColors.RimSubtle),
                            contentPadding = PaddingValues(horizontal = 14.dp)
                        ) {
                            Text("Abrir", color = PhantomColors.PurpleSoft, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SearchScreen(
    state: StoreUiState,
    onSearchChange: (String) -> Unit,
    onOpenApp: (AndroidAppItem) -> Unit,
    onDownloadApp: (AndroidAppItem) -> Unit
) {
    val results = remember(state.catalog, state.searchQuery) {
        StoreLogic.filterAndSortApps(
            apps = state.catalog,
            category = AppCategory.ALL,
            query = state.searchQuery,
            archFilter = null,
            sortBy = SortOption.DOWNLOADS
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 112.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(
                text = "Buscar",
                style = MaterialTheme.typography.displaySmall,
                color = Color.White
            )
        }

        item {
            StoreSearchField(
                value = state.searchQuery,
                onValueChange = onSearchChange,
                placeholder = "App, pacote, categoria ou GitHub slug..."
            )
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .liquidGlassSurface()
            ) {
                results.forEachIndexed { idx, app ->
                    AppStoreRow(
                        app = app,
                        installed = state.installedPackages[app.packageName],
                        activeTask = state.activeTasks[app.id],
                        onSelect = onOpenApp,
                        onPrimaryAction = onDownloadApp
                    )
                    if (idx < results.lastIndex) {
                        HorizontalDivider(
                            color = PhantomColors.DividerLine,
                            modifier = Modifier.padding(horizontal = 14.dp)
                        )
                    }
                }
            }
        }
    }
}
