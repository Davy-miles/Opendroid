# Phantom Store — App Nativo Android (Kotlin + Jetpack Compose)

**Phantom Store** é uma loja alternativa de aplicativos Android fora da Play Store construída com estética **Apple Liquid Glass** em **Obsidiana e Púrpura**, implementada como **projeto Android nativo completo em Kotlin + Jetpack Compose (`android/`)** com workflow automático de compilação de `.apk` no GitHub Actions (`.github/workflows/android-apk.yml`) e painel web complementar.

---

## Recursos Nativos em Kotlin (`android/`)

- **UI Apple Liquid Glass Nativa (Jetpack Compose + Material 3)**:
  - Tema Obsidian (`#06050B`) com bordas especulares púrpuras, dock flutuante (`FloatingLiquidDock`) para **Hoje**, **Apps**, **Repos**, **Biblioteca** e **Buscar**, e folha de detalhes modal (`AppDetailBottomSheet`).
- **Instalador Nativo com `PackageInstaller.Session` & SHA-256**:
  - Streaming de download via **OkHttp** com barra de progresso em tempo real (`0%–100%`), cálculo e validação nativa de **SHA-256** via `MessageDigest`, verificação de permissão `REQUEST_INSTALL_PACKAGES` e envio direto ao `PackageInstaller` do Android.
- **Detecção de ABI & `PackageManager` em Tempo Real**:
  - Detecta a arquitetura da CPU do aparelho (`Build.SUPPORTED_ABIS` -> `arm64-v8a` / `armeabi-v7a`) para selecionar o APK ideal automaticamente.
  - Escaneia aplicativos instalados no celular via `PackageManager` (`ON_RESUME`), exibe versões instaladas vs. disponíveis na **Biblioteca** e abre aplicativos diretamente com `getLaunchIntentForPackage`.
- **Sincronização Direta com GitHub, Atom & F-Droid (`UpstreamSyncEngine.kt`)**:
  - Consulta releases oficiais no GitHub (`/releases/latest` com fallback para `releases.atom`), índice oficial F-Droid e descoberta de ícones/capturas de tela via **Coil**, sem depender de servidor externo.

---

## Estrutura do Projeto Android Kotlin

```text
phantom-store/
├── android/
│   ├── settings.gradle.kts
│   ├── build.gradle.kts
│   ├── gradle.properties
│   ├── gradle/
│   │   ├── libs.versions.toml
│   │   └── wrapper/gradle-wrapper.properties
│   └── app/
│       ├── build.gradle.kts
│       ├── proguard-rules.pro
│       └── src/
│           ├── main/
│           │   ├── AndroidManifest.xml
│           │   ├── res/drawable-nodpi/         # Artes locais offline (ícones e banners)
│           │   └── java/com/phantom/store/
│           │       ├── MainActivity.kt
│           │       ├── model/StoreModels.kt
│           │       ├── logic/StoreLogic.kt
│           │       ├── data/CuratedCatalog.kt
│           │       ├── data/StorePreferences.kt
│           │       ├── sync/UpstreamSyncEngine.kt
│           │       ├── installer/
│           │       │   ├── DevicePackageHelper.kt
│           │       │   ├── ApkSessionInstaller.kt
│           │       │   └── InstallResultReceiver.kt
│           │       ├── viewmodel/StoreViewModel.kt
│           │       └── ui/
│           │           ├── theme/PhantomTheme.kt
│           │           ├── components/
│           │           │   ├── LiquidGlassComponents.kt
│           │           │   └── AppDetailBottomSheet.kt
│           │           └── screens/
│           │               ├── TodayAndAppsScreens.kt
│           │               └── ReposLibrarySearchScreens.kt
│           └── test/java/com/phantom/store/
│               └── StoreLogicTest.kt           # Testes unitários JUnit em Kotlin
├── .github/workflows/android-apk.yml           # Build automático do APK via GitHub Actions
└── src/ & server.ts                            # Painel web preview + exportação .zip do projeto Kotlin
```

---

## Como Compilar o APK Nativo

### Opção 1 — Android Studio / Linha de Comando Local
1. Abra a pasta `android/` no **Android Studio** (ou baixe `phantom-store-android-kotlin.zip` em **Repos -> Baixar Projeto Kotlin (.zip)**).
2. Execute os testes unitários Kotlin e gere o APK:
```bash
cd android
gradle testDebugUnitTest
gradle assembleDebug
```
O APK compilado será gerado em `android/app/build/outputs/apk/debug/app-debug.apk`.

### Opção 2 — Build Automático no GitHub Actions
Ao enviar este repositório para o GitHub, o workflow `.github/workflows/android-apk.yml` compila os testes JUnit e o `.apk` automaticamente e disponibiliza o arquivo em **Actions -> PhantomStore-debug-apk**.
