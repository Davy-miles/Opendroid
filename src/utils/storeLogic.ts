import type {
  AndroidAppItem,
  AndroidArch,
  ApkAsset,
  AppCategory,
  AppSyncOverride,
  InstalledAppRecord,
  SortOption,
} from '../types';

export interface FilterCriteria {
  category: AppCategory;
  query: string;
  architecture: AndroidArch | 'all';
  sortBy: SortOption;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1000) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  if (mb < 1) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export function formatDownloadCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) return '0';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}K`;
  return String(count);
}

export function cleanReleaseVersion(rawVersion: string): string {
  const withoutPrefix = rawVersion.trim().replace(/^v/i, '');
  return withoutPrefix.replace(/-[0-9a-f]{8,}$/i, '').trim();
}

export function parseSemver(version: string): number[] {
  const cleaned = cleanReleaseVersion(version).split('-')[0];
  return cleaned.split('.').map((part) => {
    const n = Number.parseInt(part.replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  });
}

export function hasUpdateAvailable(installedVersion: string, latestVersion: string): boolean {
  const a = parseSemver(installedVersion);
  const b = parseSemver(latestVersion);
  const maxLen = Math.max(a.length, b.length, 3);
  for (let i = 0; i < maxLen; i++) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    if (vb > va) return true;
    if (vb < va) return false;
  }
  return false;
}

export function selectBestApkAsset(
  assets: ApkAsset[],
  preferredArch: AndroidArch
): ApkAsset | undefined {
  if (assets.length === 0) return undefined;
  return (
    assets.find((asset) => asset.arch === preferredArch) ??
    assets.find((asset) => asset.arch === 'universal') ??
    assets[0]
  );
}

export function stripHtmlToText(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function mapFDroidCategoriesToStore(
  rawCategories: string[]
): Exclude<AppCategory, 'Todos'> {
  const joined = rawCategories.join(' ').toLowerCase();
  if (
    joined.includes('security') ||
    joined.includes('password') ||
    joined.includes('two-factor') ||
    joined.includes('firewall') ||
    joined.includes('nethunter') ||
    joined.includes('pentest')
  ) {
    return 'Segurança';
  }
  if (
    joined.includes('privacy') ||
    joined.includes('guardian') ||
    joined.includes('tor') ||
    joined.includes('vpn')
  ) {
    return 'Privacidade';
  }
  if (
    joined.includes('music') ||
    joined.includes('audio') ||
    joined.includes('podcast') ||
    joined.includes('radio') ||
    joined.includes('audiobook')
  ) {
    return 'Música';
  }
  if (
    joined.includes('video') ||
    joined.includes('multimedia') ||
    joined.includes('camera') ||
    joined.includes('graphics') ||
    joined.includes('photo')
  ) {
    return 'Vídeo';
  }
  if (
    joined.includes('internet') ||
    joined.includes('browser') ||
    joined.includes('connectivity') ||
    joined.includes('messaging') ||
    joined.includes('email') ||
    joined.includes('network')
  ) {
    return 'Internet';
  }
  if (
    joined.includes('development') ||
    joined.includes('terminal') ||
    joined.includes('code') ||
    joined.includes('git')
  ) {
    return 'Desenvolvimento';
  }
  if (
    joined.includes('reading') ||
    joined.includes('book') ||
    joined.includes('news') ||
    joined.includes('wiki') ||
    joined.includes('science & education') ||
    joined.includes('writing')
  ) {
    return 'Leitura';
  }
  if (
    joined.includes('system') ||
    joined.includes('launcher') ||
    joined.includes('keyboard') ||
    joined.includes('battery') ||
    joined.includes('app manager') ||
    joined.includes('app store')
  ) {
    return 'Sistema';
  }
  return 'Utilitários';
}

export function filterAndSortApps(
  apps: AndroidAppItem[],
  criteria: FilterCriteria
): AndroidAppItem[] {
  const normalizedQuery = criteria.query.trim().toLowerCase();

  const filtered = apps.filter((app) => {
    if (criteria.category !== 'Todos' && app.category !== criteria.category) {
      return false;
    }
    if (
      criteria.architecture !== 'all' &&
      !app.assets.some(
        (asset) => asset.arch === criteria.architecture || asset.arch === 'universal'
      )
    ) {
      return false;
    }
    if (!normalizedQuery) return true;
    return (
      app.name.toLowerCase().includes(normalizedQuery) ||
      app.tagline.toLowerCase().includes(normalizedQuery) ||
      app.packageName.toLowerCase().includes(normalizedQuery) ||
      app.developer.toLowerCase().includes(normalizedQuery) ||
      app.category.toLowerCase().includes(normalizedQuery) ||
      (app.rawCategories || []).some((cat) => cat.toLowerCase().includes(normalizedQuery))
    );
  });

  return [...filtered].sort((a, b) => {
    switch (criteria.sortBy) {
      case 'downloads':
        return b.downloadsCount - a.downloadsCount;
      case 'recent':
        return b.updatedAt.localeCompare(a.updatedAt);
      case 'name':
        return a.name.localeCompare(b.name, 'pt-BR');
      case 'size': {
        const sizeA = a.assets[0]?.sizeBytes ?? 0;
        const sizeB = b.assets[0]?.sizeBytes ?? 0;
        return sizeA - sizeB;
      }
      case 'featured':
      default: {
        if (Boolean(a.featured) !== Boolean(b.featured)) {
          return a.featured ? -1 : 1;
        }
        return b.downloadsCount - a.downloadsCount;
      }
    }
  });
}

export interface RepoValidationResult {
  valid: boolean;
  slug?: string;
  url?: string;
  error?: string;
}

export function validateGitHubRepoInput(rawInput: string): RepoValidationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Informe um repositório no formato proprietario/repositorio ou URL do GitHub.',
    };
  }

  let candidate = trimmed;
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    try {
      const parsed = new URL(candidate);
      if (!parsed.hostname.includes('github.com')) {
        return {
          valid: false,
          error: 'Use uma URL válida do GitHub (ex.: https://github.com/TeamNewPipe/NewPipe).',
        };
      }
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length < 2) {
        return {
          valid: false,
          error: 'URL incompleta. Inclua usuário e nome do repositório.',
        };
      }
      candidate = `${segments[0]}/${segments[1].replace(/\.git$/i, '')}`;
    } catch {
      return {
        valid: false,
        error: 'URL inválida. Verifique o endereço informado.',
      };
    }
  }

  const slugMatch = candidate.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (!slugMatch) {
    return {
      valid: false,
      error: 'Formato inválido. Use proprietario/repositorio (ex.: TeamNewPipe/NewPipe).',
    };
  }

  const slug = `${slugMatch[1]}/${slugMatch[2]}`;
  return {
    valid: true,
    slug,
    url: `https://github.com/${slug}`,
  };
}

