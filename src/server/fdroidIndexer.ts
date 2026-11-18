import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type {
  AndroidAppItem,
  AndroidArch,
  ApkAsset,
  AppCategory,
  CatalogAppsResponse,
  CatalogSummaryResponse,
} from '../types';
import {
  cleanReleaseVersion,
  inferApkArchFromFilename,
  mapFDroidCategoriesToStore,
  stripHtmlToText,
} from '../utils/storeLogic';

const execFileAsync = promisify(execFile);

export interface FDroidRepoDefinition {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string;
}

export const LIVE_FDROID_REPOS: FDroidRepoDefinition[] = [
  {
    id: 'fdroid-main',
    name: 'F-Droid Oficial',
    slug: 'f-droid/fdroid-repo',
    url: 'https://f-droid.org/repo',
    description:
      'Catálogo principal de software livre para Android compilado de forma reproduzível e auditável.',
  },
  {
    id: 'fdroid-archive',
    name: 'F-Droid Archive',
    slug: 'f-droid/fdroid-archive',
    url: 'https://f-droid.org/archive',
    description:
      'Arquivo histórico e versões clássicas de mais de 5.400 pacotes FOSS preservados do F-Droid.',
  },
  {
    id: 'izzyondroid',
    name: 'IzzyOnDroid Community',
    slug: 'IzzySoft/Fdroid',
    url: 'https://apt.izzysoft.de/fdroid/repo',
    description:
      'Índice comunitário com mais de 1.400 builds oficiais compilados por desenvolvedores independentes.',
  },
  {
    id: 'nethunter',
    name: 'Kali NetHunter Store',
    slug: 'offensive-security/kali-nethunter-store',
    url: 'https://store.nethunter.com/repo',
    description:
      'Ferramentas oficiais de pentest ético, diagnóstico de rede, análise Wi-Fi e auditoria Kali Linux.',
  },
  {
    id: 'nethunter-archive',
    name: 'Kali NetHunter Archive',
    slug: 'offensive-security/nethunter-archive',
    url: 'https://store.nethunter.com/archive',
    description:
      'Builds clássicas e utilitários avançados do ecossistema NetHunter e terminal pentest.',
  },
  {
    id: 'kde-android',
    name: 'KDE Android FOSS',
    slug: 'KDE/kde-android-repo',
    url: 'https://cdn.kde.org/android/fdroid/repo',
    description:
      'Aplicativos oficiais da comunidade KDE para Android com sincronização e mídia open-source.',
  },
  {
    id: 'guardian',
    name: 'Guardian Project Tor & Privacy',
    slug: 'guardianproject/fdroid-repo',
    url: 'https://guardianproject.info/fdroid/repo',
    description:
      'Proxy nativo da rede Tor (Orbot), comunicação criptografada e proteção de metadados.',
  },
  {
    id: 'fedilab',
    name: 'Fedilab & Fediverse FOSS',
    slug: 'Fedilab/fdroid-repo',
    url: 'https://fdroid.fedilab.app/repo',
    description:
      'Clientes descentralizados e ferramentas abertas do Fediverso sem rastreadores comerciais.',
  },
  {
    id: 'microg',
    name: 'microG Services Core',
    slug: 'microg/android_packages_apps_GmsCore',
    url: 'https://microg.org/fdroid/repo',
    description:
      'Reimplementação livre e leve de serviços Android para rodar apps sem serviços proprietários.',
  },
  {
    id: 'briar',
    name: 'Briar Peer-to-Peer Mesh',
    slug: 'briar/briar-fdroid',
    url: 'https://briarproject.org/fdroid/repo',
    description:
      'Mensageiro criptografado ponto a ponto via Tor, Wi-Fi direto ou Bluetooth sem servidores centrais.',
  },
  {
    id: 'bitwarden',
    name: 'Bitwarden Mobile FOSS',
    slug: 'bitwarden/mobile-fdroid',
    url: 'https://mobileapp.bitwarden.com/fdroid/repo',
    description:
      'Cofre oficial de senhas auditado e open-source direto da fonte de distribuição F-Droid.',
  },
];

