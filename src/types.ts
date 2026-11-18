export type AppCategory =
  | 'Todos'
  | 'Segurança'
  | 'Privacidade'
  | 'Música'
  | 'Vídeo'
  | 'Internet'
  | 'Desenvolvimento'
  | 'Leitura'
  | 'Sistema'
  | 'Utilitários';

export type AndroidArch = 'arm64-v8a' | 'armeabi-v7a' | 'universal';

export type SortOption = 'featured' | 'recent' | 'downloads' | 'name' | 'size';

export interface AppPermission {
  code: string;
  label: string;
  risk: 'baixo' | 'moderado' | 'sensível';
  reason: string;
}

export interface ApkAsset {
  name: string;
  arch: AndroidArch;
  sizeBytes: number;
  downloadUrl: string;
  sha256: string;
}

export interface AndroidAppItem {
  id: string;
  name: string;
  packageName: string;
  category: Exclude<AppCategory, 'Todos'>;
  rawCategories?: string[];
  tagline: string;
  description: string;
  developer: string;
  version: string;
  minAndroid: string;
  license: string;
  updatedAt: string;
  downloadsCount: number;
  starsCount?: number;
  lastSyncedAt?: string;
  repoId?: string;
  repoName?: string;
  repoSlug: string;
  sourceCodeUrl?: string;
  sourceType: 'curated' | 'github' | 'fdroid';
  featured?: boolean;
  hasScreenshots?: boolean;
  iconImage?: string;
  iconZoom?: boolean;
  fallbackIconImage?: string;
  fallbackIconZoom?: boolean;
  bannerImage?: string;
  previewImage?: string;
  galleryImages?: string[];
  accentColor: string;
  monogram: string;
  assets: ApkAsset[];
  permissions: AppPermission[];
  changelog: string[];
}

export interface AppSyncOverride {
  version?: string;
  assets?: ApkAsset[];
  updatedAt?: string;
  description?: string;
  changelog?: string[];
  starsCount?: number;
  iconImage?: string;
  previewImage?: string;
  galleryImages?: string[];
  lastSyncedAt: string;
  syncSource: 'github' | 'fdroid' | 'atom' | 'cache';
}

export interface RepositorySource {
  id: string;
  name: string;
  slug: string;
  url: string;
  kind: 'github' | 'fdroid';
  enabled: boolean;
  verified: boolean;
  appCount: number;
  lastSyncedAt: string;
  syncStatus?: 'online' | 'cached' | 'offline';
  description: string;
}

export interface InstalledAppRecord {
  appId: string;
  name: string;
  packageName: string;
  version: string;
  arch: AndroidArch;
  sizeBytes: number;
  downloadedAt: string;
  downloadUrl: string;
  sha256: string;
}

export interface ActiveDownload {
  appId: string;
  arch: AndroidArch;
  progress: number;
  totalBytes: number;
}

export interface CatalogSummaryResponse {
  indexedReady: boolean;
  indexing: boolean;
  totalIndexedEntries: number;
  uniqueApps: number;
  appsWithIcons: number;
  appsWithScreenshots: number;
  lastSyncedAt: string | null;
  categories: Array<{ name: Exclude<AppCategory, 'Todos'>; count: number }>;
  repositories: Array<{
    id: string;
    name: string;
    slug: string;
    url: string;
    kind: 'github' | 'fdroid';
    appCount: number;
    uniqueAdded: number;
    syncStatus: 'online' | 'cached' | 'offline';
    lastSyncedAt: string;
    description: string;
  }>;
}

export interface CatalogAppsResponse {
  items: AndroidAppItem[];
  totalFiltered: number;
  totalUnique: number;
  totalIndexedEntries: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CatalogSyncResponse {
  syncedAt: string;
  apps: Record<string, AppSyncOverride>;
  repositories: Record<
    string,
    {
      lastSyncedAt: string;
      syncStatus: 'online' | 'cached' | 'offline';
      verified: boolean;
      appCount?: number;
    }
  >;
  stats: {
    totalApps: number;
    syncedApps: number;
    totalRepos: number;
    syncedRepos: number;
    imagesSynced: number;
  };
}
