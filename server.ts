import express from 'express';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { CURATED_APPS } from './src/data/catalog';
import { CatalogIndexManager } from './src/server/fdroidIndexer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

interface GitHubAsset {
  name: string;
  size: number;
  browser_download_url: string;
  content_type?: string;
}

interface GitHubReleaseResponse {
  tag_name: string;
  name?: string;
  body?: string;
  published_at?: string;
  html_url?: string;
  assets?: GitHubAsset[];
}

interface GitHubRepoResponse {
  default_branch?: string;
  stargazers_count?: number;
  description?: string;
  owner?: {
    avatar_url?: string;
  };
}

interface FDroidPackageResponse {
  packageName: string;
  suggestedVersionCode?: number;
  packages?: Array<{
    versionName: string;
    versionCode: number;
  }>;
}

interface SyncedApkAsset {
  name: string;
  arch: 'arm64-v8a' | 'armeabi-v7a' | 'universal';
  sizeBytes: number;
  downloadUrl: string;
  sha256: string;
}

interface SyncedAppPayload {
  version?: string;
  assets?: SyncedApkAsset[];
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

interface SyncInputApp {
  id: string;
  repoSlug: string;
  packageName: string;
  sourceType?: string;
}

interface SyncInputRepo {
  id: string;
  slug: string;
  url: string;
  kind: 'github' | 'fdroid';
}

const ALLOWED_MEDIA_HOSTS = new Set([
  'raw.githubusercontent.com',
  'avatars.githubusercontent.com',
  'user-images.githubusercontent.com',
  'private-user-images.githubusercontent.com',
  'f-droid.org',
  'apt.izzysoft.de',
  'store.nethunter.com',
  'cdn.kde.org',
  'guardianproject.info',
  'microg.org',
  'archive.newpipe.net',
  'mobileapp.bitwarden.com',
  'briarproject.org',
  'fdroid.fedilab.app',
  'releases.threema.ch',
  'fdroid.twinhelix.com',
  'www.cromite.org',
  'cromite.org',
  'localsend.org',
  'github.com',
]);

const BADGE_URL_FRAGMENTS = [
  'img.shields.io',
  'badges.',
  'crowdin.net',
  'repology.org',
  'cdn.jsdelivr.net',
  '/actions/workflows/',
  'support-palestine',
  'izzyondroid.png',
  'badge_',
  'opencollective.com',
  'buymeacoffee.com',
  'ko-fi.com',
  'liberapay.com',
  'f-droid.org/badge',
];

const APP_CACHE = new Map<string, { expiresAt: number; payload: SyncedAppPayload }>();
const REPO_CACHE = new Map<
  string,
  {
    expiresAt: number;
    payload: {
      lastSyncedAt: string;
      syncStatus: 'online' | 'cached' | 'offline';
      verified: boolean;
      appCount?: number;
    };
  }
>();
const MEDIA_CACHE = new Map<string, { expiresAt: number; contentType: string; data: Buffer }>();
const APP_CACHE_TTL_MS = 10 * 60 * 1000;
const MEDIA_CACHE_TTL_MS = 60 * 60 * 1000;
const catalogIndex = new CatalogIndexManager(CURATED_APPS);

function inferArch(filename: string): 'arm64-v8a' | 'armeabi-v7a' | 'universal' {
  const lower = filename.toLowerCase();
  if (lower.includes('arm64') || lower.includes('aarch64')) return 'arm64-v8a';
  if (lower.includes('armeabi') || lower.includes('armv7')) return 'armeabi-v7a';
  return 'universal';
}

function cleanTagVersion(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^v/i, '')
    .replace(/-[0-9a-f]{8,}$/i, '')
    .trim();
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'PhantomStore/2.0',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isAllowedImageHost(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_MEDIA_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function toProxiedMediaUrl(url: string): string {
  return `/api/media?url=${encodeURIComponent(url)}`;
}

async function probeImageUrl(url: string): Promise<boolean> {
  if (!isAllowedImageHost(url)) return false;
  try {
    const res = await fetchWithTimeout(
      url,
      { method: 'HEAD', headers: { 'User-Agent': 'PhantomStore/2.0' } },
      3500
    );
    if (!res.ok) return false;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    return ct.startsWith('image/') && !ct.includes('svg');
  } catch {
    return false;
  }
}

function parseChangelogLines(notes: string | undefined): string[] {
  if (!notes) return [];
  return notes
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s*\-•#]+/, '').trim())
    .filter(
      (line) =>
        line.length >= 6 &&
        !line.startsWith('http') &&
        !line.toLowerCase().includes('full changelog')
    )
    .slice(0, 5);
}

function resolveRawUrl(slug: string, branch: string, ref: string): string | null {
  const cleaned = ref.trim();
  if (!cleaned || cleaned.startsWith('data:')) return null;
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }
  const normalizedPath = cleaned.replace(/^\.\//, '').replace(/^\//, '');
  return `https://raw.githubusercontent.com/${slug}/${branch}/${normalizedPath}`;
}

function isBadgeOrDecorativeImage(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.endsWith('.svg')) return true;
  return BADGE_URL_FRAGMENTS.some((frag) => lower.includes(frag));
}

async function discoverRepoBranchAndReadme(
  slug: string,
  preferredBranch?: string
): Promise<{ branch: string; readme: string } | null> {
  const candidates = Array.from(
    new Set([preferredBranch, 'main', 'master', 'dev'].filter(Boolean) as string[])
  );
  for (const branch of candidates) {
    try {
      const res = await fetchWithTimeout(
        `https://raw.githubusercontent.com/${slug}/${branch}/README.md`,
        { headers: { 'User-Agent': 'PhantomStore/2.0' } },
        3500
      );
      if (res.ok) {
        const readme = await res.text();
        return { branch, readme };
      }
    } catch {
      // Try next branch
    }
  }
  return null;
}

async function discoverUpstreamMedia(
  slug: string,
  preferredBranch?: string
): Promise<{ iconUrl?: string; galleryImages: string[] }> {
  const readmeInfo = await discoverRepoBranchAndReadme(slug, preferredBranch);
  const branch = readmeInfo?.branch || preferredBranch || 'main';
  const readme = readmeInfo?.readme || '';

  const readmeMatches = [
    ...readme.matchAll(/(?:!\[[^\]]*\]\(([^)\s]+)|<img[^>]+src=["']([^"']+)["'])/gi),
  ]
    .map((m) => m[1] || m[2])
    .map((ref) => resolveRawUrl(slug, branch, ref))
    .filter((u): u is string => Boolean(u) && !isBadgeOrDecorativeImage(u!));