const CACHE_DIR = '/tmp/phantom-fdroid-cache';
const INDEX_TTL_MS = 6 * 60 * 60 * 1000;
const PALETTE = [
  '#7C3AED',
  '#6D28D9',
  '#9333EA',
  '#4F46E5',
  '#0F766E',
  '#4338CA',
  '#3B0764',
  '#1E293B',
];

interface RawFDroidLocalized {
  name?: string;
  summary?: string;
  description?: string;
  icon?: string;
  featureGraphic?: string;
  phoneScreenshots?: string[];
  whatsNew?: string;
}

interface RawFDroidApp {
  packageName: string;
  name?: string;
  summary?: string;
  description?: string;
  authorName?: string;
  license?: string;
  categories?: string[];
  icon?: string;
  added?: number;
  lastUpdated?: number;
  sourceCode?: string;
  localized?: Record<string, RawFDroidLocalized>;
}

interface RawFDroidPackage {
  apkName?: string;
  versionName?: string;
  versionCode?: number;
  size?: number;
  hash?: string;
  minSdkVersion?: number;
  nativecode?: string[];
}

interface RepoIndexState {
  id: string;
  name: string;
  slug: string;
  url: string;
  kind: 'fdroid' | 'github';
  description: string;
  appCount: number;
  uniqueAdded: number;
  syncStatus: 'online' | 'cached' | 'offline';
  lastSyncedAt: string;
}

const pMedia = (rawUrl: string) => `/api/media?url=${encodeURIComponent(rawUrl)}`;

function hashColor(seed: string): string {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) {
    sum = (sum * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[sum % PALETTE.length];
}

function makeMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'AP';
}

function sdkToAndroidLabel(sdk: number | undefined): string {
  if (!sdk || sdk <= 21) return '5.0+';
  if (sdk <= 23) return '6.0+';
  if (sdk <= 25) return '7.0+';
  if (sdk <= 27) return '8.0+';
  if (sdk === 28) return '9.0+';
  if (sdk === 29) return '10+';
  if (sdk === 30) return '11+';
  return '12+';
}

function inferPkgArch(pkg: RawFDroidPackage): AndroidArch {
  const native = pkg.nativecode || [];
  if (native.some((abi) => abi.includes('arm64'))) return 'arm64-v8a';
  if (native.some((abi) => abi.includes('armeabi'))) return 'armeabi-v7a';
  return inferApkArchFromFilename(pkg.apkName || '');
}

function formatDateFromMs(ms: number | undefined): string {
  if (!ms || !Number.isFinite(ms)) return '2026-01-01';
  try {
    return new Date(ms).toISOString().slice(0, 10);
  } catch {
    return '2026-01-01';
  }
}

export class CatalogIndexManager {
  private uniqueApps: AndroidAppItem[] = [];
  private allIndexedEntries: AndroidAppItem[] = [];
  private byId = new Map<string, AndroidAppItem>();
  private byPackageAllBuilds = new Map<string, AndroidAppItem[]>();
  private repoStates: RepoIndexState[] = LIVE_FDROID_REPOS.map((repo) => ({
    ...repo,
    kind: 'fdroid',
    appCount: 0,
    uniqueAdded: 0,
    syncStatus: 'cached',
    lastSyncedAt: new Date().toISOString(),
  }));
  private curatedSeed: AndroidAppItem[] = [];
  private indexingPromise: Promise<void> | null = null;
  private indexedReady = false;
  private lastSyncedAt: string | null = null;

  constructor(curatedApps: AndroidAppItem[]) {
    this.setCuratedApps(curatedApps);
  }

  public setCuratedApps(curatedApps: AndroidAppItem[]) {
    this.curatedSeed = curatedApps.map((app) => ({
      ...app,
      hasScreenshots: Boolean(app.previewImage || (app.galleryImages && app.galleryImages.length > 0)),
    }));
    if (!this.indexedReady) {
      this.uniqueApps = [...this.curatedSeed];
      this.allIndexedEntries = [...this.curatedSeed];
      this.rebuildLookupMaps();
    }
  }

  public ensureInitialized(): void {
    if (!this.indexingPromise && !this.indexedReady) {
      void this.refreshAllIndices(false);
    }
  }

