import type { AndroidAppItem, RepositorySource } from '../types';

const p = (rawUrl: string) => `/api/media?url=${encodeURIComponent(rawUrl)}`;

export const HERO_MEDIA = {
  myspoti: p(
    'https://raw.githubusercontent.com/KRTirtho/spotube/master/metadata/en-US/images/phoneScreenshots/1.png'
  ),
  video: p(
    'https://raw.githubusercontent.com/TeamNewPipe/NewPipe/master/fastlane/metadata/android/en-US/images/featureGraphic.png'
  ),
  reader: p(
    'https://raw.githubusercontent.com/mihonapp/mihon/main/fastlane/metadata/android/en-US/images/featureGraphic.png'
  ),
  vault: p(
    'https://raw.githubusercontent.com/emanuele-f/PCAPdroid/master/fastlane/metadata/android/en-US/images/featureGraphic.png'
  ),
  repos: p(
    'https://raw.githubusercontent.com/ImranR98/Obtainium/main/assets/screenshots/1.apps.png'
  ),
  audio: p(
    'https://raw.githubusercontent.com/vfsfitvnm/ViMusic/master/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg'
  ),
  mediaBanner: p(
    'https://raw.githubusercontent.com/libre-tube/LibreTube/master/assets/banners/gh-banner.png'
  ),
};

export const APP_ICONS = {
  myspoti: p(
    'https://raw.githubusercontent.com/KRTirtho/spotube/master/metadata/en-US/images/icon.png'
  ),
  newpipe: p(
    'https://raw.githubusercontent.com/TeamNewPipe/NewPipe/master/fastlane/metadata/android/en-US/images/icon.png'
  ),
  vimusic: p(
    'https://raw.githubusercontent.com/vfsfitvnm/ViMusic/master/fastlane/metadata/android/en-US/images/icon.png'
  ),
  mihon: p(
    'https://raw.githubusercontent.com/mihonapp/mihon/main/fastlane/metadata/android/en-US/images/icon.png'
  ),
  cromite: '/src/assets/images/icon_cromite_1794871593013.jpg',
  obtainium: p(
    'https://raw.githubusercontent.com/ImranR98/Obtainium/main/assets/graphics/icon_small.png'
  ),
  localsend: p(
    'https://raw.githubusercontent.com/localsend/localsend/main/fastlane/metadata/android/en-US/images/icon.png'
  ),
  libretube: p(
    'https://raw.githubusercontent.com/libre-tube/LibreTube/master/fastlane/metadata/android/en-US/images/icon.png'
  ),
  breezy: p(
    'https://raw.githubusercontent.com/breezy-weather/breezy-weather/main/fastlane/metadata/android/en-US/images/icon.png'
  ),
  aegis: p(
    'https://raw.githubusercontent.com/beemdevelopment/Aegis/master/metadata/en-US/images/icon.png'
  ),
  termux: p(
    'https://raw.githubusercontent.com/termux/termux-app/master/fastlane/metadata/android/en-US/images/icon.png'
  ),
  pcapdroid: p(
    'https://raw.githubusercontent.com/emanuele-f/PCAPdroid/master/fastlane/metadata/android/en-US/images/icon.png'
  ),
  wifianalyzer: p(
    'https://raw.githubusercontent.com/VREMSoftwareDevelopment/WiFiAnalyzer/main/fastlane/metadata/android/en-US/images/icon.png'
  ),
  orbot: p(
    'https://raw.githubusercontent.com/guardianproject/orbot-android/main/fastlane/metadata/android/en-US/images/icon.png'
  ),
  rethink: p(
    'https://raw.githubusercontent.com/celzero/rethink-app/main/fastlane/metadata/android/en-US/images/icon.png'
  ),
  netguard: p(
    'https://raw.githubusercontent.com/M66B/NetGuard/master/fastlane/metadata/android/en-US/images/icon.png'
  ),
  githubApk: '/app-icons/github-apk.svg',
};

