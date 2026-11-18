package com.phantom.store.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.phantom.store.R
import com.phantom.store.logic.StoreLogic
import com.phantom.store.model.AndroidAppItem
import com.phantom.store.model.AndroidArch
import com.phantom.store.model.AppCategory
import com.phantom.store.model.SortOption
import com.phantom.store.model.StoreTab
import com.phantom.store.ui.components.AppIconArtwork
import com.phantom.store.ui.components.AppStoreRow
import com.phantom.store.ui.components.StoreSearchField
import com.phantom.store.ui.theme.PhantomColors
import com.phantom.store.ui.theme.liquidGlassSurface
import com.phantom.store.viewmodel.StoreUiState
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun TodayScreen(
    state: StoreUiState,
    onSyncAll: () -> Unit,
    onSearchChange: (String) -> Unit,
    onOpenApp: (AndroidAppItem) -> Unit,
    onDownloadApp: (AndroidAppItem) -> Unit,
    onNavigateTab: (StoreTab) -> Unit,
    onJumpCategory: (AppCategory) -> Unit
) {
    val todayLabel = remember {
        SimpleDateFormat("EEEE, dd 'DE' MMMM", Locale("pt", "BR"))
            .format(Date())
            .uppercase(Locale("pt", "BR"))
    }
    val featuredApp = remember(state.catalog) {
        state.catalog.firstOrNull { it.id == "myspoti" } ?: state.catalog.firstOrNull()
    }
    val trendingApps = remember(state.catalog) {
        state.catalog.filter { it.id != featuredApp?.id }.take(4)
    }
    val showcaseApps = remember(state.catalog) {
        state.catalog.take(6)
    }
    val searchResults = remember(state.catalog, state.searchQuery) {
        if (state.searchQuery.isBlank()) emptyList()
        else StoreLogic.filterAndSortApps(
            state.catalog,
            AppCategory.ALL,
            state.searchQuery,
            null,
            SortOption.FEATURED
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = 16.dp,
            end = 16.dp,
            top = 12.dp,
            bottom = 112.dp
        ),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Editorial Header
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = todayLabel,
                            color = PhantomColors.PurpleSoft.copy(alpha = 0.85f),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.8.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        state.lastSyncedLabel?.let { time ->
                            Text(
                                text = "Sync · $time",
                                color = PhantomColors.TextMuted,
                                fontSize = 11.sp
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Explorar",
                            style = MaterialTheme.typography.displaySmall,
                            color = Color.White
                        )

                        OutlinedButton(
                            onClick = onSyncAll,
                            enabled = !state.isSyncingAll,
                            shape = CircleShape,
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                PhantomColors.RimSubtle
                            ),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = Color(0x14FFFFFF),
                                contentColor = PhantomColors.TextPrimary
                            ),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                            modifier = Modifier.height(38.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Refresh,
                                contentDescription = null,
                                tint = PhantomColors.PurpleSoft,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (state.isSyncingAll) "Sincronizando..." else "Sincronizar",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }

                StoreSearchField(
                    value = state.searchQuery,
                    onValueChange = onSearchChange,
                    placeholder = "Buscar apps, pacotes e repositórios (ex.: MySpoti)..."
                )
            }
        }

        if (state.searchQuery.isNotBlank()) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Resultados (${searchResults.size})",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White
                    )
                    if (searchResults.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .liquidGlassSurface()
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Nenhum aplicativo encontrado. Conecte um repo GitHub ou pacote F-Droid em Repos.",
                                color = PhantomColors.TextSecondary,
                                fontSize = 13.sp
                            )
                        }
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .liquidGlassSurface()
                        ) {
                            searchResults.forEachIndexed { idx, app ->
                                AppStoreRow(
                                    app = app,
                                    installed = state.installedPackages[app.packageName],
                                    activeTask = state.activeTasks[app.id],
                                    onSelect = onOpenApp,
                                    onPrimaryAction = onDownloadApp
                                )
                                if (idx < searchResults.lastIndex) {
                                    HorizontalDivider(color = PhantomColors.DividerLine)
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Featured Story Card
            if (featuredApp != null) {
                item {
                    HeroEditorialCard(
                        app = featuredApp,
                        isInstalled = state.installedPackages.containsKey(featuredApp.packageName),
                        activePercent = state.activeTasks[featuredApp.id]?.progressPercent,
                        onOpen = { onOpenApp(featuredApp) },
                        onDownload = { onDownloadApp(featuredApp) }
                    )
                }
            }

            // Em Alta Agora Bento Stack
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .liquidGlassSurface()
                        .padding(vertical = 14.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "EM ALTA AGORA",
                                color = PhantomColors.PurpleSoft,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.7.sp
                            )
                            Text(
                                text = "Top Apps Fora da Play Store",
                                style = MaterialTheme.typography.headlineSmall,
                                color = Color.White,
                                fontSize = 19.sp
                            )
                        }
                        IconButton(onClick = { onNavigateTab(StoreTab.APPS) }) {
                            Icon(
                                imageVector = Icons.Rounded.ChevronRight,
                                contentDescription = "Ver todos",
                                tint = PhantomColors.TextSecondary
                            )
                        }
                    }

                    trendingApps.forEachIndexed { idx, app ->
                        AppStoreRow(
                            app = app,
                            installed = state.installedPackages[app.packageName],
                            activeTask = state.activeTasks[app.id],
                            onSelect = onOpenApp,
                            onPrimaryAction = onDownloadApp
                        )
                        if (idx < trendingApps.lastIndex) {
                            HorizontalDivider(
                                color = PhantomColors.DividerLine,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                        }
                    }

                    TextButton(
                        onClick = { onNavigateTab(StoreTab.APPS) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "Ver catálogo completo (${state.catalog.size} apps)",
                            color = PhantomColors.PurpleSoft,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // Mais de Phantom horizontal screenshots showcase
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Mais de Phantom",
                            style = MaterialTheme.typography.headlineSmall,
                            color = Color.White
                        )
                        Text(
                            text = "Prévias sincronizadas",
                            color = PhantomColors.TextMuted,
                            fontSize = 12.sp
                        )
                    }

                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        items(showcaseApps, key = { "showcase-${it.id}" }) { app ->
                            Column(
                                modifier = Modifier
                                    .width(292.dp)
                                    .liquidGlassSurface(RoundedCornerShape(24.dp))
                                    .clickable { onOpenApp(app) }
                            ) {
                                UpstreamPreviewImage(
                                    app = app,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(164.dp)
                                )
                                AppStoreRow(
                                    app = app,
                                    installed = state.installedPackages[app.packageName],
                                    activeTask = state.activeTasks[app.id],
                                    onSelect = onOpenApp,
                                    onPrimaryAction = onDownloadApp,
                                    showCaption = false
                                )
                            }
                        }
                    }
                }
            }

            // Colecoes por Categoria
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Coleções por Categoria",
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        CategoryBentoMiniCard(
                            title = "Vídeo livre",
                            subtitle = "NewPipe & LibreTube",
                            imageRes = R.drawable.hero_video,
                            onClick = { onJumpCategory(AppCategory.VIDEO) },
                            modifier = Modifier.weight(1f)
                        )
                        CategoryBentoMiniCard(
                            title = "Segurança & Pentest",
                            subtitle = "Termux & PCAPdroid",
                            imageRes = R.drawable.hero_vault,
                            onClick = { onJumpCategory(AppCategory.SECURITY) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HeroEditorialCard(
    app: AndroidAppItem,
    isInstalled: Boolean,
    activePercent: Int?,
    onOpen: () -> Unit,
    onDownload: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(340.dp)
            .liquidGlassSurface(RoundedCornerShape(28.dp), highEmphasis = true)
            .clickable { onOpen() }
    ) {
        UpstreamPreviewImage(
            app = app,
            modifier = Modifier.fillMaxSize()
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color(0xCC06050B),
                            Color(0x2806050B),
                            Color(0xEE06050B)
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(18.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = "DESTAQUE DA LOJA",
                    color = PhantomColors.PurpleSoft,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.8.sp
                )
                Text(
                    text = "Música sem anúncios com o ${app.name}",
                    color = Color.White,
                    fontSize = 24.sp,
                    lineHeight = 28.sp,
                    fontWeight = FontWeight.ExtraBold,
                    modifier = Modifier.padding(top = 4.dp)
                )
                val sizeLabel = app.assets.firstOrNull()?.let { StoreLogic.formatBytes(it.sizeBytes) } ?: ""
                Text(
                    text = "Fora da Play Store · v${app.version} · $sizeLabel",
                    color = Color(0xFFE2E8F0),
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xCC0B0816))
                    .border(1.dp, Color(0x26FFFFFF), RoundedCornerShape(20.dp))
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                AppIconArtwork(app = app, size = 48.dp, cornerRadius = 13.dp)
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = app.name,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        maxLines = 1
                    )
                    Text(
                        text = app.tagline,
                        color = PhantomColors.TextSecondary,
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Button(
                    onClick = if (isInstalled) onOpen else onDownload,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isInstalled) Color(0x29FFFFFF) else PhantomColors.PurplePrimary
                    ),
                    shape = CircleShape,
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    Text(
                        text = when {
                            activePercent != null -> "$activePercent%"
                            isInstalled -> "Abrir"
                            else -> "Obter"
                        },
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun CategoryBentoMiniCard(
    title: String,
    subtitle: String,
    imageRes: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .liquidGlassSurface(RoundedCornerShape(22.dp))
            .clickable { onClick() }
    ) {
        Image(
            painter = painterResource(imageRes),
            contentDescription = subtitle,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxWidth()
                .height(92.dp)
        )
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = title,
                color = PhantomColors.PurpleSoft,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = subtitle,
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun UpstreamPreviewImage(
    app: AndroidAppItem,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val model: Any = app.remotePreviewUrl ?: app.localPreviewRes ?: R.drawable.hero_vault
    AsyncImage(
        model = ImageRequest.Builder(context)
            .data(model)
            .crossfade(true)
            .build(),
        contentDescription = "Pré-visualização do aplicativo ${app.name}",
        fallback = painterResource(app.localPreviewRes ?: R.drawable.hero_vault),
        error = painterResource(app.localPreviewRes ?: R.drawable.hero_vault),
        contentScale = ContentScale.Crop,
        modifier = modifier.background(PhantomColors.ObsidianSurface)
    )
}

@Composable
fun AppsCatalogScreen(
    state: StoreUiState,
    onSyncAll: () -> Unit,
    onSearchChange: (String) -> Unit,
    onCategorySelect: (AppCategory) -> Unit,
    onArchFilterSelect: (AndroidArch?) -> Unit,
    onOpenApp: (AndroidAppItem) -> Unit,
    onDownloadApp: (AndroidAppItem) -> Unit
) {
    val filteredApps = remember(
        state.catalog,
        state.selectedCategory,
        state.searchQuery,
        state.archFilter,
        state.sortOption
    ) {
        StoreLogic.filterAndSortApps(
            apps = state.catalog,
            category = state.selectedCategory,
            query = state.searchQuery,
            archFilter = state.archFilter,
            sortBy = state.sortOption
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 112.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "CATÁLOGO VERIFICADO",
                        color = PhantomColors.PurpleSoft,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Apps (${filteredApps.size})",
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
                    Text(
                        text = if (state.isSyncingAll) "Sincronizando..." else "Sincronizar Tudo",
                        fontSize = 12.sp
                    )
                }
            }
        }

        item {
            StoreSearchField(
                value = state.searchQuery,
                onValueChange = onSearchChange,
                placeholder = "Filtrar por nome, pacote ou desenvolvedor..."
            )
        }

        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(AppCategory.entries) { cat ->
                    val selected = cat == state.selectedCategory
                    FilterChip(
                        selected = selected,
                        onClick = { onCategorySelect(cat) },
                        label = { Text(cat.label, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PhantomColors.PurplePrimary,
                            selectedLabelColor = Color.White,
                            containerColor = Color(0x16FFFFFF),
                            labelColor = PhantomColors.TextSecondary
                        )
                    )
                }
            }
        }

        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    FilterChip(
                        selected = state.archFilter == null,
                        onClick = { onArchFilterSelect(null) },
                        label = { Text("Todas ABIs", fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PhantomColors.PurplePrimary.copy(alpha = 0.7f),
                            selectedLabelColor = Color.White,
                            containerColor = Color(0x12FFFFFF),
                            labelColor = PhantomColors.TextMuted
                        )
                    )
                }
                items(AndroidArch.entries) { arch ->
                    val isDeviceArch = arch == state.devicePrimaryArch
                    val suffix = if (isDeviceArch) " (seu aparelho)" else ""
                    FilterChip(
                        selected = state.archFilter == arch,
                        onClick = { onArchFilterSelect(if (state.archFilter == arch) null else arch) },
                        label = { Text("${arch.label}$suffix", fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PhantomColors.PurplePrimary.copy(alpha = 0.7f),
                            selectedLabelColor = Color.White,
                            containerColor = Color(0x12FFFFFF),
                            labelColor = PhantomColors.TextMuted
                        )
                    )
                }
            }
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .liquidGlassSurface()
            ) {
                if (filteredApps.isEmpty()) {
                    Text(
                        text = "Nenhum app corresponde ao filtro selecionado.",
                        color = PhantomColors.TextSecondary,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(20.dp)
                    )
                } else {
                    filteredApps.forEachIndexed { idx, app ->
                        AppStoreRow(
                            app = app,
                            installed = state.installedPackages[app.packageName],
                            activeTask = state.activeTasks[app.id],
                            onSelect = onOpenApp,
                            onPrimaryAction = onDownloadApp
                        )
                        if (idx < filteredApps.lastIndex) {
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
}