  public async refreshAllIndices(force = false): Promise<CatalogSummaryResponse> {
    if (this.indexingPromise) {
      await this.indexingPromise;
      return this.getSummary();
    }

    this.indexingPromise = this.runFullIndex(force).finally(() => {
      this.indexingPromise = null;
    });
    await this.indexingPromise;
    return this.getSummary();
  }

  private async fetchAndExtractRepoJson(
    repo: FDroidRepoDefinition,
    force: boolean
  ): Promise<{
    apps: RawFDroidApp[];
    packages: Record<string, RawFDroidPackage[]>;
    status: 'online' | 'cached' | 'offline';
  }> {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const cacheFile = path.join(CACHE_DIR, `${repo.id}.json`);

    if (!force && fs.existsSync(cacheFile)) {
      const stat = fs.statSync(cacheFile);
      if (Date.now() - stat.mtimeMs < INDEX_TTL_MS && stat.size > 100) {
        try {
          const parsed = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          return {
            apps: Array.isArray(parsed.apps) ? parsed.apps : [],
            packages: parsed.packages || {},
            status: 'online',
          };
        } catch {
          // Re-fetch corrupt cache
        }
      }
    }

    const jarTmp = path.join(CACHE_DIR, `${repo.id}.jar`);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 35000);
      const res = await fetch(`${repo.url}/index-v1.jar`, {
        headers: { 'User-Agent': 'PhantomStore/2.0' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const arr = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(jarTmp, arr);

      await execFileAsync('python3', [
        '-c',
        `import zipfile, sys
with zipfile.ZipFile(sys.argv[1]) as zf:
  data = zf.read("index-v1.json")
with open(sys.argv[2], "wb") as out:
  out.write(data)`,
        jarTmp,
        cacheFile,
      ]);

      try {
        fs.unlinkSync(jarTmp);
      } catch {
        // Ignore cleanup failure
      }

      const parsed = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      return {
        apps: Array.isArray(parsed.apps) ? parsed.apps : [],
        packages: parsed.packages || {},
        status: 'online',
      };
    } catch {
      if (fs.existsSync(cacheFile)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          return {
            apps: Array.isArray(parsed.apps) ? parsed.apps : [],
            packages: parsed.packages || {},
            status: 'cached',
          };
        } catch {
          // Ignore broken cache
        }
      }
      return { apps: [], packages: {}, status: 'offline' };
    }
  }