export const INITIAL_REPOSITORIES: RepositorySource[] = [
  {
    id: 'fdroid-main',
    name: 'F-Droid Oficial',
    slug: 'f-droid/fdroid-repo',
    url: 'https://f-droid.org/repo',
    kind: 'fdroid',
    enabled: true,
    verified: true,
    appCount: 4996,
    lastSyncedAt: '2026-11-16',
    description:
      'Catálogo principal de software livre para Android compilado de forma reproduzível e auditável.',
  },
  {
    id: 'fdroid-archive',
    name: 'F-Droid Archive',
    slug: 'f-droid/fdroid-archive',
    url: 'https://f-droid.org/archive',
    kind: 'fdroid',
    enabled: true,
    verified: true,
    appCount: 5404,
    lastSyncedAt: '2026-11-16',
    description:
      'Arquivo histórico e versões clássicas de mais de 5.400 pacotes FOSS preservados do F-Droid.',
  },
  {
    id: 'izzyondroid',
    name: 'IzzyOnDroid Community',
    slug: 'IzzySoft/Fdroid',
    url: 'https://apt.izzysoft.de/fdroid/repo',
    kind: 'fdroid',
    enabled: true,
    verified: true,
    appCount: 1401,
    lastSyncedAt: '2026-11-16',
    description:
      'Índice comunitário com mais de 1.400 builds oficiais compilados por desenvolvedores independentes.',
  },
  {
    id: 'nethunter',
    name: 'Kali NetHunter Store',
    slug: 'offensive-security/kali-nethunter-store',
    url: 'https://store.nethunter.com/repo',
    kind: 'fdroid',
    enabled: true,
    verified: true,
    appCount: 39,
    lastSyncedAt: '2026-11-16',
    description:
      'Ferramentas oficiais de pentest ético, diagnóstico de rede, análise Wi-Fi e auditoria Kali Linux.',
  },
  {
    id: 'nethunter-archive',
    name: 'Kali NetHunter Archive',
    slug: 'offensive-security/nethunter-archive',
    url: 'https://store.nethunter.com/archive',
    kind: 'fdroid',
    enabled: true,
    verified: true,
    appCount: 16,
    lastSyncedAt: '2026-11-16',
    description:
      'Builds clássicas e utilitários avançados do ecossistema NetHunter e terminal pentest.',
  },
  {
    id: 'kde-android',
    name: 'KDE Android FOSS',
    slug: 'KDE/kde-android-repo',
    url: 'https://cdn.kde.org/android/fdroid/repo',
    kind: 'fdroid',
    enabled: true,
    verified: true,
    appCount: 27,
    lastSyncedAt: '2026-11-16',
    description:
      'Aplicativos oficiais da comunidade KDE para Android com sincronização e mídia open-source.',
  },
  {
    id: 'guardian',
    name: 'Guardian Project Tor & Privacy',
    slug: 'guardianproject/fdroid-repo',
    url: 'https://guardianproject.info/fdroid/repo',
    kind: 'fdroid',
    enabled: true,
    verified: true,
    appCount: 16,
    lastSyncedAt: '2026-11-16',
    description:
      'Proxy nativo da rede Tor (Orbot), comunicação criptografada e proteção de metadados.',
  },
  {
    id: 'fedilab',
    name: 'Fedilab & Fediverse FOSS',
    slug: 'Fedilab/fdroid-repo',
    url: 'https://fdroid.fedilab.app/repo',
    kind: 'fdroid',
    enabled: true,
    verified: true,
    appCount: 6,
    lastSyncedAt: '2026-11-16',
    description:
      'Clientes descentralizados e ferramentas abertas do Fediverso sem rastreadores comerciais.',
  },
  {
    id: 'microg',
    name: 'microG Services Core',
    slug: 'microg/android_packages_apps_GmsCore',
    url: 'https://microg.org/fdroid/repo',
    kind: 'fdroid',
    enabled: true,
    verified: true,
    appCount: 3,
    lastSyncedAt: '2026-11-16',
    description:
      'Reimplementação livre e leve de serviços Android para rodar apps sem serviços proprietários.',
  },
  {
    id: 'briar',
    name: 'Briar Peer-to-Peer Mesh',
    slug: 'briar/briar-fdroid',
    url: 'https://briarproject.org/fdroid/repo',
    kind: 'fdroid',
    enabled: true,
    verified: true,
    appCount: 2,
    lastSyncedAt: '2026-11-16',
    description:
      'Mensageiro criptografado ponto a ponto via Tor, Wi-Fi direto ou Bluetooth sem servidores centrais.',
  },
  {
    id: 'bitwarden',
    name: 'Bitwarden Mobile FOSS',
    slug: 'bitwarden/mobile-fdroid',
    url: 'https://mobileapp.bitwarden.com/fdroid/repo',
    kind: 'fdroid',
    enabled: true,
    verified: true,
    appCount: 1,
    lastSyncedAt: '2026-11-16',
    description:
      'Cofre oficial de senhas auditado e open-source direto da fonte de distribuição F-Droid.',
  },
  {
    id: 'github-flagship',
    name: 'GitHub Direct APK Releases',
    slug: 'ImranR98/Obtainium',
    url: 'https://github.com',
    kind: 'github',
    enabled: true,
    verified: true,
    appCount: 16,
    lastSyncedAt: '2026-11-16',
    description:
      'Destaques diretos do GitHub (MySpoti, Termux, PCAPdroid, Mihon, NewPipe, Cromite, LocalSend e Obtainium).',
  },
];

