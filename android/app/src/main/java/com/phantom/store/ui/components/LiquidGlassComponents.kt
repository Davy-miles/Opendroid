package com.phantom.store.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.phantom.store.logic.StoreLogic
import com.phantom.store.model.ActiveApkTask
import com.phantom.store.model.AndroidAppItem
import com.phantom.store.model.InstalledPackageState
import com.phantom.store.model.StoreTab
import com.phantom.store.ui.theme.PhantomColors
import com.phantom.store.ui.theme.liquidGlassSurface

@Composable
fun AppIconArtwork(
    app: AndroidAppItem,
    size: Dp = 56.dp,
    cornerRadius: Dp = 15.dp
) {
    val shape = RoundedCornerShape(cornerRadius)
    val context = LocalContext.current

    Box(
        modifier = Modifier
            .size(size)
            .clip(shape)
            .background(
                Brush.linearGradient(
                    listOf(Color(app.accentHex), PhantomColors.ObsidianSurface)
                )
            )
            .border(1.dp, Color(0x28FFFFFF), shape),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = app.monogram,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = (size.value * 0.34f).sp
        )

        val imageModel: Any? = app.remoteIconUrl ?: app.localIconRes
        if (imageModel != null) {
            AsyncImage(
                model = ImageRequest.Builder(context)
                    .data(imageModel)
                    .crossfade(true)
                    .build(),
                contentDescription = "Ícone do aplicativo ${app.name}",
                fallback = app.localIconRes?.let { painterResource(it) },
                error = app.localIconRes?.let { painterResource(it) },
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}

@Composable
fun AppStoreRow(
    app: AndroidAppItem,
    installed: InstalledPackageState?,
    activeTask: ActiveApkTask?,
    onSelect: (AndroidAppItem) -> Unit,
    onPrimaryAction: (AndroidAppItem) -> Unit,
    showCaption: Boolean = true
) {
    val needsUpdate = installed != null &&
        StoreLogic.hasUpdateAvailable(installed.installedVersionName, app.version)
    val primaryAsset = app.assets.firstOrNull()

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect(app) }
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        AppIconArtwork(app = app, size = 54.dp, cornerRadius = 14.dp)

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = app.name,
                color = PhantomColors.TextPrimary,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            if (showCaption) {
                Text(
                    text = app.tagline,
                    color = PhantomColors.TextSecondary,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            val metaParts = buildList {
                add(app.category)
                add("v${app.version}")
                if (primaryAsset != null) add(StoreLogic.formatBytes(primaryAsset.sizeBytes))
                app.starsCount?.let { add("★ ${StoreLogic.formatCompactCount(it.toLong())}") }
            }
            Text(
                text = metaParts.joinToString(" · "),
                color = PhantomColors.TextMuted,
                fontSize = 11.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            when {
                activeTask != null -> {
                    Box(
                        modifier = Modifier
                            .height(34.dp)
                            .widthIn(min = 76.dp)
                            .clip(CircleShape)
                            .background(Color(0x339333EA))
                            .border(1.dp, PhantomColors.RimSubtle, CircleShape)
                            .padding(horizontal = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "${activeTask.progressPercent}%",
                            color = PhantomColors.PurpleSoft,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                installed != null && !needsUpdate -> {
                    Button(
                        onClick = { onSelect(app) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0x26FFFFFF),
                            contentColor = PhantomColors.PurpleSoft
                        ),
                        shape = CircleShape,
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 0.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Text(text = "Abrir", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                else -> {
                    Button(
                        onClick = { onPrimaryAction(app) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = PhantomColors.PurplePrimary,
                            contentColor = Color.White
                        ),
                        shape = CircleShape,
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 0.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Text(
                            text = if (needsUpdate) "Atualizar" else "Obter",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
            Text(
                text = if (installed != null && !needsUpdate) "Instalado" else "APK Direto",
                color = PhantomColors.TextMuted,
                fontSize = 10.sp,
                modifier = Modifier.padding(top = 3.dp)
            )
        }
    }
}

@Composable
fun StoreSearchField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(46.dp)
            .liquidGlassSurface(shape = RoundedCornerShape(16.dp))
            .padding(horizontal = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Icon(
            imageVector = Icons.Rounded.Search,
            contentDescription = null,
            tint = PhantomColors.TextMuted,
            modifier = Modifier.size(18.dp)
        )
        Box(modifier = Modifier.weight(1f)) {
            if (value.isEmpty()) {
                Text(
                    text = placeholder,
                    color = PhantomColors.TextMuted,
                    fontSize = 14.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                singleLine = true,
                textStyle = TextStyle(color = PhantomColors.TextPrimary, fontSize = 14.sp),
                cursorBrush = SolidColor(PhantomColors.PurpleVibrant),
                modifier = Modifier.fillMaxWidth()
            )
        }
        if (value.isNotEmpty()) {
            IconButton(
                onClick = { onValueChange("") },
                modifier = Modifier.size(28.dp)
            ) {
                Icon(
                    imageVector = Icons.Rounded.Close,
                    contentDescription = "Limpar busca",
                    tint = PhantomColors.TextMuted,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

private fun tabIcon(tab: StoreTab): ImageVector = when (tab) {
    StoreTab.TODAY -> Icons.Rounded.Explore
    StoreTab.APPS -> Icons.Rounded.Apps
    StoreTab.REPOS -> Icons.Rounded.FolderCopy
    StoreTab.LIBRARY -> Icons.Rounded.DownloadDone
}

@Composable
fun FloatingLiquidDock(
    activeTab: StoreTab,
    installedCount: Int,
    onSelectTab: (StoreTab) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp)
            .navigationBarsPadding()
            .liquidGlassSurface(shape = RoundedCornerShape(30.dp), highEmphasis = true)
            .padding(horizontal = 6.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        StoreTab.entries.forEach { tab ->
            val selected = tab == activeTab
            val bgColor by animateColorAsState(
                targetValue = if (selected) PhantomColors.PurplePrimary.copy(alpha = 0.34f) else Color.Transparent,
                animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
                label = "dockBg"
            )
            val contentColor by animateColorAsState(
                targetValue = if (selected) Color.White else PhantomColors.TextMuted,
                label = "dockContent"
            )

            Column(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(22.dp))
                    .background(bgColor)
                    .clickable { onSelectTab(tab) }
                    .padding(vertical = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Box {
                    Icon(
                        imageVector = tabIcon(tab),
                        contentDescription = tab.label,
                        tint = contentColor,
                        modifier = Modifier.size(20.dp)
                    )
                    if (tab == StoreTab.LIBRARY && installedCount > 0) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .offset(x = 6.dp, y = (-4).dp)
                                .size(15.dp)
                                .clip(CircleShape)
                                .background(PhantomColors.PurplePrimary),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = installedCount.toString(),
                                color = Color.White,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
                Text(
                    text = tab.label,
                    color = contentColor,
                    fontSize = 10.sp,
                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                    maxLines = 1
                )
            }
        }
    }
}