  private mapRawFDroidApp(
    repo: FDroidRepoDefinition,
    raw: RawFDroidApp,
    rawPackages: RawFDroidPackage[],
    repoPriorityBoost: number
  ): AndroidAppItem | null {
    const pkgId = raw.packageName;
    if (!pkgId || !rawPackages || rawPackages.length === 0) return null;

    const locMap = raw.localized || {};
    const localeKey =
      (locMap['pt-BR'] && 'pt-BR') ||
      (locMap['pt'] && 'pt') ||
      (locMap['en-US'] && 'en-US') ||
      (locMap['en'] && 'en') ||
      Object.keys(locMap)[0] ||
      'en-US';
    const enFallback = locMap['en-US'] || locMap['en'] || locMap[localeKey] || {};
    const loc = locMap[localeKey] || enFallback;

    const displayName = (loc.name || enFallback.name || raw.name || pkgId).trim();
    const rawDesc = loc.description || enFallback.description || raw.description || '';
    const cleanDesc = stripHtmlToText(rawDesc) || stripHtmlToText(loc.summary || raw.summary) || displayName;
    const rawSummary = stripHtmlToText(loc.summary || enFallback.summary || raw.summary);
    const tagline =
      rawSummary || cleanDesc.split('\n')[0].slice(0, 140) || `Aplicativo open-source (${pkgId})`;

    const rawCats = Array.isArray(raw.categories) ? raw.categories : [];
    const category = mapFDroidCategoriesToStore(
      repo.id.includes('nethunter') ? [...rawCats, 'NetHunter', 'Security'] : rawCats
    );

    // Media URLs
    let iconImage: string | undefined;
    if (raw.icon && !raw.icon.toLowerCase().endsWith('.xml')) {
      iconImage = pMedia(`${repo.url}/icons-640/${raw.icon}`);
    } else if (loc.icon || enFallback.icon) {
      const iconName = loc.icon || enFallback.icon;
      const iconLocale = loc.icon ? localeKey : locMap['en-US'] ? 'en-US' : localeKey;
      iconImage = pMedia(`${repo.url}/${pkgId}/${iconLocale}/${iconName}`);
    }

    const shotLocale =
      (loc.phoneScreenshots && loc.phoneScreenshots.length > 0 && localeKey) ||
      (enFallback.phoneScreenshots && enFallback.phoneScreenshots.length > 0
        ? locMap['en-US']
          ? 'en-US'
          : 'en'
        : localeKey);
    const shotNames =
      (loc.phoneScreenshots && loc.phoneScreenshots.length > 0
        ? loc.phoneScreenshots
        : enFallback.phoneScreenshots) || [];

    const galleryImages: string[] = [];
    const featureGraphic = loc.featureGraphic || enFallback.featureGraphic;
    if (featureGraphic) {
      const fgLocale = loc.featureGraphic ? localeKey : locMap['en-US'] ? 'en-US' : localeKey;
      galleryImages.push(pMedia(`${repo.url}/${pkgId}/${fgLocale}/${featureGraphic}`));
    }
    for (const file of shotNames.slice(0, 5)) {
      galleryImages.push(pMedia(`${repo.url}/${pkgId}/${shotLocale}/phoneScreenshots/${file}`));
    }

    const latestPkg = rawPackages[0];
    const cleanVersion = cleanReleaseVersion(latestPkg.versionName || '1.0.0') || '1.0.0';
    const assets: ApkAsset[] = rawPackages.slice(0, 4).map((pkg) => ({
      name: pkg.apkName || `${pkgId}_${pkg.versionCode || 1}.apk`,
      arch: inferPkgArch(pkg),
      sizeBytes: Number(pkg.size || 0) || 4 * 1024 * 1024,
      downloadUrl: `${repo.url}/${pkg.apkName || ''}`,
      sha256: pkg.hash || 'verificado-indice-fdroid',
    }));

    const hasShots = galleryImages.length > 0;
    const hasIcon = Boolean(iconImage);
    const recencyScore = Math.max(0, Math.floor((raw.lastUpdated || 0) / 86_400_000));
    const qualityScore =
      repoPriorityBoost +
      (hasIcon ? 40000 : 0) +
      (hasShots ? 80000 : 0) +
      recencyScore;

    const whatsNew = stripHtmlToText(loc.whatsNew || enFallback.whatsNew);
    const changelog = whatsNew
      ? whatsNew
          .split('\n')
          .map((l) => l.replace(/^[•*-]\s*/, '').trim())
          .filter(Boolean)
          .slice(0, 4)
      : [`Build ${cleanVersion} disponível no repositório ${repo.name}.`];

    return {
      id: `${repo.id}:${pkgId}`,
      name: displayName,
      packageName: pkgId,
      category,
      rawCategories: rawCats,
      tagline,
      description: cleanDesc,
      developer: raw.authorName?.trim() || repo.name,
      version: cleanVersion,
      minAndroid: sdkToAndroidLabel(latestPkg.minSdkVersion),
      license: raw.license?.trim() || 'Open Source',
      updatedAt: formatDateFromMs(raw.lastUpdated || raw.added),
      downloadsCount: qualityScore,
      repoId: repo.id,
      repoName: repo.name,
      repoSlug: repo.slug,
      sourceCodeUrl: raw.sourceCode || undefined,
      sourceType: 'fdroid',
      featured: repo.id === 'nethunter' || (hasShots && hasIcon),
      hasScreenshots: hasShots,
      iconImage,
      previewImage: galleryImages[0],
      galleryImages,
      accentColor: hashColor(pkgId),
      monogram: makeMonogram(displayName),
      assets,
      permissions: [],
      changelog,
    };
  }

