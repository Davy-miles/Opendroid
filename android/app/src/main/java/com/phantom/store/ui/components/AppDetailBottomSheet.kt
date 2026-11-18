package com.phantom.store.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.phantom.store.R
import com.phantom.store.logic.StoreLogic
import com.phantom.store.model.ActiveApkTask
import com.phantom.store.model.AndroidAppItem
import com.phantom.store.model.AndroidArch
import com.phantom.store.model.ApkAsset
import com.phantom.store.model.InstalledPackageState
import com.phantom.store.model.PermissionRisk
import com.phantom.store.ui.theme.PhantomColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppDetailBottomSheet(
    app: AndroidAppItem,
    deviceArch: AndroidArch,
    installed: InstalledPackageState?,
    activeTask: ActiveApkTask?,
    onDismiss: () -> Unit,
    onSyncNow: (AndroidAppItem, (String) -> Unit) -> Unit,
    onDownloadAndInstall: (AndroidAppItem, ApkAsset) -> Unit,
    onOpenInstalledApp: (String) -> Unit
) {
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    var selectedAssetName by remember(app.id, app.assets) {
        val preferred = StoreLogic.selectBestApkAsset(app.assets, deviceArch) ?: app.assets.firstOrNull()
        mutableStateOf(preferred?.name.orEmpty())
    }
    var copiedSha by remember(app.id) { mutableStateOf(false) }
    var syncingNow by remember(app.id) { mutableStateOf(false) }
    var syncNotice by remember(app.id) { mutableStateOf<String?>(null) }

    val selectedAsset = app.assets.firstOrNull { it.name == selectedAssetName } ?: app.assets.firstOrNull()
    val galleryModels: List<Any> = remember(app.remoteGalleryUrls, app.remotePreviewUrl, app.localPreviewRes) {
        val list = mutableListOf<Any>()
        app.remoteGalleryUrls.forEach { list.add(it) }
        if (list.isEmpty() && app.remotePreviewUrl != null) list.add(app.remotePreviewUrl)
        if (list.isEmpty()) list.add(app.localPreviewRes ?: R.drawable.hero_vault)
        list
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF0D0A16),
        contentColor = PhantomColors.TextPrimary,
        dragHandle = { BottomSheetDefaults.DragHandle(color = Color(0x44FFFFFF)) }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            // App Identity Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AppIconArtwork(app = app, size = 64.dp, cornerRadius = 18.dp)
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = app.name,
                        color = Color.White,
                        fontSize = 21.sp,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = app.packageName,
                        color = PhantomColors.PurpleSoft,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    val meta = buildList {
                        add(app.developer)
                        add("v${app.version}")
                        app.starsCount?.let { add("${StoreLogic.formatCompactCount(it.toLong())} estrelas") }
                        add("Android ${app.minAndroid}")
                        add(app.license)
                    }
                    Text(
                        text = meta.joinToString(" · "),
                        color = PhantomColors.TextMuted,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(top = 3.dp)
                    )
                }
            }

            // Preview Gallery
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Pré-visualização",
                    color = PhantomColors.TextMuted,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(galleryModels) { model ->
                        AsyncImage(
                            model = ImageRequest.Builder(context)
                                .data(model)
                                .crossfade(true)
                                .build(),
                            contentDescription = "Pré-visualização de ${app.name}",
                            fallback = painterResource(app.localPreviewRes ?: R.drawable.hero_vault),
                            error = painterResource(app.localPreviewRes ?: R.drawable.hero_vault),
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .width(270.dp)
                                .height(166.dp)
                                .clip(RoundedCornerShape(18.dp))
                                .border(1.dp, Color(0x20FFFFFF), RoundedCornerShape(18.dp))
                        )
                    }
                }
            }

            // Description
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Sobre este aplicativo",
                    color = PhantomColors.TextMuted,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = app.description,
                    color = PhantomColors.TextSecondary,
                    fontSize = 14.sp,
                    lineHeight = 20.sp
                )
            }

            // APK Variants & Native ABI Selection
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0x0FFFFFFF))
                    .border(1.dp, Color(0x1EFFFFFF), RoundedCornerShape(20.dp))
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Pacote APK e Arquitetura",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    TextButton(
                        onClick = {
                            if (syncingNow) return@TextButton
                            syncingNow = true
                            onSyncNow(app) { msg ->
                                syncingNow = false
                                syncNotice = msg
                            }
                        },
                        contentPadding = PaddingValues(horizontal = 8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Refresh,
                            contentDescription = null,
                            tint = PhantomColors.PurpleSoft,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (syncingNow) "Sincronizando..." else "Sincronizar agora",
                            color = PhantomColors.PurpleSoft,
                            fontSize = 12.sp
                        )
                    }
                }

                syncNotice?.let { msg ->
                    Text(
                        text = msg,
                        color = PhantomColors.PurpleSoft,
                        fontSize = 12.sp,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0x229333EA))
                            .padding(10.dp)
                    )
                }

                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(app.assets, key = { it.name }) { asset ->
                        val active = selectedAsset?.name == asset.name
                        val sameArchCount = app.assets.count { it.arch == asset.arch }
                        val baseName = asset.name.removeSuffix(".apk").removeSuffix(".APK")
                        val variantSuffix = if (sameArchCount > 1) {
                            baseName.split('-', '_').lastOrNull().orEmpty()
                        } else {
                            ""
                        }
                        val label = buildString {
                            append(asset.arch.label)
                            if (variantSuffix.isNotBlank()) append(" ($variantSuffix)")
                            append(" · ")
                            append(StoreLogic.formatBytes(asset.sizeBytes))
                        }

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (active) PhantomColors.PurplePrimary else Color(0x12FFFFFF),
                            border = BorderStroke(
                                1.dp,
                                if (active) PhantomColors.RimHighlight else Color(0x1EFFFFFF)
                            ),
                            modifier = Modifier.clickable { selectedAssetName = asset.name }
                        ) {
                            Text(
                                text = label,
                                color = if (active) Color.White else PhantomColors.TextSecondary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp)
                            )
                        }
                    }
                }

                if (selectedAsset != null) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Arquivo: ${selectedAsset.name}",
                            color = PhantomColors.TextMuted,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f)
                        )
                        TextButton(
                            onClick = {
                                clipboard.setText(AnnotatedString(selectedAsset.sha256))
                                copiedSha = true
                            }
                        ) {
                            Icon(
                                imageVector = if (copiedSha) Icons.Rounded.Check else Icons.Rounded.ContentCopy,
                                contentDescription = null,
                                tint = PhantomColors.PurpleSoft,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (copiedSha) "Copiado" else "SHA-256",
                                color = PhantomColors.PurpleSoft,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            // Permissions Audit
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(
                        imageVector = Icons.Rounded.VerifiedUser,
                        contentDescription = null,
                        tint = PhantomColors.PurpleSoft,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "Auditoria de Permissões (${app.permissions.size})",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0x0BFFFFFF))
                        .border(1.dp, Color(0x16FFFFFF), RoundedCornerShape(16.dp))
                ) {
                    app.permissions.forEachIndexed { idx, perm ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = perm.label, color = Color.White, fontWeight = FontWeight.Medium, fontSize = 13.sp)
                                Text(
                                    text = perm.code,
                                    color = PhantomColors.TextMuted,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 10.sp
                                )
                                Text(text = perm.reason, color = PhantomColors.TextSecondary, fontSize = 12.sp)
                            }
                            Text(
                                text = perm.risk.label,
                                color = when (perm.risk) {
                                    com.phantom.store.model.PermissionRisk.SENSITIVE -> PhantomColors.AmberRisk
                                    com.phantom.store.model.PermissionRisk.MODERATE -> PhantomColors.TextSecondary
                                    com.phantom.store.model.PermissionRisk.LOW -> PhantomColors.PurpleSoft
                                },
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        if (idx < app.permissions.lastIndex) {
                            HorizontalDivider(color = PhantomColors.DividerLine)
                        }
                    }
                }
            }

            // Changelog
            if (app.changelog.isNotEmpty()) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "Novidades da versão ${app.version}",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    app.changelog.forEach { line ->
                        Text(
                            text = "• $line",
                            color = PhantomColors.TextSecondary,
                            fontSize = 13.sp
                        )
                    }
                }
            }

            // Bottom Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        val url = selectedAsset?.downloadUrl ?: "https://github.com/${app.repoSlug}/releases"
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    },
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.dp, Color(0x28FFFFFF)),
                    modifier = Modifier.height(48.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.OpenInNew,
                        contentDescription = null,
                        tint = PhantomColors.TextPrimary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Fonte", color = Color.White)
                }

                val needsUpdate = installed != null &&
                    StoreLogic.hasUpdateAvailable(installed.installedVersionName, app.version)

                Button(
                    onClick = {
                        when {
                            activeTask != null -> Unit
                            installed != null && !needsUpdate -> onOpenInstalledApp(app.packageName)
                            selectedAsset != null -> onDownloadAndInstall(app, selectedAsset)
                        }
                    },
                    enabled = activeTask == null,
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PhantomColors.PurplePrimary),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                ) {
                    Icon(
                        imageVector = if (installed != null && !needsUpdate) Icons.Rounded.PlayArrow else Icons.Rounded.Download,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = when {
                            activeTask != null -> "${activeTask.stageLabel} (${activeTask.progressPercent}%)"
                            installed != null && !needsUpdate -> "Abrir Aplicativo"
                            needsUpdate -> "Atualizar APK (${StoreLogic.formatBytes(selectedAsset?.sizeBytes ?: 0L)})"
                            else -> "Baixar e Instalar (${StoreLogic.formatBytes(selectedAsset?.sizeBytes ?: 0L)})"
                        },
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}