export const CURATED_APPS: AndroidAppItem[] = [
  {
    id: 'myspoti',
    name: 'MySpoti',
    packageName: 'oss.krtirtho.spotube',
    category: 'Música',
    tagline:
      'Player de música alternativo sem anúncios, letras sincronizadas e áudio em alta fidelidade.',
    description:
      'Cliente de streaming musical multiplataforma fora da Play Store, focado em privacidade, zero rastreadores comerciais e consumo reduzido de bateria.',
    developer: 'MySpoti Community & Spotube Core',
    version: '6.0.0',
    minAndroid: '8.0+',
    license: 'BSD-4-Clause',
    updatedAt: '2026-11-10',
    downloadsCount: 845000,
    repoSlug: 'KRTirtho/spotube',
    sourceType: 'github',
    featured: true,
    iconImage: APP_ICONS.myspoti,
    bannerImage: HERO_MEDIA.myspoti,
    previewImage: HERO_MEDIA.myspoti,
    galleryImages: [HERO_MEDIA.myspoti],
    accentColor: '#7C3AED',
    monogram: 'MS',
    assets: [
      {
        name: 'Spotube-android-all-arch.apk',
        arch: 'universal',
        sizeBytes: 73.1 * 1024 * 1024,
        downloadUrl: 'https://github.com/KRTirtho/spotube/releases/latest',
        sha256: '8f4c1a9e7b2d4c8a10f6e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
      },
    ],
    permissions: [
      {
        code: 'android.permission.INTERNET',
        label: 'Acesso à rede',
        risk: 'baixo',
        reason: 'Necessário para transmitir áudio e buscar letras sincronizadas.',
      },
      {
        code: 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
        label: 'Reprodução em segundo plano',
        risk: 'baixo',
        reason: 'Mantém a música tocando com a tela bloqueada.',
      },
    ],
    changelog: [
      'Motor de busca instantânea de faixas e álbuns otimizado.',
      'Suporte nativo a controles na tela de bloqueio do Android 15.',
    ],
  },
  {
    id: 'termux',
    name: 'Termux',
    packageName: 'com.termux',
    category: 'Segurança',
    tagline:
      'Terminal Linux e ambiente ético de pentest/auditoria no Android com apt, nmap, python e openssh.',
    description:
      'Emulador de terminal completo com coleção oficial de pacotes Linux para diagnóstico de rede, automação em Python/Bash, varredura autorizada com nmap e auditoria de serviços via SSH.',
    developer: 'Termux Maintainers',
    version: '0.118.3',
    minAndroid: '7.0+',
    license: 'GPL-3.0',
    updatedAt: '2026-11-14',
    downloadsCount: 1680000,
    repoSlug: 'termux/termux-app',
    sourceType: 'github',
    featured: true,
    iconImage: APP_ICONS.termux,
    previewImage: p(
      'https://raw.githubusercontent.com/termux/termux-app/master/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg'
    ),
    galleryImages: [
      p(
        'https://raw.githubusercontent.com/termux/termux-app/master/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg'
      ),
      p(
        'https://raw.githubusercontent.com/termux/termux-app/master/fastlane/metadata/android/en-US/images/phoneScreenshots/2.jpg'
      ),
    ],
    accentColor: '#1E293B',
    monogram: 'TX',
    assets: [
      {
        name: 'termux-app_v0.118.3+github-debug_arm64-v8a.apk',
        arch: 'arm64-v8a',
        sizeBytes: 31.8 * 1024 * 1024,
        downloadUrl: 'https://github.com/termux/termux-app/releases/latest',
        sha256: '4b9f2c8d1e7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c',
      },
      {
        name: 'termux-app_v0.118.3+github-debug_universal.apk',
        arch: 'universal',
        sizeBytes: 102.4 * 1024 * 1024,
        downloadUrl: 'https://github.com/termux/termux-app/releases/latest',
        sha256: '1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
      },
    ],
    permissions: [
      {
        code: 'android.permission.INTERNET',
        label: 'Redes e repositórios pkg',
        risk: 'baixo',
        reason: 'Instalação de pacotes CLI (nmap, python, curl, git) e conexões SSH.',
      },
      {
        code: 'android.permission.WAKE_LOCK',
        label: 'Manter sessão ativa',
        risk: 'baixo',
        reason: 'Evita encerramento de scripts de auditoria em execução prolongada.',
      },
    ],
    changelog: [
      'Compatibilidade aprimorada com Android 15 e execução de binários ELF.',
      'Correções no teclado extra de teclas CTRL/ALT/ESC.',
    ],
  },
  {
    id: 'pcapdroid',
    name: 'PCAPdroid',
    packageName: 'com.emanuelef.remote_capture',
    category: 'Segurança',
    tagline:
      'Captura de pacotes PCAP sem root, detecção de conexões suspeitas e auditoria TLS/HTTP para Android.',
    description:
      'Sniffer open-source baseado em VpnService que captura tráfego IPv4/IPv6 em tempo real sem precisar de acesso root, identifica domínios contactados por apps e exporta arquivos .pcap para o Wireshark.',
    developer: 'emanuele-f',
    version: '1.8.2',
    minAndroid: '5.0+',
    license: 'GPL-3.0',
    updatedAt: '2026-11-12',
    downloadsCount: 640000,
    repoSlug: 'emanuele-f/PCAPdroid',
    sourceType: 'github',
    featured: true,
    iconImage: APP_ICONS.pcapdroid,
    previewImage: HERO_MEDIA.vault,
    galleryImages: [
      HERO_MEDIA.vault,
      p(
        'https://raw.githubusercontent.com/emanuele-f/PCAPdroid/master/fastlane/metadata/android/en-US/images/phoneScreenshots/1.png'
      ),
      p(
        'https://raw.githubusercontent.com/emanuele-f/PCAPdroid/master/fastlane/metadata/android/en-US/images/phoneScreenshots/2.png'
      ),
    ],
    accentColor: '#7C3AED',
    monogram: 'PC',
    assets: [
      {
        name: 'PCAPdroid_v1.8.2.apk',
        arch: 'universal',
        sizeBytes: 12.6 * 1024 * 1024,
        downloadUrl: 'https://github.com/emanuele-f/PCAPdroid/releases/latest',
        sha256: '3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
      },
    ],
    permissions: [
      {
        code: 'android.permission.BIND_VPN_SERVICE',
        label: 'Interface local de captura de pacotes',
        risk: 'moderado',
        reason: 'Intercepta pacotes localmente para análise sem enviar dados externos.',
      },
      {
        code: 'android.permission.INTERNET',
        label: 'Streaming PCAP remoto',
        risk: 'baixo',
        reason: 'Opcional para encaminhar pacotes em tempo real ao Wireshark.',
      },
    ],
    changelog: [
      'Suporte aprimorado a descriptografia TLS e regras de malware/rastreadores.',
      'Novo filtro de portas e processos no painel de inspeção ao vivo.',
    ],
  },
  {
    id: 'wifianalyzer',
    name: 'WiFiAnalyzer',
    packageName: 'com.vrem.wifianalyzer',
    category: 'Segurança',
    tagline:
      'Auditor de espectro Wi-Fi 2.4/5/6 GHz com mapa de canais, BSSID, segurança WPA3 e medição de sinal.',
    description:
      'Ferramenta de auditoria wireless open-source para identificar pontos de acesso, interferência de canais, criptografia utilizada e intensidade em dBm no entorno.',
    developer: 'VREMSoftwareDevelopment',
    version: '4.4.0',
    minAndroid: '8.0+',
    license: 'GPL-3.0',
    updatedAt: '2026-11-05',
    downloadsCount: 730000,
    repoSlug: 'VREMSoftwareDevelopment/WiFiAnalyzer',
    sourceType: 'github',
    iconImage: APP_ICONS.wifianalyzer,
    previewImage: p(
      'https://raw.githubusercontent.com/VREMSoftwareDevelopment/WiFiAnalyzer/main/images/feature-graphic.png'
    ),
    galleryImages: [
      p(
        'https://raw.githubusercontent.com/VREMSoftwareDevelopment/WiFiAnalyzer/main/images/feature-graphic.png'
      ),
      p(
        'https://raw.githubusercontent.com/VREMSoftwareDevelopment/WiFiAnalyzer/main/images/feature-graphic-light.png'
      ),
    ],
    accentColor: '#0F766E',
    monogram: 'WA',
    assets: [
      {
        name: 'WiFiAnalyzer-4.4.0.apk',
        arch: 'universal',
        sizeBytes: 6.4 * 1024 * 1024,
        downloadUrl: 'https://github.com/VREMSoftwareDevelopment/WiFiAnalyzer/releases/latest',
        sha256: '7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
      },
    ],
    permissions: [
      {
        code: 'android.permission.ACCESS_WIFI_STATE',
        label: 'Leitura de redes Wi-Fi próximas',
        risk: 'baixo',
        reason: 'Exibe gráficos de canal, BSSID, fabricante e dBm.',
      },
      {
        code: 'android.permission.ACCESS_FINE_LOCATION',
        label: 'Varredura Wi-Fi do Android',
        risk: 'moderado',
        reason: 'Exigida pelo sistema operacional para retornar resultados de scan Wi-Fi.',
      },
    ],
    changelog: [
      'Suporte completo a bandas de 6 GHz (Wi-Fi 6E / Wi-Fi 7).',
      'Identificação ampliada de fabricantes via base OUI.',
    ],
  },
  {
    id: 'rethinkdns',
    name: 'RethinkDNS + Firewall',
    packageName: 'com.celzero.bravedns',
    category: 'Segurança',
    tagline:
      'Firewall sem root, resolvedor DNS criptografado (DoH), monitor de logs e túneis WireGuard.',
    description:
      'Combina firewall granular, detecção de trackers em tempo real e clientes WireGuard/DoH para inspecionar e bloquear qualquer conexão indesejada no aparelho.',
    developer: 'Celzero',
    version: '0.5.5t',
    minAndroid: '8.0+',
    license: 'Apache-2.0',
    updatedAt: '2026-11-11',
    downloadsCount: 520000,
    repoSlug: 'celzero/rethink-app',
    sourceType: 'github',
    iconImage: APP_ICONS.rethink,
    previewImage: p(
      'https://f-droid.org/repo/com.celzero.bravedns/en-US/phoneScreenshots/1.png'
    ),
    galleryImages: [
      p('https://f-droid.org/repo/com.celzero.bravedns/en-US/phoneScreenshots/1.png'),
    ],
    accentColor: '#6D28D9',
    monogram: 'RD',
    assets: [
      {
        name: 'app-fdroid-release.apk',
        arch: 'universal',
        sizeBytes: 34.2 * 1024 * 1024,
        downloadUrl: 'https://github.com/celzero/rethink-app/releases/latest',
        sha256: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
      },
    ],
    permissions: [
      {
        code: 'android.permission.BIND_VPN_SERVICE',
        label: 'Firewall e roteamento DNS local',
        risk: 'moderado',
        reason: 'Filtra domínios e IPs em segundo plano sem root.',
      },
    ],
    changelog: [
      'Novo painel de auditoria de domínios bloqueados por aplicativo.',
      'Roteamento múltiplo simultâneo via WireGuard e Orbot.',
    ],
  },
  {
    id: 'netguard',
    name: 'NetGuard Firewall',
    packageName: 'eu.faircode.netguard',
    category: 'Segurança',
    tagline:
      'Firewall leve por aplicativo com auditoria de IPs, bloqueio Wi-Fi/4G e captura de tráfego.',
    description:
      'Permite controlar com precisão quais aplicativos podem acessar Wi-Fi ou rede celular e registrar cada tentativa de conexão externa sem necessidade de root.',
    developer: 'Marcel Bokhorst (M66B)',
    version: '2.332',
    minAndroid: '7.0+',
    license: 'GPL-3.0',
    updatedAt: '2026-10-29',
    downloadsCount: 890000,
    repoSlug: 'M66B/NetGuard',
    sourceType: 'github',
    iconImage: APP_ICONS.netguard,
    previewImage: p(
      'https://raw.githubusercontent.com/M66B/NetGuard/master/fastlane/metadata/android/en-US/images/featureGraphic.png'
    ),
    galleryImages: [
      p(
        'https://raw.githubusercontent.com/M66B/NetGuard/master/fastlane/metadata/android/en-US/images/featureGraphic.png'
      ),
      p(
        'https://raw.githubusercontent.com/M66B/NetGuard/master/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg'
      ),
      p(
        'https://raw.githubusercontent.com/M66B/NetGuard/master/fastlane/metadata/android/en-US/images/phoneScreenshots/2.jpg'
      ),
    ],
    accentColor: '#3730A3',
    monogram: 'NG',
    assets: [
      {
        name: 'NetGuard-v2.332-release.apk',
        arch: 'universal',
        sizeBytes: 4.8 * 1024 * 1024,
        downloadUrl: 'https://github.com/M66B/NetGuard/releases/latest',
        sha256: '9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
      },
    ],
    permissions: [
      {
        code: 'android.permission.BIND_VPN_SERVICE',
        label: 'Controle local de conexões',
        risk: 'moderado',
        reason: 'Implementa firewall local para bloquear conexões de saída.',
      },
    ],
    changelog: [
      'Suporte aprimorado ao registro de pacotes e filtragem por sub-rede.',
    ],
  },
  {
    id: 'orbot',
    name: 'Orbot (Rede Tor)',
    packageName: 'org.torproject.android',
    category: 'Privacidade',
    tagline:
      'Proxy criptografado da rede Tor que protege conexões de aplicativos e análises de rede no Android.',
    description:
      'Aplicativo oficial do Guardian Project & Tor Project para encapsular conexões pelo circuito Tor (VPN e SOCKS5) e reduzir vigilância de tráfego.',
    developer: 'Guardian Project',
    version: '17.4.0',
    minAndroid: '7.0+',
    license: 'BSD-3-Clause',
    updatedAt: '2026-11-07',
    downloadsCount: 950000,
    repoSlug: 'guardianproject/orbot-android',
    sourceType: 'github',
    iconImage: APP_ICONS.orbot,
    previewImage: p(
      'https://raw.githubusercontent.com/guardianproject/orbot-android/main/fastlane/metadata/android/en-US/images/featureGraphic.png'
    ),
    galleryImages: [
      p(
        'https://raw.githubusercontent.com/guardianproject/orbot-android/main/fastlane/metadata/android/en-US/images/featureGraphic.png'
      ),
    ],
    accentColor: '#581C87',
    monogram: 'OR',
    assets: [
      {
        name: 'Orbot-arm64-v8a-release.apk',
        arch: 'arm64-v8a',
        sizeBytes: 29.5 * 1024 * 1024,
        downloadUrl: 'https://github.com/guardianproject/orbot-android/releases/latest',
        sha256: '5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
      },
    ],
    permissions: [
      {
        code: 'android.permission.BIND_VPN_SERVICE',
        label: 'Tunelamento Tor por aplicativo',
        risk: 'moderado',
        reason: 'Direciona os apps selecionados pela rede criptografada Tor.',
      },
    ],
    changelog: [
      'Pontes Snowflake e obfs4 atualizadas para redes restritas.',
    ],
  },
  {
    id: 'newpipe',
    name: 'NewPipe',
    packageName: 'org.schabi.newpipe',
    category: 'Vídeo',
    tagline:
      'Cliente leve de vídeo em segundo plano, Picture-in-Picture e download offline sem conta Google.',
    description:
      'Reprodutor de vídeo projetado para máxima leveza e privacidade no Android, sem serviços proprietários do Google.',
    developer: 'TeamNewPipe',
    version: '0.29.3',
    minAndroid: '6.0+',
    license: 'GPL-3.0',
    updatedAt: '2026-11-12',
    downloadsCount: 1420000,
    repoSlug: 'TeamNewPipe/NewPipe',
    sourceType: 'github',
    featured: true,
    iconImage: APP_ICONS.newpipe,
    previewImage: HERO_MEDIA.video,
    galleryImages: [
      HERO_MEDIA.video,
      p(
        'https://raw.githubusercontent.com/TeamNewPipe/NewPipe/master/fastlane/metadata/android/en-US/images/phoneScreenshots/01.png'
      ),
      p(
        'https://raw.githubusercontent.com/TeamNewPipe/NewPipe/master/fastlane/metadata/android/en-US/images/phoneScreenshots/02.png'
      ),
    ],
    accentColor: '#9333EA',
    monogram: 'NP',
    assets: [
      {
        name: 'NewPipe_v0.29.3.apk',
        arch: 'universal',
        sizeBytes: 16.2 * 1024 * 1024,
        downloadUrl: 'https://github.com/TeamNewPipe/NewPipe/releases/latest',
        sha256: '4a1f9c2e8d7b6a5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c',
      },
    ],
    permissions: [
      {
        code: 'android.permission.INTERNET',
        label: 'Streaming e busca',
        risk: 'baixo',
        reason: 'Carrega streams de vídeo e feeds públicos sem login.',
      },
    ],
    changelog: [
      'Suporte aprimorado a streams AV1 e player pop-up.',
    ],
  },
  {
    id: 'vimusic',
    name: 'ViMusic',
    packageName: 'it.vfsfitvnm.vimusic',
    category: 'Música',
    tagline:
      'Player minimalista com cache automático de músicas, rádio infinito e modo offline.',
    description:
      'Interface limpa para ouvir músicas e podcasts sem anúncios, com cache automático local.',
    developer: 'vfsfitvnm',
    version: '0.5.4',
    minAndroid: '8.0+',
    license: 'GPL-3.0',
    updatedAt: '2026-10-28',
    downloadsCount: 510000,
    repoSlug: 'vfsfitvnm/ViMusic',
    sourceType: 'github',
    iconImage: APP_ICONS.vimusic,
    previewImage: HERO_MEDIA.audio,
    galleryImages: [
      HERO_MEDIA.audio,
      p(
        'https://raw.githubusercontent.com/vfsfitvnm/ViMusic/master/fastlane/metadata/android/en-US/images/phoneScreenshots/2.jpg'
      ),
    ],
    accentColor: '#6D28D9',
    monogram: 'VM',
    assets: [
      {
        name: 'ViMusic-v0.5.4-arm64-v8a.apk',
        arch: 'arm64-v8a',
        sizeBytes: 9.8 * 1024 * 1024,
        downloadUrl: 'https://github.com/vfsfitvnm/ViMusic/releases/latest',
        sha256: '7d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e',
      },
    ],
    permissions: [
      {
        code: 'android.permission.INTERNET',
        label: 'Streaming de áudio',
        risk: 'baixo',
        reason: 'Busca catálogos e letras públicas.',
      },
    ],
    changelog: ['Gerenciamento de cache local com limite configurável.'],
  },
  {
    id: 'mihon',
    name: 'Mihon',
    packageName: 'app.mihon',
    category: 'Leitura',
    tagline:
      'Leitor avançado de mangás e HQs com suporte a repositórios de extensões e leitura offline.',
    description:
      'Sucessor comunitário do Tachiyomi para leitura confortável em celulares e tablets Android.',
    developer: 'Mihon App Contributors',
    version: '0.21.3',
    minAndroid: '8.0+',
    license: 'Apache-2.0',
    updatedAt: '2026-11-04',
    downloadsCount: 675000,
    repoSlug: 'mihonapp/mihon',
    sourceType: 'github',
    featured: true,
    iconImage: APP_ICONS.mihon,
    previewImage: HERO_MEDIA.reader,
    galleryImages: [
      HERO_MEDIA.reader,
      p(
        'https://raw.githubusercontent.com/mihonapp/mihon/main/fastlane/metadata/android/en-US/images/phoneScreenshots/1.png'
      ),
      p(
        'https://raw.githubusercontent.com/mihonapp/mihon/main/fastlane/metadata/android/en-US/images/phoneScreenshots/2.png'
      ),
    ],
    accentColor: '#5B21B6',
    monogram: 'MH',
    assets: [
      {
        name: 'mihon-arm64-v8a-v0.21.3.apk',
        arch: 'arm64-v8a',
        sizeBytes: 26.5 * 1024 * 1024,
        downloadUrl: 'https://github.com/mihonapp/mihon/releases/latest',
        sha256: '3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a',
      },
    ],
    permissions: [
      {
        code: 'android.permission.REQUEST_INSTALL_PACKAGES',
        label: 'Instalar extensões APK',
        risk: 'moderado',
        reason: 'Permite instalar extensões adicionais escolhidas pelo usuário.',
      },
    ],
    changelog: ['Recorte automático de bordas e leitura CBZ/ZIP otimizada.'],
  },
  {
    id: 'cromite',
    name: 'Cromite',
    packageName: 'org.cromite.cromite',
    category: 'Privacidade',
    tagline:
      'Navegador Chromium com bloqueador de anúncios integrado e proteção contra rastreamento.',
    description:
      'Fork focado em privacidade baseado no Chromium moderno, trazendo filtros de anúncios nativos e proteção anti-fingerprinting.',
    developer: 'uazo',
    version: '153.0.8010.37',
    minAndroid: '8.0+',
    license: 'GPL-3.0',
    updatedAt: '2026-11-14',
    downloadsCount: 390000,
    repoSlug: 'uazo/cromite',
    sourceType: 'github',
    iconImage: APP_ICONS.cromite,
    iconZoom: true,
    previewImage: HERO_MEDIA.vault,
    galleryImages: [HERO_MEDIA.vault],
    accentColor: '#4C1D95',
    monogram: 'CR',
    assets: [
      {
        name: 'arm64_ChromePublic.apk',
        arch: 'arm64-v8a',
        sizeBytes: 308.8 * 1024 * 1024,
        downloadUrl: 'https://github.com/uazo/cromite/releases/latest',
        sha256: '6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b',
      },
    ],
    permissions: [
      {
        code: 'android.permission.INTERNET',
        label: 'Navegação web',
        risk: 'baixo',
        reason: 'Carrega páginas e listas de filtros adblock.',
      },
    ],
    changelog: ['Atualização do motor Chromium com patches de segurança.'],
  },
  {
    id: 'obtainium',
    name: 'Obtainium',
    packageName: 'dev.imranr.obtainium',
    category: 'Utilitários',
    tagline:
      'Atualize APKs diretamente dos repositórios oficiais do GitHub, GitLab e F-Droid.',
    description:
      'Acompanha novas versões direto na fonte dos desenvolvedores e verifica atualizações com um toque.',
    developer: 'ImranR98',
    version: '1.1.32',
    minAndroid: '8.0+',
    license: 'GPL-3.0',
    updatedAt: '2026-11-11',
    downloadsCount: 315000,
    repoSlug: 'ImranR98/Obtainium',
    sourceType: 'github',
    iconImage: APP_ICONS.obtainium,
    previewImage: HERO_MEDIA.repos,
    galleryImages: [HERO_MEDIA.repos],
    accentColor: '#7E22CE',
    monogram: 'OB',
    assets: [
      {
        name: 'app-arm64-v8a-release.apk',
        arch: 'arm64-v8a',
        sizeBytes: 22.1 * 1024 * 1024,
        downloadUrl: 'https://github.com/ImranR98/Obtainium/releases/latest',
        sha256: 'c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
      },
    ],
    permissions: [
      {
        code: 'android.permission.REQUEST_INSTALL_PACKAGES',
        label: 'Instalar pacotes APK',
        risk: 'sensível',
        reason: 'Aciona o instalador nativo do Android após o download.',
      },
    ],
    changelog: ['Detecção automática de arquitetura em releases com múltiplos APKs.'],
  },
  {
    id: 'localsend',
    name: 'LocalSend',
    packageName: 'org.localsend.localsend_app',
    category: 'Utilitários',
    tagline:
      'Envie arquivos, fotos e APKs entre Android, Windows, macOS e Linux pelo Wi-Fi local.',
    description:
      'Alternativa open-source ao AirDrop que funciona via rede local criptografada sem cabos nem nuvem.',
    developer: 'Tien Do Nam',
    version: '1.18.2',
    minAndroid: '7.0+',
    license: 'MIT',
    updatedAt: '2026-11-08',
    downloadsCount: 620000,
    repoSlug: 'localsend/localsend',
    sourceType: 'github',
    iconImage: APP_ICONS.localsend,
    previewImage: p(
      'https://raw.githubusercontent.com/localsend/localsend/main/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg'
    ),
    galleryImages: [
      p(
        'https://raw.githubusercontent.com/localsend/localsend/main/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg'
      ),
      p(
        'https://raw.githubusercontent.com/localsend/localsend/main/fastlane/metadata/android/en-US/images/phoneScreenshots/2.jpg'
      ),
    ],
    accentColor: '#6B21A8',
    monogram: 'LS',
    assets: [
      {
        name: 'LocalSend-1.18.2-android-arm64v8a.apk',
        arch: 'arm64-v8a',
        sizeBytes: 37.5 * 1024 * 1024,
        downloadUrl: 'https://github.com/localsend/localsend/releases/latest',
        sha256: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      },
    ],
    permissions: [
      {
        code: 'android.permission.ACCESS_WIFI_STATE',
        label: 'Descoberta na rede local',
        risk: 'baixo',
        reason: 'Encontra dispositivos próximos no mesmo roteador Wi-Fi.',
      },
    ],
    changelog: ['Transferência simultânea de pastas e envio direto de APKs.'],
  },
  {
    id: 'libretube',
    name: 'LibreTube',
    packageName: 'com.github.libretube',
    category: 'Vídeo',
    tagline: 'Interface fluida para assistir vídeos sem anúncios usando instâncias Piped.',
    description:
      'Cliente alternativo com SponsorBlock nativo, playlists locais e download em segundo plano.',
    developer: 'LibreTube Team',
    version: '0.26.1',
    minAndroid: '8.0+',
    license: 'GPL-3.0',
    updatedAt: '2026-10-30',
    downloadsCount: 410000,
    repoSlug: 'libre-tube/LibreTube',
    sourceType: 'github',
    iconImage: APP_ICONS.libretube,
    previewImage: HERO_MEDIA.mediaBanner,
    galleryImages: [
      HERO_MEDIA.mediaBanner,
      p(
        'https://raw.githubusercontent.com/libre-tube/LibreTube/master/fastlane/metadata/android/en-US/images/phoneScreenshots/Screenshot_1.jpg'
      ),
      p(
        'https://raw.githubusercontent.com/libre-tube/LibreTube/master/fastlane/metadata/android/en-US/images/phoneScreenshots/Screenshot_2.jpg'
      ),
    ],
    accentColor: '#581C87',
    monogram: 'LT',
    assets: [
      {
        name: 'libretube-release-universal.apk',
        arch: 'universal',
        sizeBytes: 16.5 * 1024 * 1024,
        downloadUrl: 'https://github.com/libre-tube/LibreTube/releases/latest',
        sha256: 'd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2',
      },
    ],
    permissions: [
      {
        code: 'android.permission.INTERNET',
        label: 'Conexão com instância Piped',
        risk: 'baixo',
        reason: 'Busca vídeos e comentários pela API escolhida.',
      },
    ],
    changelog: ['Troca automática de instância e modo áudio dedicado.'],
  },
  {
    id: 'breezy',
    name: 'Breezy Weather',
    packageName: 'org.breezyweather',
    category: 'Utilitários',
    tagline:
      'Previsão do tempo com radar de chuva, qualidade do ar e widgets limpos para Android.',
    description:
      'Aplicativo climático open-source com gráficos detalhados de temperatura, índice UV e provedores meteorológicos configuráveis.',
    developer: 'Breezy Weather',
    version: '5.3.4',
    minAndroid: '7.0+',
    license: 'LGPL-3.0',
    updatedAt: '2026-11-09',
    downloadsCount: 285000,
    repoSlug: 'breezy-weather/breezy-weather',
    sourceType: 'fdroid',
    iconImage: APP_ICONS.breezy,
    previewImage: p(
      'https://raw.githubusercontent.com/breezy-weather/breezy-weather/main/fastlane/metadata/android/en-US/images/phoneScreenshots/01-main-header-light.png'
    ),
    galleryImages: [
      p(
        'https://raw.githubusercontent.com/breezy-weather/breezy-weather/main/fastlane/metadata/android/en-US/images/phoneScreenshots/01-main-header-light.png'
      ),
    ],
    accentColor: '#4338CA',
    monogram: 'BW',
    assets: [
      {
        name: 'breezy-weather-v5.3.4-standard.apk',
        arch: 'universal',
        sizeBytes: 15.2 * 1024 * 1024,
        downloadUrl: 'https://github.com/breezy-weather/breezy-weather/releases/latest',
        sha256: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
      },
    ],
    permissions: [
      {
        code: 'android.permission.ACCESS_COARSE_LOCATION',
        label: 'Localização aproximada',
        risk: 'moderado',
        reason: 'Opcional para detectar sua cidade automaticamente.',
      },
    ],
    changelog: ['Novos widgets adaptativos e previsão via Open-Meteo.'],
  },
  {
    id: 'aegis',
    name: 'Aegis Authenticator',
    packageName: 'com.beemdevelopment.aegis',
    category: 'Privacidade',
    tagline:
      'Gerenciador 2FA criptografado com biometria, backups locais e importação de tokens.',
    description:
      'Cofre seguro para códigos de autenticação em duas etapas (TOTP/HOTP), totalmente offline e protegido por AES-256.',
    developer: 'beemdevelopment',
    version: '3.4.3',
    minAndroid: '7.0+',
    license: 'GPL-3.0',
    updatedAt: '2026-10-22',
    downloadsCount: 540000,
    repoSlug: 'beemdevelopment/Aegis',
    sourceType: 'fdroid',
    iconImage: APP_ICONS.aegis,
    previewImage: p(
      'https://raw.githubusercontent.com/beemdevelopment/Aegis/master/metadata/en-US/images/phoneScreenshots/screenshot1.png?raw=true'
    ),
    galleryImages: [
      p(
        'https://raw.githubusercontent.com/beemdevelopment/Aegis/master/metadata/en-US/images/phoneScreenshots/screenshot1.png?raw=true'
      ),
      p(
        'https://raw.githubusercontent.com/beemdevelopment/Aegis/master/metadata/en-US/images/phoneScreenshots/screenshot2.png?raw=true'
      ),
    ],
    accentColor: '#3B0764',
    monogram: 'AE',
    assets: [
      {
        name: 'aegis-3.4.3-release.apk',
        arch: 'universal',
        sizeBytes: 6.6 * 1024 * 1024,
        downloadUrl: 'https://github.com/beemdevelopment/Aegis/releases/latest',
        sha256: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
      },
    ],
    permissions: [
      {
        code: 'android.permission.USE_BIOMETRIC',
        label: 'Desbloqueio biométrico',
        risk: 'baixo',
        reason: 'Protege o acesso ao cofre criptografado.',
      },
    ],
    changelog: ['Backup automático criptografado e pesquisa instantânea por emissor.'],
  },
];