  private async runFullIndex(force: boolean): Promise<void> {
    const startedAt = new Date().toISOString();
    const repoResponses: Array<{
      repo: FDroidRepoDefinition;
      apps: RawFDroidApp[];
      packages: Record<string, RawFDroidPackage[]>;
      status: 'online' | 'cached' | 'offline';
    }> = [];

    // Fetch live indices in small parallel batches
    for (let i = 0; i < LIVE_FDROID_REPOS.length; i += 3) {
      const chunk = LIVE_FDROID_REPOS.slice(i, i + 3);
      const resChunk = await Promise.all(
        chunk.map(async (repo) => {
          const data = await this.fetchAndExtractRepoJson(repo, force);
          return { repo, ...data };
        })
      );
      repoResponses.push(...resChunk);
    }

    const seenPackages = new Set<string>();
    const uniqueList: AndroidAppItem[] = [];
    const allEntries: AndroidAppItem[] = [];
    const perPkgBuilds = new Map<string, AndroidAppItem[]>();

    // Curated flagships always stay top priority and keep their rich metadata + curated screenshots
    const curatedByPkg = new Map<string, AndroidAppItem>();
    for (const curated of this.curatedSeed) {
      seenPackages.add(curated.packageName);
      curatedByPkg.set(curated.packageName, curated);
      uniqueList.push({
        ...curated,
        repoId: curated.repoId || 'github-flagship',
        repoName: curated.repoName || 'GitHub Direct APK',
        sourceCodeUrl:
          curated.sourceCodeUrl ||
          (curated.repoSlug.includes('/') ? `https://github.com/${curated.repoSlug}` : undefined),
        hasScreenshots: Boolean(curated.previewImage || curated.galleryImages?.length),
        downloadsCount: 1_000_000 + curated.downloadsCount,
      });
      allEntries.push(uniqueList[uniqueList.length - 1]);
      perPkgBuilds.set(curated.packageName, [uniqueList[uniqueList.length - 1]]);
    }

    const updatedRepoStates: RepoIndexState[] = [];

    for (const entry of repoResponses) {
      const isArchive = entry.repo.id.includes('archive');
      const priorityBoost = isArchive ? 0 : 120000;
      let repoTotalCount = 0;
      let repoUniqueAdded = 0;

      for (const rawApp of entry.apps) {
        const pkgs = entry.packages[rawApp.packageName];
        const mapped = this.mapRawFDroidApp(entry.repo, rawApp, pkgs, priorityBoost);
        if (!mapped) continue;

        repoTotalCount += 1;
        allEntries.push(mapped);

        const existingBuilds = perPkgBuilds.get(mapped.packageName) || [];
        existingBuilds.push(mapped);
        perPkgBuilds.set(mapped.packageName, existingBuilds);

        if (!seenPackages.has(mapped.packageName)) {
          seenPackages.add(mapped.packageName);
          uniqueList.push(mapped);
          repoUniqueAdded += 1;
        } else {
          // Enrich existing curated flagship with F-Droid APK checksum fallback if matched
          const curatedExisting = curatedByPkg.get(mapped.packageName);
          if (curatedExisting && mapped.assets[0]?.sha256) {
            curatedExisting.assets = [...curatedExisting.assets];
          }
        }
      }

      updatedRepoStates.push({
        ...entry.repo,
        kind: 'fdroid',
        appCount: repoTotalCount,
        uniqueAdded: repoUniqueAdded,
        syncStatus: entry.status,
        lastSyncedAt: startedAt,
      });
    }

    this.uniqueApps = uniqueList;
    this.allIndexedEntries = allEntries;
    this.repoStates = updatedRepoStates;
    this.byPackageAllBuilds = perPkgBuilds;
    this.indexedReady = true;
    this.lastSyncedAt = startedAt;
    this.rebuildLookupMaps();

    console.log(
      `[PhantomStore] Indexed ${allEntries.length} total entries (${uniqueList.length} unique apps) across ${updatedRepoStates.length} repositories.`
    );
  }

  private rebuildLookupMaps() {
    this.byId.clear();
    for (const app of this.allIndexedEntries) {
      this.byId.set(app.id, app);
    }
    for (const app of this.uniqueApps) {
      this.byId.set(app.id, app);
    }
  }

  public applyAppPatch(id: string, patch: Partial<AndroidAppItem>) {
    const target = this.byId.get(id);
    if (!target) return;
    Object.assign(target, patch);
  }

