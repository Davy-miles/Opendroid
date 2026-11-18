package com.phantom.store.data

import com.phantom.store.R
import com.phantom.store.model.AndroidAppItem
import com.phantom.store.model.AndroidArch
import com.phantom.store.model.ApkAsset
import com.phantom.store.model.AppPermission
import com.phantom.store.model.AppSourceType
import com.phantom.store.model.PermissionRisk
import com.phantom.store.model.RepoKind
import com.phantom.store.model.RepoSyncStatus
import com.phantom.store.model.RepositorySource

object CuratedCatalog {

    val initialRepositories: List<RepositorySource> = listOf(
        RepositorySource(
            id = "fdroid-main",
            name = "F-Droid Oficial",
            slug = "f-droid/fdroid-repo",
            url = "https://f-droid.org/repo",
            kind = RepoKind.FDROID,
            enabled = true,
            verified = true,
            appCount = 4996,
            lastSyncedAt = "2026-11-16",
            syncStatus = RepoSyncStatus.CACHED,
            description = "Catálogo principal de software livre para Android compilado de forma reproduzível e auditável."
        ),
        RepositorySource(
            id = "fdroid-archive",
            name = "F-Droid Archive",
            slug = "f-droid/fdroid-archive",
            url = "https://f-droid.org/archive",
            kind = RepoKind.FDROID,
            enabled = true,
            verified = true,
            appCount = 5404,
            lastSyncedAt = "2026-11-16",
            syncStatus = RepoSyncStatus.CACHED,
            description = "Arquivo histórico e versões clássicas de mais de 5.400 pacotes FOSS preservados do F-Droid."
        ),
        RepositorySource(
            id = "izzyondroid",
            name = "IzzyOnDroid Community",
            slug = "IzzySoft/Fdroid",
            url = "https://apt.izzysoft.de/fdroid/repo",
            kind = RepoKind.FDROID,
            enabled = true,
            verified = true,
            appCount = 1401,
            lastSyncedAt = "2026-11-16",
            syncStatus = RepoSyncStatus.CACHED,
            description = "Índice comunitário com mais de 1.400 builds oficiais compilados por desenvolvedores independentes."
        ),
        RepositorySource(
            id = "nethunter",
            name = "Kali NetHunter Store",
            slug = "offensive-security/kali-nethunter-store",
            url = "https://store.nethunter.com/repo",
            kind = RepoKind.FDROID,
            enabled = true,
            verified = true,
            appCount = 39,
            lastSyncedAt = "2026-11-16",
            syncStatus = RepoSyncStatus.CACHED,
            description = "Ferramentas oficiais de pentest ético, diagnóstico de rede, análise Wi-Fi e auditoria Kali Linux."
        ),
        RepositorySource(
            id = "nethunter-archive",
            name = "Kali NetHunter Archive",
            slug = "offensive-security/nethunter-archive",
            url = "https://store.nethunter.com/archive",
            kind = RepoKind.FDROID,
            enabled = true,
            verified = true,
            appCount = 16,
            lastSyncedAt = "2026-11-16",
            syncStatus = RepoSyncStatus.CACHED,
            description = "Builds clássicas e utilitários avançados do ecossistema NetHunter e terminal pentest."
        ),
        RepositorySource(
            id = "kde-android",
            name = "KDE Android FOSS",
            slug = "KDE/kde-android-repo",
            url = "https://cdn.kde.org/android/fdroid/repo",
            kind = RepoKind.FDROID,
            enabled = true,
            verified = true,
            appCount = 27,
            lastSyncedAt = "2026-11-16",
            syncStatus = RepoSyncStatus.CACHED,
            description = "Aplicativos oficiais da comunidade KDE para Android com sincronização e mídia open-source."
        ),
        RepositorySource(
            id = "guardian",
            name = "Guardian Project Tor & Privacy",
            slug = "guardianproject/fdroid-repo",
            url = "https://guardianproject.info/fdroid/repo",
            kind = RepoKind.FDROID,
            enabled = true,
            verified = true,
            appCount = 16,
            lastSyncedAt = "2026-11-16",
            syncStatus = RepoSyncStatus.CACHED,
            description = "Proxy nativo da rede Tor (Orbot), comunicação criptografada e proteção de metadados."
        ),
        RepositorySource(
            id = "fedilab",
            name = "Fedilab & Fediverse FOSS",
            slug = "Fedilab/fdroid-repo",
            url = "https://fdroid.fedilab.app/repo",
            kind = RepoKind.FDROID,
            enabled = true,
            verified = true,
            appCount = 6,
            lastSyncedAt = "2026-11-16",
            syncStatus = RepoSyncStatus.CACHED,
            description = "Clientes descentralizados e ferramentas abertas do Fediverso sem rastreadores comerciais."
        ),
        RepositorySource(
            id = "microg",
            name = "microG Services Core",
            slug = "microg/android_packages_apps_GmsCore",
            url = "https://microg.org/fdroid/repo",
            kind = RepoKind.FDROID,
            enabled = true,
            verified = true,
            appCount = 3,
            lastSyncedAt = "2026-11-16",
            syncStatus = RepoSyncStatus.CACHED,
            description = "Reimplementação livre e leve de serviços Android para rodar apps sem serviços proprietários."
        ),
        RepositorySource(
            id = "briar",
            name = "Briar Peer-to-Peer Mesh",
            slug = "briar/briar-fdroid",
            url = "https://briarproject.org/fdroid/repo",
            kind = RepoKind.FDROID,
            enabled = true,
            verified = true,
            appCount = 2,
            lastSyncedAt = "2026-11-16",
            syncStatus = RepoSyncStatus.CACHED,
            description = "Mensageiro criptografado ponto a ponto via Tor, Wi-Fi direto ou Bluetooth sem servidores centrais."
        ),
        RepositorySource(
            id = "bitwarden",
            name = "Bitwarden Mobile FOSS",
            slug = "bitwarden/mobile-fdroid",
            url = "https://mobileapp.bitwarden.com/fdroid/repo",
            kind = RepoKind.FDROID,
            enabled = true,
            verified = true,
            appCount = 1,
            lastSyncedAt = "2026-11-16",
            syncStatus = RepoSyncStatus.CACHED,
            description = "Cofre oficial de senhas auditado e open-source direto da fonte de distribuição F-Droid."
        ),
        RepositorySource(
            id = "github-flagship",
            name = "GitHub Direct APK Releases",
            slug = "ImranR98/Obtainium",
            url = "https://github.com",
            kind = RepoKind.GITHUB,
            enabled = true,
            verified = true,
            appCount = 16,
            lastSyncedAt = "2026-11-16",
            syncStatus = RepoSyncStatus.CACHED,
            description = "Destaques diretos do GitHub (MySpoti, Termux, PCAPdroid, Mihon, NewPipe, Cromite, LocalSend e Obtainium)."
        )
    )