export function isValidAndroidPackageId(raw: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/.test(raw.trim());
}

export function inferApkArchFromFilename(filename: string): AndroidArch {
  const lower = filename.toLowerCase();
  if (lower.includes('arm64') || lower.includes('aarch64')) return 'arm64-v8a';
  if (lower.includes('armeabi') || lower.includes('armv7')) return 'armeabi-v7a';
  return 'universal';
}

export function calculateLibrarySummary(
  installed: InstalledAppRecord[],
  catalog: AndroidAppItem[]
) {
  const totalBytes = installed.reduce((sum, item) => sum + item.sizeBytes, 0);
  let updatesAvailable = 0;
  for (const record of installed) {
    const match = catalog.find((app) => app.id === record.appId);
    if (match && hasUpdateAvailable(record.version, match.version)) {
      updatesAvailable += 1;
    }
  }
  return {
    count: installed.length,
    totalBytes,
    updatesAvailable,
  };
}

export function parseReleaseNotesToChangelog(notes: string | undefined, fallback: string[]): string[] {
  if (!notes || !notes.trim()) return fallback;
  const lines = notes
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s*\-•#]+/, '').trim())
    .filter((line) => line.length >= 6 && !line.startsWith('http') && !line.startsWith('**Full Changelog'))
    .slice(0, 5);
  return lines.length > 0 ? lines : fallback;
}

export function resolveAppWithSync(
  app: AndroidAppItem,
  override?: AppSyncOverride
): AndroidAppItem {
  if (!override) return app;

  const mergedGallery: string[] = [];
  const seen = new Set<string>();
  const addUnique = (url?: string) => {
    if (url && !seen.has(url)) {
      seen.add(url);
      mergedGallery.push(url);
    }
  };

  if (Array.isArray(override.galleryImages)) {
    for (const img of override.galleryImages) addUnique(img);
  }
  if (Array.isArray(app.galleryImages)) {
    for (const img of app.galleryImages) addUnique(img);
  }

  const syncedIcon = override.iconImage || app.iconImage;
  const hasRemoteIcon = Boolean(override.iconImage && override.iconImage !== app.iconImage);

  const cleanedOverrideVersion = override.version ? cleanReleaseVersion(override.version) : '';

  return {
    ...app,
    version: cleanedOverrideVersion || app.version,
    assets: override.assets && override.assets.length > 0 ? override.assets : app.assets,
    updatedAt: override.updatedAt || app.updatedAt,
    changelog:
      override.changelog && override.changelog.length > 0 ? override.changelog : app.changelog,
    starsCount: override.starsCount ?? app.starsCount,
    lastSyncedAt: override.lastSyncedAt || app.lastSyncedAt,
    fallbackIconImage: app.iconImage,
    fallbackIconZoom: app.iconZoom,
    iconImage: syncedIcon,
    iconZoom: hasRemoteIcon ? false : app.iconZoom,
    previewImage: override.previewImage || mergedGallery[0] || app.previewImage,
    galleryImages: mergedGallery.length > 0 ? mergedGallery : app.galleryImages,
  };
}