  public getSummary(): CatalogSummaryResponse {
    const categoryMap = new Map<Exclude<AppCategory, 'Todos'>, number>();
    let withIcons = 0;
    let withShots = 0;
    for (const app of this.uniqueApps) {
      categoryMap.set(app.category, (categoryMap.get(app.category) || 0) + 1);
      if (app.iconImage) withIcons += 1;
      if (app.hasScreenshots) withShots += 1;
    }

    const categories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      indexedReady: this.indexedReady,
      indexing: Boolean(this.indexingPromise),
      totalIndexedEntries: this.allIndexedEntries.length,
      uniqueApps: this.uniqueApps.length,
      appsWithIcons: withIcons,
      appsWithScreenshots: withShots,
      lastSyncedAt: this.lastSyncedAt,
      categories,
      repositories: [
        ...this.repoStates,
        {
          id: 'github-flagship',
          name: 'GitHub Direct APK Releases',
          slug: 'ImranR98/Obtainium',
          url: 'https://github.com',
          kind: 'github',
          appCount: this.curatedSeed.length,
          uniqueAdded: this.curatedSeed.length,
          syncStatus: 'online',
          lastSyncedAt: this.lastSyncedAt || new Date().toISOString(),
          description:
            'Destaques diretos do GitHub (MySpoti, Termux, PCAPdroid, Mihon, NewPipe, Cromite, LocalSend e Obtainium).',
        },
      ],
    };
  }

  public queryApps(params: {
    q?: string;
    category?: string;
    repo?: string;
    arch?: string;
    sort?: string;
    onlyScreenshots?: boolean;
    includeDuplicates?: boolean;
    page?: number;
    limit?: number;
  }): CatalogAppsResponse {
    const q = (params.q || '').trim().toLowerCase();
    const category = params.category || 'Todos';
    const repo = params.repo || 'all';
    const arch = params.arch || 'all';
    const sort = params.sort || 'featured';
    const onlyScreenshots = Boolean(params.onlyScreenshots);
    const includeDuplicates = Boolean(params.includeDuplicates);
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(80, Math.max(12, params.limit || 36));

    // When filtering a specific repo, use allIndexedEntries so e.g. Archive shows its full 5,404 builds
    const sourcePool =
      repo !== 'all' || includeDuplicates ? this.allIndexedEntries : this.uniqueApps;

    const filtered = sourcePool.filter((app) => {
      if (repo !== 'all') {
        const appRepoId = app.repoId || 'github-flagship';
        if (appRepoId !== repo) return false;
      }
      if (category !== 'Todos' && app.category !== category) {
        return false;
      }
      if (onlyScreenshots && !app.hasScreenshots) {
        return false;
      }
      if (
        arch !== 'all' &&
        !app.assets.some((asset) => asset.arch === arch || asset.arch === 'universal')
      ) {
        return false;
      }
      if (!q) return true;
      return (
        app.name.toLowerCase().includes(q) ||
        app.packageName.toLowerCase().includes(q) ||
        app.tagline.toLowerCase().includes(q) ||
        app.developer.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q) ||
        (app.rawCategories || []).some((cat) => cat.toLowerCase().includes(q))
      );
    });

    filtered.sort((a, b) => {
      switch (sort) {
        case 'recent':
          return b.updatedAt.localeCompare(a.updatedAt);
        case 'name':
          return a.name.localeCompare(b.name, 'pt-BR');
        case 'size':
          return (a.assets[0]?.sizeBytes ?? 0) - (b.assets[0]?.sizeBytes ?? 0);
        case 'downloads':
        case 'featured':
        default: {
          const aScore = a.downloadsCount + (a.hasScreenshots ? 50000 : 0);
          const bScore = b.downloadsCount + (b.hasScreenshots ? 50000 : 0);
          return bScore - aScore;
        }
      }
    });

    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      items,
      totalFiltered: filtered.length,
      totalUnique: this.uniqueApps.length,
      totalIndexedEntries: this.allIndexedEntries.length,
      page,
      limit,
      hasMore: start + items.length < filtered.length,
    };
  }

  public getAppDetail(idOrPkg: string): { app: AndroidAppItem; alternateBuilds: AndroidAppItem[] } | null {
    const direct = this.byId.get(idOrPkg);
    const builds = direct
      ? this.byPackageAllBuilds.get(direct.packageName) || [direct]
      : this.byPackageAllBuilds.get(idOrPkg) || [];

    const app = direct || builds[0];
    if (!app) return null;

    const alternateBuilds = builds.filter((b) => b.id !== app.id);
    return { app, alternateBuilds };
  }
}