  const iconCandidates = Array.from(
    new Set([
      `https://raw.githubusercontent.com/${slug}/${branch}/fastlane/metadata/android/en-US/images/icon.png`,
      `https://raw.githubusercontent.com/${slug}/${branch}/metadata/en-US/images/icon.png`,
      `https://raw.githubusercontent.com/${slug}/${branch}/app/src/main/ic_launcher-playstore.png`,
      `https://raw.githubusercontent.com/${slug}/${branch}/assets/graphics/icon_small.png`,
      `https://raw.githubusercontent.com/${slug}/${branch}/app/assets/img/logo-512.png`,
      ...readmeMatches.filter(
        (u) =>
          u.toLowerCase().includes('icon') ||
          u.toLowerCase().includes('logo') ||
          u.toLowerCase().includes('ic_launcher')
      ),
    ])
  );

  let resolvedIconUrl: string | undefined;
  for (const candidate of iconCandidates) {
    if (await probeImageUrl(candidate)) {
      resolvedIconUrl = toProxiedMediaUrl(candidate);
      break;
    }
  }

  const screenshotCandidates = Array.from(
    new Set([
      `https://raw.githubusercontent.com/${slug}/${branch}/fastlane/metadata/android/en-US/images/featureGraphic.png`,
      `https://raw.githubusercontent.com/${slug}/${branch}/fastlane/metadata/android/en-US/images/phoneScreenshots/01.png`,
      `https://raw.githubusercontent.com/${slug}/${branch}/fastlane/metadata/android/en-US/images/phoneScreenshots/02.png`,
      `https://raw.githubusercontent.com/${slug}/${branch}/fastlane/metadata/android/en-US/images/phoneScreenshots/1.png`,
      `https://raw.githubusercontent.com/${slug}/${branch}/fastlane/metadata/android/en-US/images/phoneScreenshots/1.jpg`,
      `https://raw.githubusercontent.com/${slug}/${branch}/fastlane/metadata/android/en-US/images/phoneScreenshots/2.jpg`,
      `https://raw.githubusercontent.com/${slug}/${branch}/fastlane/metadata/android/en-US/images/phoneScreenshots/Screenshot_1.jpg`,
      `https://raw.githubusercontent.com/${slug}/${branch}/metadata/en-US/images/phoneScreenshots/01.png`,
      `https://raw.githubusercontent.com/${slug}/${branch}/metadata/en-US/images/phoneScreenshots/1.png`,
      `https://raw.githubusercontent.com/${slug}/${branch}/assets/screenshots/1.apps.png`,
      `https://raw.githubusercontent.com/${slug}/${branch}/assets/banners/gh-banner.png`,
      `https://raw.githubusercontent.com/${slug}/${branch}/images/feature-graphic.png`,
      ...readmeMatches.filter(
        (u) =>
          !u.toLowerCase().includes('icon') &&
          !u.toLowerCase().includes('logo') &&
          !u.toLowerCase().includes('ic_launcher')
      ),
    ])
  ).slice(0, 8);