    val apps: List<AndroidAppItem> = listOf(
        AndroidAppItem(
            id = "myspoti",
            name = "MySpoti",
            packageName = "oss.krtirtho.spotube",
            category = "Música",
            tagline = "Player de música alternativo sem anúncios, letras sincronizadas e áudio em alta fidelidade.",
            description = "Cliente de streaming musical multiplataforma fora da Play Store, focado em privacidade, zero rastreadores comerciais e consumo reduzido de bateria.",
            developer = "MySpoti Community & Spotube Core",
            version = "6.0.0",
            minAndroid = "8.0+",
            license = "BSD-4-Clause",
            updatedAt = "2026-11-10",
            downloadsCount = 845_000,
            repoSlug = "KRTirtho/spotube",
            sourceType = AppSourceType.GITHUB,
            featured = true,
            remoteIconUrl = "https://raw.githubusercontent.com/KRTirtho/spotube/master/metadata/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/KRTirtho/spotube/master/metadata/en-US/images/phoneScreenshots/1.png",
            remoteGalleryUrls = listOf("https://raw.githubusercontent.com/KRTirtho/spotube/master/metadata/en-US/images/phoneScreenshots/1.png"),
            localIconRes = R.drawable.icon_myspoti,
            localPreviewRes = R.drawable.hero_myspoti,
            accentHex = 0xFF7C3AED,
            monogram = "MS",
            assets = listOf(
                ApkAsset(
                    name = "Spotube-android-all-arch.apk",
                    arch = AndroidArch.UNIVERSAL,
                    sizeBytes = (73.1 * 1024 * 1024).toLong(),
                    downloadUrl = "https://github.com/KRTirtho/spotube/releases/latest",
                    sha256 = "8f4c1a9e7b2d4c8a10f6e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3"
                )
            ),
            permissions = listOf(
                AppPermission("android.permission.INTERNET", "Acesso à rede", PermissionRisk.LOW, "Necessário para transmitir áudio e buscar letras sincronizadas."),
                AppPermission("android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK", "Reprodução em segundo plano", PermissionRisk.LOW, "Mantém a música tocando com a tela bloqueada.")
            ),
            changelog = listOf("Motor de busca instantânea otimizado.", "Suporte nativo a controles no Android 15.")
        ),
        AndroidAppItem(
            id = "termux",
            name = "Termux",
            packageName = "com.termux",
            category = "Segurança",
            tagline = "Terminal Linux e ambiente ético de pentest/auditoria no Android com apt, nmap, python e openssh.",
            description = "Emulador de terminal completo com coleção oficial de pacotes Linux para diagnóstico de rede, automação em Python/Bash, varredura autorizada com nmap e auditoria SSH.",
            developer = "Termux Maintainers",
            version = "0.118.3",
            minAndroid = "7.0+",
            license = "GPL-3.0",
            updatedAt = "2026-11-14",
            downloadsCount = 1_680_000,
            repoSlug = "termux/termux-app",
            sourceType = AppSourceType.GITHUB,
            featured = true,
            remoteIconUrl = "https://raw.githubusercontent.com/termux/termux-app/master/fastlane/metadata/android/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/termux/termux-app/master/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg",
            remoteGalleryUrls = listOf(
                "https://raw.githubusercontent.com/termux/termux-app/master/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg",
                "https://raw.githubusercontent.com/termux/termux-app/master/fastlane/metadata/android/en-US/images/phoneScreenshots/2.jpg"
            ),
            localPreviewRes = R.drawable.hero_vault,
            accentHex = 0xFF1E293B,
            monogram = "TX",
            assets = listOf(
                ApkAsset("termux-app_v0.118.3+github-debug_arm64-v8a.apk", AndroidArch.ARM64_V8A, (31.8 * 1024 * 1024).toLong(), "https://github.com/termux/termux-app/releases/latest", "4b9f2c8d1e7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c")
            ),
            permissions = listOf(
                AppPermission("android.permission.INTERNET", "Redes e repositórios pkg", PermissionRisk.LOW, "Instalação de pacotes CLI (nmap, python, openssh)."),
                AppPermission("android.permission.WAKE_LOCK", "Manter sessão ativa", PermissionRisk.LOW, "Evita encerramento de scripts em execução prolongada.")
            ),
            changelog = listOf("Compatibilidade aprimorada com Android 15 e execução ELF.")
        ),
        AndroidAppItem(
            id = "pcapdroid",
            name = "PCAPdroid",
            packageName = "com.emanuelef.remote_capture",
            category = "Segurança",
            tagline = "Captura de pacotes PCAP sem root, detecção de conexões suspeitas e auditoria TLS/HTTP para Android.",
            description = "Sniffer open-source baseado em VpnService que captura tráfego IPv4/IPv6 em tempo real sem precisar de acesso root, identifica domínios e exporta .pcap.",
            developer = "emanuele-f",
            version = "1.8.2",
            minAndroid = "5.0+",
            license = "GPL-3.0",
            updatedAt = "2026-11-12",
            downloadsCount = 640_000,
            repoSlug = "emanuele-f/PCAPdroid",
            sourceType = AppSourceType.GITHUB,
            featured = true,
            remoteIconUrl = "https://raw.githubusercontent.com/emanuele-f/PCAPdroid/master/fastlane/metadata/android/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/emanuele-f/PCAPdroid/master/fastlane/metadata/android/en-US/images/featureGraphic.png",
            remoteGalleryUrls = listOf(
                "https://raw.githubusercontent.com/emanuele-f/PCAPdroid/master/fastlane/metadata/android/en-US/images/featureGraphic.png",
                "https://raw.githubusercontent.com/emanuele-f/PCAPdroid/master/fastlane/metadata/android/en-US/images/phoneScreenshots/1.png",
                "https://raw.githubusercontent.com/emanuele-f/PCAPdroid/master/fastlane/metadata/android/en-US/images/phoneScreenshots/2.png"
            ),
            localPreviewRes = R.drawable.hero_vault,
            accentHex = 0xFF7C3AED,
            monogram = "PC",
            assets = listOf(
                ApkAsset("PCAPdroid_v1.8.2.apk", AndroidArch.UNIVERSAL, (12.6 * 1024 * 1024).toLong(), "https://github.com/emanuele-f/PCAPdroid/releases/latest", "3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b")
            ),
            permissions = listOf(
                AppPermission("android.permission.BIND_VPN_SERVICE", "Captura local de pacotes", PermissionRisk.MODERATE, "Intercepta pacotes localmente sem enviar dados externos.")
            ),
            changelog = listOf("Descriptografia TLS e novo filtro de portas ao vivo.")
        ),
        AndroidAppItem(
            id = "wifianalyzer",
            name = "WiFiAnalyzer",
            packageName = "com.vrem.wifianalyzer",
            category = "Segurança",
            tagline = "Auditor de espectro Wi-Fi 2.4/5/6 GHz com mapa de canais, BSSID, segurança WPA3 e medição de sinal.",
            description = "Ferramenta de auditoria wireless open-source para identificar pontos de acesso, interferência de canais, criptografia utilizada e intensidade em dBm.",
            developer = "VREMSoftwareDevelopment",
            version = "4.4.0",
            minAndroid = "8.0+",
            license = "GPL-3.0",
            updatedAt = "2026-11-05",
            downloadsCount = 730_000,
            repoSlug = "VREMSoftwareDevelopment/WiFiAnalyzer",
            sourceType = AppSourceType.GITHUB,
            remoteIconUrl = "https://raw.githubusercontent.com/VREMSoftwareDevelopment/WiFiAnalyzer/main/fastlane/metadata/android/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/VREMSoftwareDevelopment/WiFiAnalyzer/main/images/feature-graphic.png",
            remoteGalleryUrls = listOf(
                "https://raw.githubusercontent.com/VREMSoftwareDevelopment/WiFiAnalyzer/main/images/feature-graphic.png",
                "https://raw.githubusercontent.com/VREMSoftwareDevelopment/WiFiAnalyzer/main/images/feature-graphic-light.png"
            ),
            localPreviewRes = R.drawable.hero_vault,
            accentHex = 0xFF0F766E,
            monogram = "WA",
            assets = listOf(
                ApkAsset("WiFiAnalyzer-4.4.0.apk", AndroidArch.UNIVERSAL, (6.4 * 1024 * 1024).toLong(), "https://github.com/VREMSoftwareDevelopment/WiFiAnalyzer/releases/latest", "7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f")
            ),
            permissions = listOf(
                AppPermission("android.permission.ACCESS_WIFI_STATE", "Leitura de redes Wi-Fi", PermissionRisk.LOW, "Exibe gráficos de canal, BSSID e dBm.")
            ),
            changelog = listOf("Suporte completo a bandas de 6 GHz (Wi-Fi 6E / Wi-Fi 7).")
        ),
        AndroidAppItem(
            id = "rethinkdns",
            name = "RethinkDNS + Firewall",
            packageName = "com.celzero.bravedns",
            category = "Segurança",
            tagline = "Firewall sem root, resolvedor DNS criptografado (DoH), monitor de logs e túneis WireGuard.",
            description = "Combina firewall granular, detecção de trackers em tempo real e clientes WireGuard/DoH para bloquear conexões indesejadas.",
            developer = "Celzero",
            version = "0.5.5t",
            minAndroid = "8.0+",
            license = "Apache-2.0",
            updatedAt = "2026-11-11",
            downloadsCount = 520_000,
            repoSlug = "celzero/rethink-app",
            sourceType = AppSourceType.GITHUB,
            remoteIconUrl = "https://raw.githubusercontent.com/celzero/rethink-app/main/fastlane/metadata/android/en-US/images/icon.png",
            remotePreviewUrl = "https://f-droid.org/repo/com.celzero.bravedns/en-US/phoneScreenshots/1.png",
            remoteGalleryUrls = listOf("https://f-droid.org/repo/com.celzero.bravedns/en-US/phoneScreenshots/1.png"),
            localPreviewRes = R.drawable.hero_vault,
            accentHex = 0xFF6D28D9,
            monogram = "RD",
            assets = listOf(
                ApkAsset("app-fdroid-release.apk", AndroidArch.UNIVERSAL, (34.2 * 1024 * 1024).toLong(), "https://github.com/celzero/rethink-app/releases/latest", "2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c")
            ),
            permissions = listOf(
                AppPermission("android.permission.BIND_VPN_SERVICE", "Firewall e DNS local", PermissionRisk.MODERATE, "Filtra domínios e IPs em segundo plano sem root.")
            ),
            changelog = listOf("Auditoria de domínios bloqueados e roteamento WireGuard.")
        ),
        AndroidAppItem(
            id = "netguard",
            name = "NetGuard Firewall",
            packageName = "eu.faircode.netguard",
            category = "Segurança",
            tagline = "Firewall leve por aplicativo com auditoria de IPs, bloqueio Wi-Fi/4G e captura de tráfego.",
            description = "Controla quais aplicativos acessam Wi-Fi ou rede celular e registra tentativas de conexão externa sem necessidade de root.",
            developer = "Marcel Bokhorst (M66B)",
            version = "2.332",
            minAndroid = "7.0+",
            license = "GPL-3.0",
            updatedAt = "2026-10-29",
            downloadsCount = 890_000,
            repoSlug = "M66B/NetGuard",
            sourceType = AppSourceType.GITHUB,
            remoteIconUrl = "https://raw.githubusercontent.com/M66B/NetGuard/master/fastlane/metadata/android/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/M66B/NetGuard/master/fastlane/metadata/android/en-US/images/featureGraphic.png",
            remoteGalleryUrls = listOf(
                "https://raw.githubusercontent.com/M66B/NetGuard/master/fastlane/metadata/android/en-US/images/featureGraphic.png",
                "https://raw.githubusercontent.com/M66B/NetGuard/master/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg",
                "https://raw.githubusercontent.com/M66B/NetGuard/master/fastlane/metadata/android/en-US/images/phoneScreenshots/2.jpg"
            ),
            localPreviewRes = R.drawable.hero_vault,
            accentHex = 0xFF3730A3,
            monogram = "NG",
            assets = listOf(
                ApkAsset("NetGuard-v2.332-release.apk", AndroidArch.UNIVERSAL, (4.8 * 1024 * 1024).toLong(), "https://github.com/M66B/NetGuard/releases/latest", "9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d")
            ),
            permissions = listOf(
                AppPermission("android.permission.BIND_VPN_SERVICE", "Controle local de conexões", PermissionRisk.MODERATE, "Implementa firewall local para bloquear conexões.")
            ),
            changelog = listOf("Registro de pacotes e filtragem por sub-rede aprimorados.")
        ),
        AndroidAppItem(
            id = "orbot",
            name = "Orbot (Rede Tor)",
            packageName = "org.torproject.android",
            category = "Privacidade",
            tagline = "Proxy criptografado da rede Tor que protege conexões de aplicativos e análises de rede no Android.",
            description = "Aplicativo oficial do Guardian Project & Tor Project para encapsular conexões pelo circuito Tor (VPN e SOCKS5).",
            developer = "Guardian Project",
            version = "17.4.0",
            minAndroid = "7.0+",
            license = "BSD-3-Clause",
            updatedAt = "2026-11-07",
            downloadsCount = 950_000,
            repoSlug = "guardianproject/orbot-android",
            sourceType = AppSourceType.GITHUB,
            remoteIconUrl = "https://raw.githubusercontent.com/guardianproject/orbot-android/main/fastlane/metadata/android/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/guardianproject/orbot-android/main/fastlane/metadata/android/en-US/images/featureGraphic.png",
            remoteGalleryUrls = listOf("https://raw.githubusercontent.com/guardianproject/orbot-android/main/fastlane/metadata/android/en-US/images/featureGraphic.png"),
            localPreviewRes = R.drawable.hero_vault,
            accentHex = 0xFF581C87,
            monogram = "OR",
            assets = listOf(
                ApkAsset("Orbot-arm64-v8a-release.apk", AndroidArch.ARM64_V8A, (29.5 * 1024 * 1024).toLong(), "https://github.com/guardianproject/orbot-android/releases/latest", "5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b")
            ),
            permissions = listOf(
                AppPermission("android.permission.BIND_VPN_SERVICE", "Tunelamento Tor por aplicativo", PermissionRisk.MODERATE, "Direciona apps selecionados pela rede criptografada Tor.")
            ),
            changelog = listOf("Pontes Snowflake e obfs4 atualizadas.")
        ),
        AndroidAppItem(
            id = "newpipe",
            name = "NewPipe",
            packageName = "org.schabi.newpipe",
            category = "Vídeo",
            tagline = "Cliente leve de vídeo em segundo plano, Picture-in-Picture e download offline sem conta Google.",
            description = "Reprodutor de vídeo projetado para máxima leveza e privacidade no Android, sem serviços proprietários do Google.",
            developer = "TeamNewPipe",
            version = "0.29.3",
            minAndroid = "6.0+",
            license = "GPL-3.0",
            updatedAt = "2026-11-12",
            downloadsCount = 1_420_000,
            repoSlug = "TeamNewPipe/NewPipe",
            sourceType = AppSourceType.GITHUB,
            featured = true,
            remoteIconUrl = "https://raw.githubusercontent.com/TeamNewPipe/NewPipe/master/fastlane/metadata/android/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/TeamNewPipe/NewPipe/master/fastlane/metadata/android/en-US/images/featureGraphic.png",
            remoteGalleryUrls = listOf(
                "https://raw.githubusercontent.com/TeamNewPipe/NewPipe/master/fastlane/metadata/android/en-US/images/featureGraphic.png",
                "https://raw.githubusercontent.com/TeamNewPipe/NewPipe/master/fastlane/metadata/android/en-US/images/phoneScreenshots/01.png",
                "https://raw.githubusercontent.com/TeamNewPipe/NewPipe/master/fastlane/metadata/android/en-US/images/phoneScreenshots/02.png"
            ),
            localIconRes = R.drawable.icon_newpipe,
            localPreviewRes = R.drawable.hero_video,
            accentHex = 0xFF9333EA,
            monogram = "NP",
            assets = listOf(
                ApkAsset("NewPipe_v0.29.3.apk", AndroidArch.UNIVERSAL, (16.2 * 1024 * 1024).toLong(), "https://github.com/TeamNewPipe/NewPipe/releases/latest", "4a1f9c2e8d7b6a5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c")
            ),
            permissions = listOf(
                AppPermission("android.permission.INTERNET", "Streaming e busca", PermissionRisk.LOW, "Carrega streams de vídeo e feeds públicos sem login.")
            ),
            changelog = listOf("Suporte aprimorado a streams AV1 em arm64.", "Novo seletor de resolução.")
        ),
        AndroidAppItem(
            id = "vimusic",
            name = "ViMusic",
            packageName = "it.vfsfitvnm.vimusic",
            category = "Música",
            tagline = "Player minimalista com cache automático de músicas, rádio infinito e modo offline.",
            description = "Interface limpa para ouvir músicas e podcasts sem anúncios, com cache automático local.",
            developer = "vfsfitvnm",
            version = "0.5.4",
            minAndroid = "8.0+",
            license = "GPL-3.0",
            updatedAt = "2026-10-28",
            downloadsCount = 510_000,
            repoSlug = "vfsfitvnm/ViMusic",
            sourceType = AppSourceType.GITHUB,
            remoteIconUrl = "https://raw.githubusercontent.com/vfsfitvnm/ViMusic/master/fastlane/metadata/android/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/vfsfitvnm/ViMusic/master/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg",
            remoteGalleryUrls = listOf(
                "https://raw.githubusercontent.com/vfsfitvnm/ViMusic/master/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg",
                "https://raw.githubusercontent.com/vfsfitvnm/ViMusic/master/fastlane/metadata/android/en-US/images/phoneScreenshots/2.jpg"
            ),
            localPreviewRes = R.drawable.hero_audio,
            accentHex = 0xFF6D28D9,
            monogram = "VM",
            assets = listOf(
                ApkAsset("ViMusic-v0.5.4-arm64-v8a.apk", AndroidArch.ARM64_V8A, (9.8 * 1024 * 1024).toLong(), "https://github.com/vfsfitvnm/ViMusic/releases/latest", "7d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e")
            ),
            permissions = listOf(AppPermission("android.permission.INTERNET", "Streaming de áudio", PermissionRisk.LOW, "Busca catálogos e letras públicas.")),
            changelog = listOf("Gerenciamento de cache local com limite configurável.")
        ),
        AndroidAppItem(
            id = "mihon",
            name = "Mihon",
            packageName = "app.mihon",
            category = "Leitura",
            tagline = "Leitor avançado de mangás e HQs com suporte a repositórios de extensões e leitura offline.",
            description = "Sucessor comunitário do Tachiyomi para leitura confortável em celulares e tablets Android.",
            developer = "Mihon App Contributors",
            version = "0.21.3",
            minAndroid = "8.0+",
            license = "Apache-2.0",
            updatedAt = "2026-11-04",
            downloadsCount = 675_000,
            repoSlug = "mihonapp/mihon",
            sourceType = AppSourceType.GITHUB,
            featured = true,
            remoteIconUrl = "https://raw.githubusercontent.com/mihonapp/mihon/main/fastlane/metadata/android/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/mihonapp/mihon/main/fastlane/metadata/android/en-US/images/featureGraphic.png",
            remoteGalleryUrls = listOf(
                "https://raw.githubusercontent.com/mihonapp/mihon/main/fastlane/metadata/android/en-US/images/featureGraphic.png",
                "https://raw.githubusercontent.com/mihonapp/mihon/main/fastlane/metadata/android/en-US/images/phoneScreenshots/1.png",
                "https://raw.githubusercontent.com/mihonapp/mihon/main/fastlane/metadata/android/en-US/images/phoneScreenshots/2.png"
            ),
            localIconRes = R.drawable.icon_mihon,
            localPreviewRes = R.drawable.hero_reader,
            accentHex = 0xFF5B21B6,
            monogram = "MH",
            assets = listOf(
                ApkAsset("mihon-arm64-v8a-v0.21.3.apk", AndroidArch.ARM64_V8A, (26.5 * 1024 * 1024).toLong(), "https://github.com/mihonapp/mihon/releases/latest", "3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a")
            ),
            permissions = listOf(AppPermission("android.permission.REQUEST_INSTALL_PACKAGES", "Instalar extensões APK", PermissionRisk.MODERATE, "Permite instalar extensões adicionais.")),
            changelog = listOf("Recorte automático de bordas e suporte aprimorado a CBZ/ZIP.")
        ),
        AndroidAppItem(
            id = "cromite",
            name = "Cromite",
            packageName = "org.cromite.cromite",
            category = "Privacidade",
            tagline = "Navegador Chromium com bloqueador de anúncios integrado e proteção contra rastreamento.",
            description = "Fork focado em privacidade baseado no Chromium moderno, trazendo filtros de anúncios nativos e proteção anti-fingerprinting.",
            developer = "uazo",
            version = "153.0.8010.37",
            minAndroid = "8.0+",
            license = "GPL-3.0",
            updatedAt = "2026-11-14",
            downloadsCount = 390_000,
            repoSlug = "uazo/cromite",
            sourceType = AppSourceType.GITHUB,
            localIconRes = R.drawable.icon_cromite,
            localPreviewRes = R.drawable.hero_vault,
            iconZoom = true,
            accentHex = 0xFF4C1D95,
            monogram = "CR",
            assets = listOf(
                ApkAsset("arm64_ChromePublic.apk", AndroidArch.ARM64_V8A, (308.8 * 1024 * 1024).toLong(), "https://github.com/uazo/cromite/releases/latest", "6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b")
            ),
            permissions = listOf(AppPermission("android.permission.INTERNET", "Navegação web", PermissionRisk.LOW, "Carrega páginas e filtros adblock.")),
            changelog = listOf("Atualização do motor Chromium com patches de segurança.")
        ),
        AndroidAppItem(
            id = "obtainium",
            name = "Obtainium",
            packageName = "dev.imranr.obtainium",
            category = "Utilitários",
            tagline = "Atualize APKs diretamente dos repositórios oficiais do GitHub, GitLab e F-Droid.",
            description = "Acompanha novas versões direto na fonte dos desenvolvedores e verifica atualizações com um toque.",
            developer = "ImranR98",
            version = "1.1.32",
            minAndroid = "8.0+",
            license = "GPL-3.0",
            updatedAt = "2026-11-11",
            downloadsCount = 315_000,
            repoSlug = "ImranR98/Obtainium",
            sourceType = AppSourceType.GITHUB,
            remoteIconUrl = "https://raw.githubusercontent.com/ImranR98/Obtainium/main/assets/graphics/icon_small.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/ImranR98/Obtainium/main/assets/screenshots/1.apps.png",
            remoteGalleryUrls = listOf("https://raw.githubusercontent.com/ImranR98/Obtainium/main/assets/screenshots/1.apps.png"),
            localPreviewRes = R.drawable.hero_repos,
            accentHex = 0xFF7E22CE,
            monogram = "OB",
            assets = listOf(
                ApkAsset("app-arm64-v8a-release.apk", AndroidArch.ARM64_V8A, (22.1 * 1024 * 1024).toLong(), "https://github.com/ImranR98/Obtainium/releases/latest", "c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5")
            ),
            permissions = listOf(AppPermission("android.permission.REQUEST_INSTALL_PACKAGES", "Instalar pacotes APK", PermissionRisk.SENSITIVE, "Aciona o instalador nativo do Android.")),
            changelog = listOf("Detecção automática de arquitetura em releases.")
        ),
        AndroidAppItem(
            id = "localsend",
            name = "LocalSend",
            packageName = "org.localsend.localsend_app",
            category = "Utilitários",
            tagline = "Envie arquivos, fotos e APKs entre Android, Windows, macOS e Linux pelo Wi-Fi local.",
            description = "Alternativa open-source ao AirDrop que funciona via rede local criptografada sem cabos nem nuvem.",
            developer = "Tien Do Nam",
            version = "1.18.2",
            minAndroid = "7.0+",
            license = "MIT",
            updatedAt = "2026-11-08",
            downloadsCount = 620_000,
            repoSlug = "localsend/localsend",
            sourceType = AppSourceType.GITHUB,
            remoteIconUrl = "https://raw.githubusercontent.com/localsend/localsend/main/fastlane/metadata/android/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/localsend/localsend/main/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg",
            remoteGalleryUrls = listOf(
                "https://raw.githubusercontent.com/localsend/localsend/main/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg",
                "https://raw.githubusercontent.com/localsend/localsend/main/fastlane/metadata/android/en-US/images/phoneScreenshots/2.jpg"
            ),
            localPreviewRes = R.drawable.hero_vault,
            accentHex = 0xFF6B21A8,
            monogram = "LS",
            assets = listOf(
                ApkAsset("LocalSend-1.18.2-android-arm64v8a.apk", AndroidArch.ARM64_V8A, (37.5 * 1024 * 1024).toLong(), "https://github.com/localsend/localsend/releases/latest", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2")
            ),
            permissions = listOf(AppPermission("android.permission.ACCESS_WIFI_STATE", "Descoberta na rede local", PermissionRisk.LOW, "Encontra dispositivos próximos no mesmo Wi-Fi.")),
            changelog = listOf("Transferência simultânea de pastas e envio direto de APKs.")
        ),
        AndroidAppItem(
            id = "libretube",
            name = "LibreTube",
            packageName = "com.github.libretube",
            category = "Vídeo",
            tagline = "Interface fluida para assistir vídeos sem anúncios usando instâncias Piped.",
            description = "Cliente alternativo com SponsorBlock nativo, playlists locais e download em segundo plano.",
            developer = "LibreTube Team",
            version = "0.26.1",
            minAndroid = "8.0+",
            license = "GPL-3.0",
            updatedAt = "2026-10-30",
            downloadsCount = 410_000,
            repoSlug = "libre-tube/LibreTube",
            sourceType = AppSourceType.GITHUB,
            remoteIconUrl = "https://raw.githubusercontent.com/libre-tube/LibreTube/master/fastlane/metadata/android/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/libre-tube/LibreTube/master/assets/banners/gh-banner.png",
            remoteGalleryUrls = listOf(
                "https://raw.githubusercontent.com/libre-tube/LibreTube/master/assets/banners/gh-banner.png",
                "https://raw.githubusercontent.com/libre-tube/LibreTube/master/fastlane/metadata/android/en-US/images/phoneScreenshots/Screenshot_1.jpg",
                "https://raw.githubusercontent.com/libre-tube/LibreTube/master/fastlane/metadata/android/en-US/images/phoneScreenshots/Screenshot_2.jpg"
            ),
            localPreviewRes = R.drawable.hero_video,
            accentHex = 0xFF581C87,
            monogram = "LT",
            assets = listOf(
                ApkAsset("libretube-release-universal.apk", AndroidArch.UNIVERSAL, (16.5 * 1024 * 1024).toLong(), "https://github.com/libre-tube/LibreTube/releases/latest", "d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2")
            ),
            permissions = listOf(AppPermission("android.permission.INTERNET", "Conexão Piped", PermissionRisk.LOW, "Busca vídeos e comentários pela API escolhida.")),
            changelog = listOf("Troca automática de instância e modo áudio dedicado.")
        ),
        AndroidAppItem(
            id = "breezy",
            name = "Breezy Weather",
            packageName = "org.breezyweather",
            category = "Utilitários",
            tagline = "Previsão do tempo com radar de chuva, qualidade do ar e widgets limpos para Android.",
            description = "Aplicativo climático open-source com gráficos detalhados de temperatura, índice UV e provedores meteorológicos configuráveis.",
            developer = "Breezy Weather",
            version = "5.3.4",
            minAndroid = "7.0+",
            license = "LGPL-3.0",
            updatedAt = "2026-11-09",
            downloadsCount = 285_000,
            repoSlug = "breezy-weather/breezy-weather",
            sourceType = AppSourceType.FDROID,
            remoteIconUrl = "https://raw.githubusercontent.com/breezy-weather/breezy-weather/main/fastlane/metadata/android/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/breezy-weather/breezy-weather/main/fastlane/metadata/android/en-US/images/phoneScreenshots/01-main-header-light.png",
            remoteGalleryUrls = listOf("https://raw.githubusercontent.com/breezy-weather/breezy-weather/main/fastlane/metadata/android/en-US/images/phoneScreenshots/01-main-header-light.png"),
            localPreviewRes = R.drawable.hero_reader,
            accentHex = 0xFF4338CA,
            monogram = "BW",
            assets = listOf(
                ApkAsset("breezy-weather-v5.3.4-standard.apk", AndroidArch.UNIVERSAL, (15.2 * 1024 * 1024).toLong(), "https://github.com/breezy-weather/breezy-weather/releases/latest", "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6")
            ),
            permissions = listOf(AppPermission("android.permission.ACCESS_COARSE_LOCATION", "Localização aproximada", PermissionRisk.MODERATE, "Opcional para detectar sua cidade automaticamente.")),
            changelog = listOf("Novos widgets adaptativos e previsão minuto a minuto.")
        ),
        AndroidAppItem(
            id = "aegis",
            name = "Aegis Authenticator",
            packageName = "com.beemdevelopment.aegis",
            category = "Privacidade",
            tagline = "Gerenciador 2FA criptografado com biometria, backups locais e importação de tokens.",
            description = "Cofre seguro para códigos de autenticação em duas etapas (TOTP/HOTP), totalmente offline e protegido por AES-256.",
            developer = "beemdevelopment",
            version = "3.4.3",
            minAndroid = "7.0+",
            license = "GPL-3.0",
            updatedAt = "2026-10-22",
            downloadsCount = 540_000,
            repoSlug = "beemdevelopment/Aegis",
            sourceType = AppSourceType.FDROID,
            remoteIconUrl = "https://raw.githubusercontent.com/beemdevelopment/Aegis/master/metadata/en-US/images/icon.png",
            remotePreviewUrl = "https://raw.githubusercontent.com/beemdevelopment/Aegis/master/metadata/en-US/images/phoneScreenshots/screenshot1.png?raw=true",
            remoteGalleryUrls = listOf(
                "https://raw.githubusercontent.com/beemdevelopment/Aegis/master/metadata/en-US/images/phoneScreenshots/screenshot1.png?raw=true",
                "https://raw.githubusercontent.com/beemdevelopment/Aegis/master/metadata/en-US/images/phoneScreenshots/screenshot2.png?raw=true"
            ),
            localIconRes = R.drawable.icon_aegis,
            localPreviewRes = R.drawable.hero_vault,
            accentHex = 0xFF3B0764,
            monogram = "AE",
            assets = listOf(
                ApkAsset("aegis-3.4.3-release.apk", AndroidArch.UNIVERSAL, (6.6 * 1024 * 1024).toLong(), "https://github.com/beemdevelopment/Aegis/releases/latest", "11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff")
            ),
            permissions = listOf(AppPermission("android.permission.USE_BIOMETRIC", "Desbloqueio biométrico", PermissionRisk.LOW, "Protege o cofre criptografado.")),
            changelog = listOf("Backup automático criptografado e pesquisa instantânea por emissor.")
        )
    )
}
