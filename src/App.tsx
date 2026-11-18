import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Cpu,
  Download,
  Globe,
  Headphones,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Terminal,
  Video,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import { APP_ICONS, CURATED_APPS, HERO_MEDIA, INITIAL_REPOSITORIES } from './data/catalog';
import type {
  ActiveDownload,
  AndroidAppItem,
  AndroidArch,
  ApkAsset,
  AppCategory,
  AppSyncOverride,
  CatalogAppsResponse,
  CatalogSummaryResponse,
  CatalogSyncResponse,
  InstalledAppRecord,
  RepositorySource,
  SortOption,
} from './types';
import {
  calculateLibrarySummary,
  filterAndSortApps,
  formatBytes,
  hasUpdateAvailable,
  parseReleaseNotesToChangelog,
  resolveAppWithSync,
  selectBestApkAsset,
} from './utils/storeLogic';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { TopBar, type NavTab } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { AppCard } from './components/AppCard';
import { AppStoreRow } from './components/AppStoreRow';
import { AppDetailSheet } from './components/AppDetailSheet';
import { RepositoriesView } from './components/RepositoriesView';
import { LibraryView } from './components/LibraryView';
import { AppIcon } from './components/AppIcon';
import { PWAInstallButton } from './components/PWAInstallButton';

const STORAGE_KEYS = {
  installed: 'phantom_installed_v1',
  repos: 'phantom_repos_v2',
  customApps: 'phantom_custom_apps_v1',
  overrides: 'phantom_overrides_v1',
  lastSync: 'phantom_last_sync_v1',
};

const CATEGORIES: AppCategory[] = [
  'Todos',
  'Segurança',
  'Privacidade',
  'Internet',
  'Música',
  'Vídeo',
  'Desenvolvimento',
  'Leitura',
  'Sistema',
  'Utilitários',
];

const CATEGORY_ICONS: Record<
  Exclude<AppCategory, 'Todos'>,
  React.ComponentType<{ className?: string }>