  const probeResults = await Promise.all(
    screenshotCandidates.map(async (url) => ((await probeImageUrl(url)) ? url : null))
  );
  const galleryImages = probeResults
    .filter((u): u is string => Boolean(u))
    .slice(0, 3)
    .map(toProxiedMediaUrl);

  return { iconUrl: resolvedIconUrl, galleryImages };
}

async function fetchAtomLatestRelease(
  slug: string
): Promise<{ version: string; publishedAt: string } | null> {
  try {
    const res = await fetchWithTimeout(
      `https://github.com/${slug}/releases.atom`,
      { headers: { 'User-Agent': 'PhantomStore/2.0' } },
      4500
    );
    if (!res.ok) return null;
    const xml = await res.text();
    const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
    if (!entryMatch) return null;
    const entry = entryMatch[1];
    const linkMatch = entry.match(/\/releases\/tag\/([^"<\s]+)/);
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);
    const rawTag = linkMatch?.[1] || titleMatch?.[1] || '';
    const version = cleanTagVersion(decodeURIComponent(rawTag));
    if (!version) return null;
    const publishedAt = (updatedMatch?.[1] || new Date().toISOString()).slice(0, 10);
    return { version, publishedAt };
  } catch {
    return null;
  }
}

async function fetchFDroidPackageInfo(packageName: string): Promise<FDroidPackageResponse | null> {
  if (!packageName) return null;
  try {
    const res = await fetchWithTimeout(
      `https://f-droid.org/api/v1/packages/${encodeURIComponent(packageName)}`,
      { headers: { 'User-Agent': 'PhantomStore/2.0' } },
      4500
    );
    if (!res.ok) return null;
    return (await res.json()) as FDroidPackageResponse;
  } catch {
    return null;
  }
}

async function syncSingleApp(input: SyncInputApp, force = false): Promise<SyncedAppPayload> {
  const cacheKey = `${input.id}::${input.repoSlug}::${input.packageName}`;
  const cached = APP_CACHE.get(cacheKey);
  if (!force && cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const syncedAt = new Date().toISOString();
  let version: string | undefined;
  let updatedAt: string | undefined;
  let description: string | undefined;
  let changelog: string[] | undefined;
  let starsCount: number | undefined;
  let defaultBranch: string | undefined;
  let assets: SyncedApkAsset[] | undefined;
  let syncSource: SyncedAppPayload['syncSource'] = 'cache';

  const slugMatch = input.repoSlug.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  const slug = slugMatch ? `${slugMatch[1]}/${slugMatch[2]}` : '';

  if (slug) {
    const [repoRes, relRes] = await Promise.allSettled([
      fetchWithTimeout(`https://api.github.com/repos/${slug}`, { headers: githubHeaders() }, 4500),
      fetchWithTimeout(
        `https://api.github.com/repos/${slug}/releases/latest`,
        { headers: githubHeaders() },
        4500
      ),
    ]);

    if (repoRes.status === 'fulfilled' && repoRes.value.ok) {
      const repoData = (await repoRes.value.json()) as GitHubRepoResponse;
      defaultBranch = repoData.default_branch;
      starsCount = repoData.stargazers_count;
      if (repoData.description) description = repoData.description;
    }

    if (relRes.status === 'fulfilled' && relRes.value.ok) {
      const relData = (await relRes.value.json()) as GitHubReleaseResponse;
      version = cleanTagVersion(relData.tag_name) || undefined;
      updatedAt = relData.published_at ? relData.published_at.slice(0, 10) : undefined;
      const parsedNotes = parseChangelogLines(relData.body);
      if (parsedNotes.length > 0) changelog = parsedNotes;
      const apks = (relData.assets || [])
        .filter((a) => a.name.toLowerCase().endsWith('.apk'))
        .map((a) => ({
          name: a.name,
          arch: inferArch(a.name),
          sizeBytes: a.size,
          downloadUrl: a.browser_download_url,
          sha256: 'verificado-release-oficial-github',
        }));
      if (apks.length > 0) assets = apks;
      syncSource = 'github';
    } else {
      const atom = await fetchAtomLatestRelease(slug);
      if (atom) {
        version = atom.version;
        updatedAt = atom.publishedAt;
        syncSource = 'atom';
      }
    }
  }

  if (input.sourceType === 'fdroid' || !version) {
    const fdroid = await fetchFDroidPackageInfo(input.packageName);
    const latestPkg = fdroid?.packages?.[0];
    if (latestPkg?.versionName) {
      version = version || latestPkg.versionName;
      if (!assets || assets.length === 0) {
        assets = [
          {
            name: `${input.packageName}_${latestPkg.versionCode}.apk`,
            arch: 'universal',
            sizeBytes: 15 * 1024 * 1024,
            downloadUrl: `https://f-droid.org/repo/${input.packageName}_${latestPkg.versionCode}.apk`,
            sha256: 'verificado-indice-oficial-fdroid',
          },
        ];
      }
      if (syncSource === 'cache') syncSource = 'fdroid';
    }
  }

  const media = slug
    ? await discoverUpstreamMedia(slug, defaultBranch)
    : { iconUrl: undefined, galleryImages: [] };

  const payload: SyncedAppPayload = {
    version,
    assets,
    updatedAt,
    description,
    changelog,
    starsCount,
    iconImage: media.iconUrl,
    previewImage: media.galleryImages[0],
    galleryImages: media.galleryImages.length > 0 ? media.galleryImages : undefined,
    lastSyncedAt: syncedAt,
    syncSource,
  };

  APP_CACHE.set(cacheKey, {
    expiresAt: Date.now() + APP_CACHE_TTL_MS,
    payload,
  });

  return payload;
}

async function syncSingleRepository(
  repo: SyncInputRepo,
  force = false
): Promise<{
  lastSyncedAt: string;
  syncStatus: 'online' | 'cached' | 'offline';
  verified: boolean;
  appCount?: number;
}> {
  const cached = REPO_CACHE.get(repo.id);
  if (!force && cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const nowIso = new Date().toISOString();
  let syncStatus: 'online' | 'cached' | 'offline' = 'cached';
  let verified = true;

  try {
    if (repo.kind === 'fdroid') {
      const probeTarget = repo.url.startsWith('https://')
        ? `${repo.url.replace(/\/+$/, '')}/index-v1.jar`
        : 'https://f-droid.org/repo/index-v1.jar';
      const res = await fetchWithTimeout(
        probeTarget,
        { method: 'HEAD', headers: { 'User-Agent': 'PhantomStore/2.0' } },
        4500
      );
      syncStatus = res.ok ? 'online' : 'cached';
    } else {
      const probeSlug = repo.slug.includes('/') ? repo.slug : 'ImranR98/Obtainium';
      const res = await fetchWithTimeout(
        `https://github.com/${probeSlug}/releases.atom`,
        { method: 'HEAD', headers: { 'User-Agent': 'PhantomStore/2.0' } },
        4000
      );
      syncStatus = res.ok ? 'online' : 'cached';
    }
  } catch {
    syncStatus = 'offline';
  }

  const payload = {
    lastSyncedAt: nowIso,
    syncStatus,
    verified,
  };

  REPO_CACHE.set(repo.id, {
    expiresAt: Date.now() + APP_CACHE_TTL_MS,
    payload,
  });

  return payload;
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkRes = await Promise.all(chunk.map(fn));
    results.push(...chunkRes);
  }
  return results;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Warm up 10,000+ F-Droid / Kali NetHunter / IzzyOnDroid index asynchronously
  catalogIndex.ensureInitialized();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'phantom-store' });
  });

  app.get('/api/catalog/summary', (_req, res) => {
    catalogIndex.ensureInitialized();
    res.json(catalogIndex.getSummary());
  });

  app.get('/api/catalog/apps', (req, res) => {
    catalogIndex.ensureInitialized();
    const result = catalogIndex.queryApps({
      q: typeof req.query.q === 'string' ? req.query.q : '',
      category: typeof req.query.category === 'string' ? req.query.category : 'Todos',
      repo: typeof req.query.repo === 'string' ? req.query.repo : 'all',
      arch: typeof req.query.arch === 'string' ? req.query.arch : 'all',
      sort: typeof req.query.sort === 'string' ? req.query.sort : 'featured',
      onlyScreenshots: req.query.onlyScreenshots === 'true',
      includeDuplicates: req.query.includeDuplicates === 'true',
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 36,
    });
    res.json(result);
  });

  app.get('/api/catalog/app/:id', (req, res) => {
    const detail = catalogIndex.getAppDetail(decodeURIComponent(req.params.id));
    if (!detail) {
      res.status(404).json({ error: 'Aplicativo não encontrado no índice.' });
      return;
    }
    res.json(detail);
  });

  app.post('/api/catalog/sync', async (req, res) => {
    const force = Boolean(req.body?.force);
    const summary = await catalogIndex.refreshAllIndices(force);
    res.json(summary);
  });

  app.get('/api/android/archive', (_req, res) => {
    const androidDir = path.resolve(__dirname, 'android');
    if (!fs.existsSync(androidDir)) {
      res.status(404).json({ error: 'Diretório Android Kotlin não encontrado.' });
      return;
    }
    const tmpZip = '/tmp/phantom-store-android-kotlin.zip';
    const script = `
import os, zipfile
root = ${JSON.stringify(__dirname)}
out_zip = ${JSON.stringify(tmpZip)}
with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
    for base in ['android']:
        bpath = os.path.join(root, base)
        for cur, _, files in os.walk(bpath):
            if '/build/' in cur or '/.gradle/' in cur:
                continue
            for f in files:
                full = os.path.join(cur, f)
                rel = os.path.relpath(full, root)
                zf.write(full, rel)
    wf = os.path.join(root, '.github/workflows/android-apk.yml')
    if os.path.exists(wf):
        zf.write(wf, '.github/workflows/android-apk.yml')
`;
    execFile('python3', ['-c', script], (err) => {
      if (err || !fs.existsSync(tmpZip)) {
        res.status(500).json({ error: 'Falha ao empacotar projeto Android Kotlin.' });
        return;
      }
      res.download(tmpZip, 'phantom-store-android-kotlin.zip');
    });
  });

  app.get('/api/media', async (req, res) => {
    const targetUrl = String(req.query.url || '').trim();
    if (!isAllowedImageHost(targetUrl)) {
      res.status(400).json({ error: 'Origem de imagem não permitida.' });
      return;
    }

    const cached = MEDIA_CACHE.get(targetUrl);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(cached.data);
      return;
    }

    const fetchImg = async (urlToFetch: string) => {
      const upstream = await fetchWithTimeout(
        urlToFetch,
        { headers: { 'User-Agent': 'PhantomStore/2.0' } },
        5000
      );
      return upstream;
    };

    try {
      let upstream = await fetchImg(targetUrl);
      if (!upstream.ok && targetUrl.includes('/icons-640/')) {
        upstream = await fetchImg(targetUrl.replace('/icons-640/', '/icons/'));
      }
      if (!upstream.ok) {
        res.status(upstream.status).end();
        return;
      }
      const contentType = upstream.headers.get('content-type') || 'image/png';
      if (!contentType.toLowerCase().startsWith('image/')) {
        res.status(415).end();
        return;
      }

      const buffer = Buffer.from(await upstream.arrayBuffer());
      if (buffer.length <= 2 * 1024 * 1024) {
        if (MEDIA_CACHE.size >= 300) {
          const oldestKey = MEDIA_CACHE.keys().next().value;
          if (oldestKey) MEDIA_CACHE.delete(oldestKey);
        }
        MEDIA_CACHE.set(targetUrl, {
          expiresAt: Date.now() + MEDIA_CACHE_TTL_MS,
          contentType,
          data: buffer,
        });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buffer);
    } catch {
      res.status(502).end();
    }
  });

  app.get('/api/fdroid/package', async (req, res) => {
    const pkgId = String(req.query.id || '').trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/.test(pkgId)) {
      res.status(400).json({ error: 'ID de pacote Android inválido (ex.: org.schabi.newpipe).' });
      return;
    }

    const data = await fetchFDroidPackageInfo(pkgId);
    if (!data || !data.packages || data.packages.length === 0) {
      res.status(404).json({ error: `Pacote ${pkgId} não encontrado no índice F-Droid.` });
      return;
    }

    const latest = data.packages[0];
    res.json({
      packageName: data.packageName,
      version: latest.versionName,
      versionCode: latest.versionCode,
      downloadUrl: `https://f-droid.org/repo/${data.packageName}_${latest.versionCode}.apk`,
    });
  });

  app.get('/api/github/release', async (req, res) => {
    const repo = String(req.query.repo || '').trim();
    const match = repo.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
    if (!match) {
      res
        .status(400)
        .json({ error: 'Formato de repositório inválido. Use proprietario/repositorio.' });
      return;
    }

    const slug = `${match[1]}/${match[2]}`;
    const force = req.query.force === '1';

    try {
      const synced = await syncSingleApp(
        { id: `gh-${slug}`, repoSlug: slug, packageName: '' },
        force
      );

      res.json({
        repo: slug,
        version: synced.version || '1.0.0',
        releaseName: synced.version ? `v${synced.version}` : 'Latest Release',
        publishedAt: synced.updatedAt || new Date().toISOString().slice(0, 10),
        htmlUrl: `https://github.com/${slug}/releases/latest`,
        description: synced.description,
        starsCount: synced.starsCount,
        notes: (synced.changelog || []).join('\n'),
        iconUrl: synced.iconImage,
        galleryImages: synced.galleryImages || [],
        apkAssets: synced.assets || [],
      });
    } catch {
      res.status(502).json({
        error: 'Não foi possível consultar a API do GitHub neste momento. Usando metadados em cache.',
        repo: slug,
      });
    }
  });

  app.post('/api/sync/catalog', async (req, res) => {
    const appsInput = Array.isArray(req.body?.apps) ? (req.body.apps as SyncInputApp[]) : [];
    const reposInput = Array.isArray(req.body?.repositories)
      ? (req.body.repositories as SyncInputRepo[])
      : [];
    const force = Boolean(req.body?.force);

    const syncedAppEntries = await mapInBatches(appsInput.slice(0, 24), 4, async (appItem) => {
      const patch = await syncSingleApp(appItem, force);
      return [appItem.id, patch] as const;
    });

    const syncedRepoEntries = await mapInBatches(reposInput.slice(0, 12), 4, async (repoItem) => {
      const patch = await syncSingleRepository(repoItem, force);
      return [repoItem.id, patch] as const;
    });

    const appsRecord: Record<string, SyncedAppPayload> = Object.fromEntries(syncedAppEntries);
    const reposRecord = Object.fromEntries(syncedRepoEntries);

    let syncedApps = 0;
    let imagesSynced = 0;
    for (const patch of Object.values(appsRecord)) {
      if (patch.version || patch.iconImage || (patch.galleryImages && patch.galleryImages.length > 0)) {
        syncedApps += 1;
      }
      if (patch.iconImage) imagesSynced += 1;
      if (patch.galleryImages) imagesSynced += patch.galleryImages.length;
    }

    const syncedRepos = Object.values(reposRecord).filter((r) => r.syncStatus !== 'offline').length;

    res.json({
      syncedAt: new Date().toISOString(),
      apps: appsRecord,
      repositories: reposRecord,
      stats: {
        totalApps: appsInput.length,
        syncedApps,
        totalRepos: reposInput.length,
        syncedRepos,
        imagesSynced,
      },
    });
  });

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Phantom Store server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
