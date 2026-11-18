package com.phantom.store.ui.theme

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object PhantomColors {
    val ObsidianBg = Color(0xFF06050B)
    val ObsidianSurface = Color(0xFF0E0B18)
    val GlassFillTop = Color(0xD9191429)
    val GlassFillBottom = Color(0xCC0D0A16)
    val GlassCardSurface = Color(0xB8141022)
    val GlassDockSurface = Color(0xE60B0914)
    val RimHighlight = Color(0x52E9D5FF)
    val RimSubtle = Color(0x26C084FC)
    val PurplePrimary = Color(0xFF9333EA)
    val PurpleVibrant = Color(0xFFA855F7)
    val PurpleSoft = Color(0xFFD8B4FE)
    val TextPrimary = Color(0xFFF8FAFC)
    val TextSecondary = Color(0xFFCBD5E1)
    val TextMuted = Color(0xFF94A3B8)
    val DividerLine = Color(0x18FFFFFF)
    val AmberRisk = Color(0xFFFCD34D)
    val EmeraldOk = Color(0xFF34D399)
}

private val PhantomDarkScheme = darkColorScheme(
    primary = PhantomColors.PurplePrimary,
    onPrimary = Color.White,
    secondary = PhantomColors.PurpleVibrant,
    onSecondary = Color.White,
    background = PhantomColors.ObsidianBg,
    onBackground = PhantomColors.TextPrimary,
    surface = PhantomColors.ObsidianSurface,
    onSurface = PhantomColors.TextPrimary,
    surfaceVariant = Color(0xFF1A142B),
    onSurfaceVariant = PhantomColors.TextSecondary,
    outline = PhantomColors.RimSubtle
)

private val PhantomTypography = Typography(
    displaySmall = TextStyle(
        fontWeight = FontWeight.ExtraBold,
        fontSize = 32.sp,
        lineHeight = 36.sp,
        letterSpacing = (-0.6).sp
    ),
    headlineSmall = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = (-0.3).sp
    ),
    titleMedium = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 16.sp,
        lineHeight = 22.sp
    ),
    bodyMedium = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),
    labelMedium = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 12.sp,
        lineHeight = 16.sp
    )
)

fun Modifier.liquidGlassSurface(
    shape: Shape = RoundedCornerShape(26.dp),
    highEmphasis: Boolean = false
): Modifier {
    val fillBrush = Brush.verticalGradient(
        colors = listOf(
            if (highEmphasis) PhantomColors.GlassFillTop else PhantomColors.GlassCardSurface,
            PhantomColors.GlassFillBottom
        )
    )
    val borderBrush = Brush.verticalGradient(
        colors = listOf(
            if (highEmphasis) PhantomColors.RimHighlight else PhantomColors.RimSubtle,
            Color(0x14FFFFFF)
        )
    )
    return this
        .clip(shape)
        .background(brush = fillBrush, shape = shape)
        .border(BorderStroke(1.dp, borderBrush), shape = shape)
}

@Composable
fun PhantomTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = PhantomDarkScheme,
        typography = PhantomTypography,
        content = content
    )
}