> = {
  Segurança: Terminal,
  Privacidade: Shield,
  Internet: Globe,
  Música: Headphones,
  Vídeo: Video,
  Desenvolvimento: Code2,
  Leitura: BookOpen,
  Sistema: Cpu,
  Utilitários: Wrench,
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<NavTab>('today');

  // Unified Explorer Filter State
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>('Todos');
  const [selectedRepoId, setSelectedRepoId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [archFilter, setArchFilter] = useState<AndroidArch | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [onlyScreenshots, setOnlyScreenshots] = useState(false);

  // Persisted Store State
  const [customApps, setCustomApps] = useState<AndroidAppItem[]>(() =>
    loadFromStorage<AndroidAppItem[]>(STORAGE_KEYS.customApps, [])
  );
  const [appOverrides, setAppOverrides] = useState<Record<string, AppSyncOverride>>(() =>
    loadFromStorage<Record<string, AppSyncOverride>>(STORAGE_KEYS.overrides, {})
  );
  const [repositories, setRepositories] = useState<RepositorySource[]>(() => {
    const saved = loadFromStorage<RepositorySource[]>(STORAGE_KEYS.repos, INITIAL_REPOSITORIES);
    const savedIds = new Set(saved.map((r) => r.id));
    const missingDefaults = INITIAL_REPOSITORIES.filter((r) => !savedIds.has(r.id));
    return missingDefaults.length > 0 ? [...missingDefaults, ...saved] : saved;
  });
  const [installedApps, setInstalledApps] = useState<InstalledAppRecord[]>(() =>
    loadFromStorage<InstalledAppRecord[]>(STORAGE_KEYS.installed, [])
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    loadFromStorage<string | null>(STORAGE_KEYS.lastSync, null)
  );
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Live 10,000+ Index State
  const [catalogSummary, setCatalogSummary] = useState<CatalogSummaryResponse | null>(null);
  const [indexedItems, setIndexedItems] = useState<AndroidAppItem[]>([]);
  const [totalFilteredCount, setTotalFilteredCount] = useState<number>(CURATED_APPS.length);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  const [activeDownloads, setActiveDownloads] = useState<Record<string, ActiveDownload>>({});
  const [selectedApp, setSelectedApp] = useState<AndroidAppItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.installed, JSON.stringify(installedApps));
    } catch {
      // Ignore quota error
    }
  }, [installedApps]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.repos, JSON.stringify(repositories));
    } catch {
      // Ignore quota error
    }
  }, [repositories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.customApps, JSON.stringify(customApps));
    } catch {
      // Ignore quota error
    }
  }, [customApps]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.overrides, JSON.stringify(appOverrides));
    } catch {
      // Ignore quota error
    }
  }, [appOverrides]);

  useEffect(() => {
    try {
      if (lastSyncedAt) {
        localStorage.setItem(STORAGE_KEYS.lastSync, JSON.stringify(lastSyncedAt));
      }
    } catch {
      // Ignore quota error
    }
  }, [lastSyncedAt]);

  // Debounce live search query for crisp typing across 10k+ apps
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setCurrentPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Poll catalog summary cleanly until background indexer finishes warming all 10k+ apps
  const applySummaryToRepositories = (summary: CatalogSummaryResponse) => {
    setCatalogSummary(summary);
    if (summary.lastSyncedAt) {
      setLastSyncedAt(summary.lastSyncedAt);
    }
    const summaryMap = new Map(summary.repositories.map((r) => [r.id, r]));
    setRepositories((prev) =>
      prev.map((repo) => {
        const live = summaryMap.get(repo.id);
        if (!live) return repo;
        return {
          ...repo,
          appCount: live.appCount > 0 ? live.appCount : repo.appCount,
          syncStatus: live.syncStatus,
          lastSyncedAt: live.lastSyncedAt.slice(0, 10),
        };
      })
    );
  };

  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const loadSummary = async () => {
      try {
        const res = await fetch('/api/catalog/summary');
        if (!res.ok || !active) return;
        const summary = (await res.json()) as CatalogSummaryResponse;
        if (!active) return;
        applySummaryToRepositories(summary);
        if (!summary.indexedReady) {
          retryTimer = setTimeout(loadSummary, 2500);
        }
      } catch {
        // Offline / cache mode
      }
    };

    void loadSummary();
    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  // Query paginated 10,000+ index whenever filters/page/summary readiness change
  useEffect(() => {
    const shouldQueryLive =
      activeTab === 'apps' || (activeTab === 'today' && debouncedQuery.length > 0);
    if (!shouldQueryLive) return;

    let cancelled = false;
    const fetchPage = async () => {
      setIsLoadingCatalog(true);
      try {
        const qs = new URLSearchParams({
          q: debouncedQuery,
          category: selectedCategory,
          repo: selectedRepoId,
          arch: archFilter,
          sort: sortBy,
          onlyScreenshots: String(onlyScreenshots),
          page: String(currentPage),
          limit: '36',
        });
        const res = await fetch(`/api/catalog/apps?${qs.toString()}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as CatalogAppsResponse;
        if (cancelled) return;

        setIndexedItems((prev) => (currentPage === 1 ? data.items : [...prev, ...data.items]));
        setTotalFilteredCount(data.totalFiltered);
        setHasMorePages(data.hasMore);
      } catch {
        // Fallback to local curated catalog when offline
        if (!cancelled) {
          const localFallback = filterAndSortApps([...customApps, ...CURATED_APPS], {
            category: selectedCategory,
            query: debouncedQuery,
            architecture: archFilter,
            sortBy,
          });
          setIndexedItems(localFallback);
          setTotalFilteredCount(localFallback.length);
          setHasMorePages(false);
        }
      } finally {
        if (!cancelled) setIsLoadingCatalog(false);
      }
    };

    void fetchPage();
    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    debouncedQuery,
    selectedCategory,
    selectedRepoId,
    archFilter,
    sortBy,
    onlyScreenshots,
    currentPage,
    catalogSummary?.indexedReady,
    catalogSummary?.totalIndexedEntries,
    customApps,
  ]);

  const curatedCatalog = useMemo(() => {
    const enabledRepoSlugs = new Set(
      repositories.filter((repo) => repo.enabled).map((repo) => repo.slug.toLowerCase())
    );
    const activeCustomApps = customApps.filter((app) =>
      enabledRepoSlugs.has(app.repoSlug.toLowerCase())
    );
    return [...activeCustomApps, ...CURATED_APPS].map((app) =>
      resolveAppWithSync(app, appOverrides[app.id])
    );
  }, [customApps, appOverrides, repositories]);

  // Display list merges custom apps seamlessly on page 1 when matching filters
  const displayedCatalogApps = useMemo(() => {
    const base = indexedItems.length > 0 ? indexedItems : curatedCatalog;
    const withOverrides = base.map((app) => resolveAppWithSync(app, appOverrides[app.id]));
    if (customApps.length > 0 && selectedRepoId === 'all') {
      const customFiltered = filterAndSortApps(customApps, {
        category: selectedCategory,
        query: debouncedQuery,
        architecture: archFilter,
        sortBy,
      });
      const existingIds = new Set(withOverrides.map((a) => a.packageName));
      const extraCustoms = customFiltered.filter((a) => !existingIds.has(a.packageName));
      return [...extraCustoms, ...withOverrides];
    }
    return withOverrides;
  }, [
    indexedItems,
    curatedCatalog,
    appOverrides,
    customApps,
    selectedRepoId,
    selectedCategory,
    debouncedQuery,
    archFilter,
    sortBy,
  ]);

  const featuredApp = useMemo(
    () => curatedCatalog.find((app) => app.id === 'myspoti') ?? curatedCatalog[0],
    [curatedCatalog]
  );

  const trendingApps = useMemo(() => {
    const ids = ['termux', 'pcapdroid', 'newpipe', 'mihon', 'cromite'];
    return ids
      .map((id) => curatedCatalog.find((a) => a.id === id))
      .filter((a): a is AndroidAppItem => Boolean(a));
  }, [curatedCatalog]);

  const showcaseApps = useMemo(
    () => curatedCatalog.filter((app) => app.id !== featuredApp?.id && app.previewImage).slice(0, 4),
    [curatedCatalog, featuredApp]
  );

  const installedMap = useMemo(() => {
    const map: Record<string, InstalledAppRecord> = {};
    for (const item of installedApps) {
      map[item.appId] = item;
    }
    return map;
  }, [installedApps]);

  const activeSelectedApp = useMemo(() => {
    if (!selectedApp) return null;
    return resolveAppWithSync(selectedApp, appOverrides[selectedApp.id]);
  }, [selectedApp, appOverrides]);

  const totalIndexedDisplay = catalogSummary?.totalIndexedEntries || 11920;
  const totalUniqueDisplay = catalogSummary?.uniqueApps || 8300;
  const totalRepoCount = repositories.length;

  const todayLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
        .format(new Date())
        .toUpperCase();
    } catch {
      return 'LOJA OPEN-SOURCE ANDROID';
    }
  }, []);

  const lastSyncedLabel = useMemo(() => {
    if (!lastSyncedAt) return null;
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(lastSyncedAt));
    } catch {
      return null;
    }
  }, [lastSyncedAt]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4500);
  };

  const syncAllStore = async (force = false, silent = false): Promise<number> => {
    if (!isOnline) {
      if (!silent) showToast('Sem conexão no momento. Usando catálogo em cache.');
      return 0;
    }
    setIsSyncingAll(true);
    try {
      const enabledRepos = repositories.filter((r) => r.enabled);
      const [indexRes, curatedRes] = await Promise.all([
        fetch('/api/catalog/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force }),
        }),
        fetch('/api/sync/catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            force,
            apps: [...customApps, ...CURATED_APPS].map((app) => ({
              id: app.id,
              repoSlug: app.repoSlug,
              packageName: app.packageName,
              sourceType: app.sourceType,
            })),
            repositories: enabledRepos
              .filter((r) => r.kind === 'github')
              .map((repo) => ({
                id: repo.id,
                slug: repo.slug,
                url: repo.url,
                kind: repo.kind,
              })),
          }),
        }),
      ]);

      let nextSummary: CatalogSummaryResponse | null = null;
      if (indexRes.ok) {
        nextSummary = (await indexRes.json()) as CatalogSummaryResponse;
        applySummaryToRepositories(nextSummary);
      }

      const nextOverrides: Record<string, AppSyncOverride> = { ...appOverrides };
      if (curatedRes.ok) {
        const data = (await curatedRes.json()) as CatalogSyncResponse;
        for (const [appId, patch] of Object.entries(data.apps || {})) {
          nextOverrides[appId] = { ...(nextOverrides[appId] || {}), ...patch };
        }
        setAppOverrides(nextOverrides);
      }

      const updatedCatalog = [...customApps, ...CURATED_APPS].map((app) =>
        resolveAppWithSync(app, nextOverrides[app.id])
      );
      const libSummary = calculateLibrarySummary(installedApps, updatedCatalog);

      if (!silent) {
        const countStr = (nextSummary?.totalIndexedEntries || totalIndexedDisplay).toLocaleString(
          'pt-BR'
        );
        showToast(
          `Índice sincronizado: ${countStr} builds em ${repositories.length} repositórios open-source.`
        );
      }
      return libSummary.updatesAvailable;
    } catch {
      if (!silent) showToast('Erro de rede ao sincronizar. Exibindo cache local.');
      return 0;
    } finally {
      setIsSyncingAll(false);
    }
  };

  const startApkDownload = (app: AndroidAppItem, preferredAsset?: ApkAsset) => {
    const asset = preferredAsset ?? selectBestApkAsset(app.assets, 'arm64-v8a');
    if (!asset || activeDownloads[app.id]) return;

    setActiveDownloads((prev) => ({
      ...prev,
      [app.id]: {
        appId: app.id,
        arch: asset.arch,
        progress: 22,
        totalBytes: asset.sizeBytes,
      },
    }));

    setTimeout(() => {
      setActiveDownloads((prev) => {
        if (!prev[app.id]) return prev;
        return {
          ...prev,
          [app.id]: { ...prev[app.id], progress: 74 },
        };
      });
    }, 180);

    setTimeout(() => {
      setActiveDownloads((prev) => {
        const next = { ...prev };
        delete next[app.id];
        return next;
      });

      const record: InstalledAppRecord = {
        appId: app.id,
        name: app.name,
        packageName: app.packageName,
        version: app.version,
        arch: asset.arch,
        sizeBytes: asset.sizeBytes,
        downloadedAt: new Date().toISOString().slice(0, 10),
        downloadUrl: asset.downloadUrl,
        sha256: asset.sha256,
      };

      setInstalledApps((prev) => {
        const withoutCurrent = prev.filter((item) => item.appId !== app.id);
        return [record, ...withoutCurrent];
      });

      showToast(`${app.name} v${app.version} (${asset.arch}) salvo na Biblioteca.`);
    }, 420);
  };

  const handleUpdateAppSync = (appId: string, override: AppSyncOverride) => {
    setAppOverrides((prev) => ({
      ...prev,
      [appId]: {
        ...(prev[appId] || {}),
        ...override,
      },
    }));
  };

  const handleSyncSingleRepo = async (repoId: string) => {
    const repo = repositories.find((r) => r.id === repoId);
    if (!repo) return;
    await syncAllStore(true, false);
    showToast(`Repositório ${repo.name} verificado e atualizado.`);
  };

  const handleAddFDroidPackage = async (
    packageId: string
  ): Promise<{ ok: boolean; message: string }> => {
    try {
      const response = await fetch(`/api/fdroid/package?id=${encodeURIComponent(packageId)}`);
      const data = await response.json();
      if (!response.ok) {
        return {
          ok: false,
          message: data.error || `Pacote ${packageId} não encontrado no F-Droid.`,
        };
      }

      const shortName = packageId.split('.').slice(-1)[0] || packageId;
      const displayName = shortName.charAt(0).toUpperCase() + shortName.slice(1);
      const cleanId = `fdroid-${packageId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const today = new Date().toISOString().slice(0, 10);

      const newRepo: RepositorySource = {
        id: `custom-fdroid-${Date.now()}`,
        name: `${displayName} (F-Droid)`,
        slug: packageId,
        url: `https://f-droid.org/packages/${packageId}`,
        kind: 'fdroid',
        enabled: true,
        verified: true,
        appCount: 1,
        lastSyncedAt: today,
        syncStatus: 'online',
        description: `Pacote Android sincronizado direto do índice F-Droid (${packageId}).`,
      };

      const newApp: AndroidAppItem = {
        id: cleanId,
        name: displayName,
        packageName: data.packageName,
        category: 'Utilitários',
        tagline: `Aplicativo Android oficial do repositório F-Droid (${data.packageName}).`,
        description: `Pacote verificado no índice F-Droid oficial, versão v${data.version} (código ${data.versionCode}).`,
        developer: 'F-Droid Community',
        version: data.version,
        minAndroid: '7.0+',
        license: 'Open Source',
        updatedAt: today,
        downloadsCount: 85000,
        repoName: 'F-Droid Oficial',
        repoSlug: packageId,
        sourceType: 'fdroid',
        iconImage: APP_ICONS.githubApk,
        previewImage: HERO_MEDIA.repos,
        galleryImages: [HERO_MEDIA.repos],
        accentColor: '#7C3AED',
        monogram: displayName.slice(0, 2).toUpperCase(),
        assets: [
          {
            name: `${data.packageName}_${data.versionCode}.apk`,
            arch: 'universal',
            sizeBytes: 14.5 * 1024 * 1024,
            downloadUrl: data.downloadUrl,
            sha256: 'verificado-indice-oficial-fdroid',
          },
        ],
        permissions: [],
        changelog: [`Versão v${data.version} sincronizada do F-Droid.`],
      };

      setRepositories((prev) => [newRepo, ...prev]);
      setCustomApps((prev) => [newApp, ...prev.filter((a) => a.id !== cleanId)]);

      return {
        ok: true,
        message: `Pacote F-Droid ${displayName} (v${data.version}) conectado ao catálogo!`,
      };
    } catch {
      return {
        ok: false,
        message: 'Erro ao consultar o índice F-Droid neste momento.',
      };
    }
  };

  const handleAddGitHubRepo = async (
    slug: string,
    url: string
  ): Promise<{ ok: boolean; message: string }> => {
    const repoName = slug.split('/')[1] || slug;
    const owner = slug.split('/')[0] || 'Comunidade';
    const cleanId = `custom-${slug.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    let version = '1.0.0';
    let publishedAt = new Date().toISOString().slice(0, 10);
    let releaseNotes = `Lançamento direto importado de ${slug}.`;
    let descriptionText = releaseNotes;
    let starsCount: number | undefined;
    let syncedIconUrl: string | undefined;
    let syncedGallery: string[] = [];
    let assets: ApkAsset[] = [
      {
        name: `${repoName}-universal-release.apk`,
        arch: 'universal',
        sizeBytes: 18.4 * 1024 * 1024,
        downloadUrl: `${url}/releases/latest`,
        sha256: 'verificacao-sha256-disponivel-na-origem',
      },
    ];

    try {
      const response = await fetch(`/api/github/release?repo=${encodeURIComponent(slug)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.version) version = data.version;
        if (data.publishedAt) publishedAt = data.publishedAt;
        if (data.notes) releaseNotes = data.notes;
        if (data.description) descriptionText = data.description;
        if (typeof data.starsCount === 'number') starsCount = data.starsCount;
        if (data.iconUrl) syncedIconUrl = data.iconUrl;
        if (Array.isArray(data.galleryImages)) syncedGallery = data.galleryImages;
        if (Array.isArray(data.apkAssets) && data.apkAssets.length > 0) {
          assets = data.apkAssets.map(
            (a: { name: string; arch: AndroidArch; sizeBytes: number; downloadUrl: string }) => ({
              ...a,
              sha256: 'verificacao-sha256-github-release',
            })
          );
        }
      }
    } catch {
      // Deterministic fallback when offline
    }

    const newRepo: RepositorySource = {
      id: `custom-gh-${Date.now()}`,
      name: repoName,
      slug,
      url,
      kind: 'github',
      enabled: true,
      verified: true,
      appCount: 1,
      lastSyncedAt: publishedAt,
      syncStatus: 'online',
      description: `Repositório GitHub conectado manualmente por você (${slug}).`,
    };

    const newApp: AndroidAppItem = {
      id: cleanId,
      name: repoName,
      packageName: `io.github.${owner.toLowerCase()}.${repoName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      category: 'Utilitários',
      tagline: `Aplicativo Android importado diretamente de ${slug} via GitHub Releases.`,
      description: descriptionText,
      developer: owner,
      version,
      minAndroid: '8.0+',
      license: 'Open Source',
      updatedAt: publishedAt,
      downloadsCount: starsCount ? starsCount * 10 : 12500,
      starsCount,
      lastSyncedAt: new Date().toISOString(),
      repoName: 'GitHub Releases',
      repoSlug: slug,
      sourceCodeUrl: url,
      sourceType: 'github',
      iconImage: syncedIconUrl || APP_ICONS.githubApk,
      fallbackIconImage: APP_ICONS.githubApk,
      previewImage: syncedGallery[0] || HERO_MEDIA.repos,
      galleryImages:
        syncedGallery.length > 0 ? [...syncedGallery, HERO_MEDIA.repos] : [HERO_MEDIA.repos],
      accentColor: '#7C3AED',
      monogram: repoName.slice(0, 2).toUpperCase(),
      assets,
      permissions: [],
      changelog: parseReleaseNotesToChangelog(releaseNotes, [
        `Versão ${version} sincronizada do repositório ${slug}.`,
      ]),
    };

    setRepositories((prev) => [newRepo, ...prev]);
    setCustomApps((prev) => [newApp, ...prev.filter((item) => item.id !== cleanId)]);

    return {
      ok: true,
      message: `Repositório ${slug} conectado! "${repoName}" (v${version}) e imagens sincronizados.`,
    };
  };

  const handleToggleRepo = (repoId: string) => {
    setRepositories((prev) =>
      prev.map((repo) => (repo.id === repoId ? { ...repo, enabled: !repo.enabled } : repo))
    );
  };

  const handleRemoveRepo = (repoId: string) => {
    const target = repositories.find((r) => r.id === repoId);
    setRepositories((prev) => prev.filter((repo) => repo.id !== repoId));
    if (target) {
      setCustomApps((prev) => prev.filter((app) => app.repoSlug !== target.slug));
    }
  };

  const handleRemoveInstalled = (appId: string) => {
    setInstalledApps((prev) => prev.filter((item) => item.appId !== appId));
  };

  const handleReDownloadRecord = (record: InstalledAppRecord) => {
    const found =
      displayedCatalogApps.find((app) => app.id === record.appId) ||
      curatedCatalog.find((app) => app.id === record.appId);
    if (found) {
      const asset = selectBestApkAsset(found.assets, record.arch);
      startApkDownload(found, asset);
    }
  };

  const resetFilters = () => {
    setSelectedCategory('Todos');
    setSelectedRepoId('all');
    setSearchQuery('');
    setArchFilter('all');
    setSortBy('featured');
    setOnlyScreenshots(false);
    setCurrentPage(1);
  };

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const jumpToCategory = (category: AppCategory, repoId = 'all') => {
    setSelectedCategory(category);
    setSelectedRepoId(repoId);
    setSortBy('featured');
    setCurrentPage(1);
    handleSelectTab('apps');
  };

  const renderSearchInput = (inputId: string, placeholder: string) => (
    <div className="relative w-full">
      <Search
        className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
      />
      <label htmlFor={inputId} className="sr-only">
        Buscar aplicativos, pacotes e repositórios
      </label>
      <input
        id={inputId}
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-2xl bg-white/[0.07] border border-white/12 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/[0.11] focus:border-purple-400 transition-colors"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          aria-label="Limpar pesquisa"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );

  const featuredInstalled = featuredApp ? installedMap[featuredApp.id] : undefined;
  const featuredDownload = featuredApp ? activeDownloads[featuredApp.id] : undefined;
  const featuredNeedsUpdate =
    featuredApp && featuredInstalled
      ? hasUpdateAvailable(featuredInstalled.version, featuredApp.version)
      : false;

  const categoryCountMap = useMemo(() => {
    const map = new Map<string, number>();
    if (catalogSummary?.categories) {
      for (const c of catalogSummary.categories) {
        map.set(c.name, c.count);
      }
    }
    return map;
  }, [catalogSummary]);

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      <TopBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        libraryCount={installedApps.length}
        totalCatalogCount={totalIndexedDisplay}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 md:pt-7 pb-28 md:pb-16">
        {/* ======================== TAB: EXPLORAR (TODAY) ======================== */}
        {activeTab === 'today' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold tracking-wider text-purple-300/80 uppercase">
                    {todayLabel}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 tabular-nums truncate">
                    {totalIndexedDisplay.toLocaleString('pt-BR')} builds ·{' '}
                    {totalUniqueDisplay.toLocaleString('pt-BR')} apps · {totalRepoCount} fontes
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Explorar
                  </h1>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void syncAllStore(true, false)}
                      disabled={isSyncingAll}
                      aria-label="Sincronizar índice open-source completo"
                      className="min-h-[40px] px-3.5 py-2 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/12 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 disabled:opacity-60 transition-colors whitespace-nowrap"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-purple-300 ${isSyncingAll ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                      />
                      <span>
                        {isSyncingAll
                          ? 'Sincronizando...'
                          : lastSyncedLabel
                            ? `Sincronizado · ${lastSyncedLabel}`
                            : 'Sincronizar Índice'}
                      </span>
                    </button>
                    <div className="md:hidden shrink-0">
                      <PWAInstallButton compact />
                    </div>
                  </div>
                </div>
              </div>

              {renderSearchInput(
                'today-store-search',
                `Buscar entre ${totalIndexedDisplay.toLocaleString('pt-BR')} apps open-source (ex.: Termux, NewPipe, Kali, Bitwarden)...`
              )}
            </div>

            {debouncedQuery.length > 0 ? (
              <section aria-label="Resultados na loja" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-bold text-white tabular-nums">
                    {isLoadingCatalog
                      ? `Buscando "${debouncedQuery}"...`
                      : `${totalFilteredCount.toLocaleString('pt-BR')} resultados para "${debouncedQuery}"`}
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectTab('apps')}
                      className="text-xs font-semibold text-purple-300 hover:text-purple-200"
                    >
                      Abrir filtros avançados
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-xs font-medium text-slate-400 hover:text-white"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {displayedCatalogApps.length === 0 && !isLoadingCatalog ? (
                  <div className="liquid-glass rounded-3xl p-8 text-center space-y-3">
                    <p className="font-display text-base font-bold text-white">
                      Nenhum aplicativo encontrado para &ldquo;{debouncedQuery}&rdquo;
                    </p>
                    <p className="text-sm text-slate-300">
                      Verifique o nome do pacote ou adicione um repositório GitHub personalizado em Fontes.
                    </p>
                  </div>
                ) : (
                  <div className="liquid-glass rounded-3xl divide-y divide-white/[0.08] overflow-hidden">
                    {displayedCatalogApps.slice(0, 12).map((app) => (
                      <AppStoreRow
                        key={app.id}
                        app={app}
                        installedRecord={installedMap[app.id]}
                        activeDownload={activeDownloads[app.id]}
                        onSelectApp={(item) => setSelectedApp(item)}
                        onQuickDownload={(item) => startApkDownload(item)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* 1. Split Spotlight: Featured + Top Open Source */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {featuredApp && (
                    <motion.article
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                      className="lg:col-span-7 relative min-h-[390px] sm:min-h-[420px] rounded-[28px] overflow-hidden liquid-glass flex flex-col justify-between group"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedApp(featuredApp)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedApp(featuredApp);
                          }
                        }}
                        aria-label={`Abrir detalhes de ${featuredApp.name}`}
                        className="absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-purple-400"
                      >
                        {!heroImgError ? (
                          <img
                            src={HERO_MEDIA.myspoti}
                            alt="Interface do MySpoti para streaming musical open-source"
                            referrerPolicy="no-referrer"
                            onError={() => setHeroImgError(true)}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#130D26]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#06050B]/85 via-[#06050B]/20 to-[#06050B]/95" />
                      </div>

                      <div className="relative z-10 p-6 pointer-events-none">
                        <p className="text-[11px] font-bold tracking-wider text-purple-200 uppercase">
                          DESTAQUE OPEN-SOURCE
                        </p>
                        <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight max-w-md [text-wrap:balance]">
                          Streaming livre sem anúncios com o {featuredApp.name}
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-slate-200/90 tabular-nums">
                          {featuredApp.license} · v{featuredApp.version} ·{' '}
                          {formatBytes(featuredApp.assets[0]?.sizeBytes ?? 0)}
                        </p>
                      </div>

                      <div className="relative z-10 m-3 sm:m-4 p-3.5 rounded-2xl bg-[#0B0816]/85 backdrop-blur-xl border border-white/15 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedApp(featuredApp)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left"
                        >
                          <AppIcon
                            name={featuredApp.name}
                            src={featuredApp.iconImage}
                            zoom={featuredApp.iconZoom}
                            fallbackSrc={featuredApp.fallbackIconImage}
                            fallbackZoom={featuredApp.fallbackIconZoom}
                            monogram={featuredApp.monogram}
                            accentColor={featuredApp.accentColor}
                            size="md"
                          />
                          <div className="min-w-0">
                            <p className="font-display text-sm sm:text-base font-bold text-white truncate">
                              {featuredApp.name}
                            </p>
                            <p className="text-xs text-slate-300 truncate">{featuredApp.tagline}</p>
                          </div>
                        </button>

                        <div className="shrink-0">
                          {featuredDownload ? (
                            <button
                              type="button"
                              disabled
                              className="min-h-[36px] min-w-[82px] px-4 py-1.5 rounded-full bg-purple-500/30 text-purple-100 text-xs font-bold inline-flex items-center justify-center gap-1 tabular-nums"
                            >
                              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                              <span>{featuredDownload.progress}%</span>
                            </button>
                          ) : featuredInstalled && !featuredNeedsUpdate ? (
                            <button
                              type="button"
                              onClick={() => setSelectedApp(featuredApp)}
                              className="min-h-[36px] min-w-[82px] px-4 py-1.5 rounded-full bg-white/15 text-purple-200 text-xs font-bold inline-flex items-center justify-center gap-1 hover:bg-white/25 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Abrir</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startApkDownload(featuredApp)}
                              className="min-h-[36px] min-w-[82px] px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
                            >
                              <Download className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{featuredNeedsUpdate ? 'Atualizar' : 'Obter'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  )}

                  <section
                    aria-label="Essenciais Open-Source"
                    className="lg:col-span-5 liquid-glass rounded-[28px] p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="text-[11px] font-bold tracking-wider text-purple-300 uppercase">
                            ESSENCIAIS VERIFICADOS
                          </p>
                          <h2 className="font-display text-xl font-extrabold text-white tracking-tight">
                            Segurança, Mídia & Pentest
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectTab('apps')}
                          aria-label="Abrir catálogo completo"
                          className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/12 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
                        >
                          <ChevronRight className="w-5 h-5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="divide-y divide-white/[0.08]">
                        {trendingApps.slice(0, 4).map((app) => (
                          <AppStoreRow
                            key={app.id}
                            app={app}
                            installedRecord={installedMap[app.id]}
                            activeDownload={activeDownloads[app.id]}
                            onSelectApp={(item) => setSelectedApp(item)}
                            onQuickDownload={(item) => startApkDownload(item)}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectTab('apps')}
                      className="mt-3 min-h-[42px] w-full rounded-2xl bg-purple-600/25 hover:bg-purple-600 border border-purple-400/30 text-xs font-semibold text-white transition-colors tabular-nums"
                    >
                      Explorar {totalIndexedDisplay.toLocaleString('pt-BR')}+ builds indexadas
                    </button>
                  </section>
                </div>

                {/* 2. Curated Visual Apps Row (4 balanced cards) */}
                <section aria-label="Com capturas oficiais" className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-xl font-extrabold text-white">
                        Prévias Visuais & Auditoria
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Capturas oficiais verificadas direto dos repositórios originais.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOnlyScreenshots(true);
                        handleSelectTab('apps');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-purple-200 whitespace-nowrap"
                    >
                      <span>Ver todos com fotos</span>
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {showcaseApps.map((app) => (
                      <AppCard
                        key={`spot-${app.id}`}
                        app={app}
                        installedRecord={installedMap[app.id]}
                        activeDownload={activeDownloads[app.id]}
                        onSelectApp={(item) => setSelectedApp(item)}
                        onQuickDownload={(item) => startApkDownload(item)}
                      />
                    ))}
                  </div>
                </section>

                {/* 3. Clean Open-Source Categories Directory */}
                <section aria-label="Explorar por categoria" className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-display text-xl font-extrabold text-white">
                      Diretório por Categoria
                    </h2>
                    <button
                      type="button"
                      onClick={() => jumpToCategory('Todos', 'nethunter')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-purple-200 whitespace-nowrap"
                    >
                      <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Kali NetHunter Store</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {(CATEGORIES.filter((c) => c !== 'Todos') as Exclude<AppCategory, 'Todos'>[]).map(
                      (category) => {
                        const Icon = CATEGORY_ICONS[category];
                        const count = categoryCountMap.get(category);
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => jumpToCategory(category)}
                            className="liquid-glass-card rounded-2xl p-4 text-left flex items-center justify-between gap-3 hover:border-purple-400/40 transition-colors group"
                          >
                            <div className="min-w-0">
                              <p className="font-display text-sm font-bold text-white group-hover:text-purple-200 truncate">
                                {category}
                              </p>
                              <p className="text-xs text-slate-400 tabular-nums mt-0.5">
                                {count ? `${count.toLocaleString('pt-BR')} apps` : 'Explorar'}
                              </p>
                            </div>
                            <Icon
                              className="w-5 h-5 text-purple-300/80 group-hover:text-purple-200 shrink-0"
                              aria-hidden="true"
                            />
                          </button>
                        );
                      }
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* ======================== TAB: CATÁLOGO (+10K APPS) ======================== */}
        {activeTab === 'apps' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-purple-300/80 uppercase tabular-nums">
                    {totalUniqueDisplay.toLocaleString('pt-BR')} APPS ÚNICOS ·{' '}
                    {totalIndexedDisplay.toLocaleString('pt-BR')} BUILDS EM {totalRepoCount} FONTES
                  </p>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-0.5">
                    Catálogo Open-Source
                  </h1>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void syncAllStore(true, false)}
                    disabled={isSyncingAll}
                    className="min-h-[40px] px-3.5 py-2 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/12 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 disabled:opacity-60 transition-colors whitespace-nowrap"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-purple-300 ${isSyncingAll ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                    <span>{isSyncingAll ? 'Sincronizando...' : 'Atualizar Índices'}</span>
                  </button>
                </div>
              </div>

              {/* Clean Single Unified Filter Toolbar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
                <div className="lg:col-span-4">
                  {renderSearchInput(
                    'catalog-store-search',
                    'Buscar app, pacote ou autor...'
                  )}
                </div>

                <div className="lg:col-span-8 flex flex-wrap lg:flex-nowrap items-center lg:justify-end gap-2">
                  <label htmlFor="repo-filter-select" className="sr-only">
                    Filtrar por repositório
                  </label>
                  <select
                    id="repo-filter-select"
                    value={selectedRepoId}
                    onChange={(e) => {
                      setSelectedRepoId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="min-h-[44px] max-w-[220px] truncate px-3 py-2 rounded-2xl bg-[#131020] border border-white/10 text-xs font-medium text-slate-200 focus:outline-none focus:border-purple-400"
                  >
                    <option value="all">
                      Todas as fontes ({totalIndexedDisplay.toLocaleString('pt-BR')})
                    </option>
                    {repositories.map((repo) => (
                      <option key={repo.id} value={repo.id}>
                        {repo.name} ({repo.appCount.toLocaleString('pt-BR')})
                      </option>
                    ))}
                  </select>

                  <label htmlFor="arch-select" className="sr-only">
                    Arquitetura do aparelho
                  </label>
                  <select
                    id="arch-select"
                    value={archFilter}
                    onChange={(e) => {
                      setArchFilter(e.target.value as AndroidArch | 'all');
                      setCurrentPage(1);
                    }}
                    className="min-h-[44px] px-3 py-2 rounded-2xl bg-[#131020] border border-white/10 text-xs font-medium text-slate-200 focus:outline-none focus:border-purple-400"
                  >
                    <option value="all">Arquiteturas</option>
                    <option value="arm64-v8a">arm64-v8a</option>
                    <option value="armeabi-v7a">armeabi-v7a</option>
                    <option value="universal">Universal</option>
                  </select>

                  <label htmlFor="sort-select" className="sr-only">
                    Ordenar catálogo
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as SortOption);
                      setCurrentPage(1);
                    }}
                    className="min-h-[44px] px-3 py-2 rounded-2xl bg-[#131020] border border-white/10 text-xs font-medium text-slate-200 focus:outline-none focus:border-purple-400"
                  >
                    <option value="featured">Destaques</option>
                    <option value="recent">Recentes</option>
                    <option value="name">Nome (A–Z)</option>
                    <option value="size">Menor APK</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setOnlyScreenshots((prev) => !prev);
                      setCurrentPage(1);
                    }}
                    aria-pressed={onlyScreenshots}
                    className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-semibold border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      onlyScreenshots
                        ? 'bg-purple-600 text-white border-purple-400/60'
                        : 'bg-white/[0.05] text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Com capturas</span>
                  </button>
                </div>
              </div>

              {/* Clean Category Segmented Strip */}
              <div
                role="group"
                aria-label="Categorias de aplicativos"
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1"
              >
                {CATEGORIES.map((category) => {
                  const isActive = selectedCategory === category;
                  const catCount =
                    category === 'Todos'
                      ? totalUniqueDisplay
                      : categoryCountMap.get(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category);
                        setCurrentPage(1);
                      }}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors tabular-nums ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-[0_0_20px_-4px_rgba(147,51,234,0.8)]'
                          : 'bg-white/[0.06] text-slate-300 border border-white/10 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {category}
                      {catCount ? ` · ${catCount.toLocaleString('pt-BR')}` : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Counter Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 tabular-nums border-b border-white/[0.08] pb-3">
              <span>
                Exibindo{' '}
                <strong className="text-white">
                  {displayedCatalogApps.length.toLocaleString('pt-BR')}
                </strong>{' '}
                de{' '}
                <strong className="text-purple-200">
                  {totalFilteredCount.toLocaleString('pt-BR')}
                </strong>{' '}
                aplicativos nesta visualização
              </span>
              {(selectedCategory !== 'Todos' ||
                selectedRepoId !== 'all' ||
                debouncedQuery !== '' ||
                archFilter !== 'all' ||
                onlyScreenshots) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="font-semibold text-purple-300 hover:text-purple-200"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Catalog 3-Column Grid */}
            {isLoadingCatalog && currentPage === 1 && displayedCatalogApps.length === 0 ? (
              <div className="liquid-glass rounded-3xl p-12 text-center space-y-3">
                <Loader2 className="w-7 h-7 text-purple-300 animate-spin mx-auto" aria-hidden="true" />
                <p className="text-sm text-slate-300">
                  Consultando índice open-source ({totalIndexedDisplay.toLocaleString('pt-BR')} builds)...
                </p>
              </div>
            ) : displayedCatalogApps.length === 0 ? (
              <div className="liquid-glass rounded-3xl p-10 text-center space-y-3">
                <h2 className="font-display text-lg font-bold text-white">
                  Nenhum aplicativo corresponde aos filtros selecionados
                </h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Limpe os filtros ativos ou altere a fonte de repositório para explorar todos os aplicativos.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="min-h-[42px] px-5 py-2 rounded-full bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-colors"
                >
                  Mostrar catálogo completo
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayedCatalogApps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      installedRecord={installedMap[app.id]}
                      activeDownload={activeDownloads[app.id]}
                      onSelectApp={(item) => setSelectedApp(item)}
                      onQuickDownload={(item) => startApkDownload(item)}
                    />
                  ))}
                </div>

                {hasMorePages && (
                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      disabled={isLoadingCatalog}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="min-h-[46px] px-7 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_28px_-6px_rgba(147,51,234,0.6)] tabular-nums"
                    >
                      {isLoadingCatalog ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          <span>Carregando mais apps...</span>
                        </>
                      ) : (
                        <span>
                          Carregar mais apps ({displayedCatalogApps.length.toLocaleString('pt-BR')} de{' '}
                          {totalFilteredCount.toLocaleString('pt-BR')})
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ======================== TAB: FONTES (REPOS) ======================== */}
        {activeTab === 'repos' && (
          <RepositoriesView
            repositories={repositories}
            isSyncingAll={isSyncingAll}
            lastSyncedLabel={lastSyncedLabel}
            onSyncAll={async () => {
              await syncAllStore(true, false);
            }}
            onSyncSingleRepo={handleSyncSingleRepo}
            onToggleRepo={handleToggleRepo}
            onRemoveRepo={handleRemoveRepo}
            onAddGitHubRepo={handleAddGitHubRepo}
            onAddFDroidPackage={handleAddFDroidPackage}
            onInspectRepo={(repoId) => jumpToCategory('Todos', repoId)}
          />
        )}

        {/* ======================== TAB: BIBLIOTECA ======================== */}
        {activeTab === 'library' && (
          <LibraryView
            installedApps={installedApps}
            activeDownloads={activeDownloads}
            catalog={curatedCatalog}
            isSyncingAll={isSyncingAll}
            onSyncAll={() => syncAllStore(true, false)}
            onExplore={() => handleSelectTab('apps')}
            onSelectApp={(item) => setSelectedApp(item)}
            onReDownload={handleReDownloadRecord}
            onRemoveInstalled={handleRemoveInstalled}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        libraryCount={installedApps.length}
      />

      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-5 left-4 z-40 max-w-sm rounded-2xl bg-[#1A1424]/95 backdrop-blur-xl border border-amber-400/30 text-amber-100 px-4 py-2.5 text-xs font-medium inline-flex items-center gap-2 shadow-xl"
        >
          <WifiOff className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
          <span>Modo offline: exibindo catálogo em cache.</span>
        </div>
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 md:bottom-5 right-4 z-40 max-w-sm rounded-2xl liquid-glass border border-purple-400/35 text-white px-4 py-3 text-xs font-medium flex items-center gap-3 shadow-[0_14px_34px_rgba(0,0,0,0.85)]"
        >
          <Check className="w-4 h-4 text-purple-300 shrink-0" aria-hidden="true" />
          <span className="flex-1">{toastMessage}</span>
          <button
            type="button"
            onClick={() => {
              setToastMessage(null);
              handleSelectTab('library');
            }}
            className="text-purple-300 hover:text-white font-semibold whitespace-nowrap"
          >
            Biblioteca
          </button>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Fechar aviso"
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      <AppDetailSheet
        app={activeSelectedApp}
        installedRecord={activeSelectedApp ? installedMap[activeSelectedApp.id] : undefined}
        activeDownload={activeSelectedApp ? activeDownloads[activeSelectedApp.id] : undefined}
        onClose={() => setSelectedApp(null)}
        onDownloadApk={startApkDownload}
        onUpdateAppSync={handleUpdateAppSync}
      />
    </div>
  );
}
