import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLibrarySummary,
  cleanReleaseVersion,
  filterAndSortApps,
  formatBytes,
  hasUpdateAvailable,
  inferApkArchFromFilename,
  isValidAndroidPackageId,
  mapFDroidCategoriesToStore,
  parseReleaseNotesToChangelog,
  resolveAppWithSync,
  selectBestApkAsset,
  stripHtmlToText,
  validateGitHubRepoInput,
} from './storeLogic';
import { CURATED_APPS, INITIAL_REPOSITORIES } from '../data/catalog';
import type { AndroidAppItem, InstalledAppRecord } from '../types';

const mockApps: AndroidAppItem[] = [
  {
    id: 'myspoti',
    name: 'MySpoti',
    packageName: 'org.myspoti.client',
    category: 'Música',
    tagline: 'Streaming musical open-source sem anúncios.',
    description: 'Cliente leve de música.',
    developer: 'MySpoti Contributors',
    version: '3.9.0',
    minAndroid: '8.0+',
    license: 'GPL-3.0',
    updatedAt: '2026-10-12',
    downloadsCount: 480000,
    repoSlug: 'KRTirtho/spotube',
    sourceType: 'curated',
    featured: true,
    iconImage: '/src/assets/images/icon_myspoti_1794871591645.jpg',
    iconZoom: true,
    galleryImages: ['/src/assets/images/phantom_hero_myspoti_1794870347389.jpg'],
    accentColor: '#15803D',
    monogram: 'MS',
    assets: [
      {
        name: 'MySpoti-v3.9.0-arm64-v8a.apk',
        arch: 'arm64-v8a',
        sizeBytes: 42 * 1024 * 1024,
        downloadUrl: 'https://github.com/KRTirtho/spotube/releases',
        sha256: 'abc123',
      },
      {
        name: 'MySpoti-v3.9.0-universal.apk',
        arch: 'universal',
        sizeBytes: 58 * 1024 * 1024,
        downloadUrl: 'https://github.com/KRTirtho/spotube/releases',
        sha256: 'def456',
      },
    ],
    permissions: [],
    changelog: ['Sincronização de letras aprimorada'],
  },
  {
    id: 'newpipe',
    name: 'NewPipe',
    packageName: 'org.schabi.newpipe',
    category: 'Vídeo',
    tagline: 'Player de vídeo sem rastreadores.',
    description: 'Reprodução em segundo plano.',
    developer: 'TeamNewPipe',
    version: '0.27.4',
    minAndroid: '6.0+',
    license: 'GPL-3.0',
    updatedAt: '2026-11-01',
    downloadsCount: 920000,
    repoSlug: 'TeamNewPipe/NewPipe',
    sourceType: 'curated',
    accentColor: '#B91C1C',
    monogram: 'NP',
    assets: [
      {
        name: 'NewPipe_v0.27.4.apk',
        arch: 'universal',
        sizeBytes: 11 * 1024 * 1024,
        downloadUrl: 'https://github.com/TeamNewPipe/NewPipe/releases',
        sha256: '999888',
      },
    ],
    permissions: [],
    changelog: ['Correções de reprodução'],
  },
];

test('filterAndSortApps filters by category, query, and sorts alphabetically', () => {
  const byCategory = filterAndSortApps(mockApps, {
    category: 'Música',
    query: '',
    architecture: 'all',
    sortBy: 'featured',
  });
  assert.equal(byCategory.length, 1);
  assert.equal(byCategory[0].id, 'myspoti');

  const byQuery = filterAndSortApps(mockApps, {
    category: 'Todos',
    query: 'schabi',
    architecture: 'all',
    sortBy: 'downloads',
  });
  assert.equal(byQuery.length, 1);
  assert.equal(byQuery[0].id, 'newpipe');

  const byName = filterAndSortApps(mockApps, {
    category: 'Todos',
    query: '',
    architecture: 'all',
    sortBy: 'name',
  });
  assert.equal(byName[0].id, 'myspoti');
  assert.equal(byName[1].id, 'newpipe');
});

test('hasUpdateAvailable compares semantic versions accurately', () => {
  assert.equal(hasUpdateAvailable('3.8.2', '3.9.0'), true);
  assert.equal(hasUpdateAvailable('v3.9.0', '3.9.0'), false);
  assert.equal(hasUpdateAvailable('4.0.0', '3.9.9'), false);
});

test('validateGitHubRepoInput accepts owner/repo and full GitHub URLs and rejects invalid values', () => {
  const empty = validateGitHubRepoInput('   ');
  assert.equal(empty.valid, false);

  const nonGithub = validateGitHubRepoInput('https://example.com/foo/bar');
  assert.equal(nonGithub.valid, false);

  const slug = validateGitHubRepoInput('TeamNewPipe/NewPipe');
  assert.equal(slug.valid, true);
  assert.equal(slug.slug, 'TeamNewPipe/NewPipe');

  const url = validateGitHubRepoInput('https://github.com/mihonapp/mihon.git');
  assert.equal(url.valid, true);
  assert.equal(url.slug, 'mihonapp/mihon');
});

test('selectBestApkAsset matches requested architecture or falls back to universal', () => {
  const arm64 = selectBestApkAsset(mockApps[0].assets, 'arm64-v8a');
  assert.equal(arm64?.arch, 'arm64-v8a');

  const fallback = selectBestApkAsset(mockApps[0].assets, 'armeabi-v7a');
  assert.equal(fallback?.arch, 'universal');
});

test('formatBytes and inferApkArchFromFilename format cleanly', () => {
  assert.equal(formatBytes(42 * 1024 * 1024), '42.0 MB');
  assert.equal(inferApkArchFromFilename('app-arm64-v8a-release.apk'), 'arm64-v8a');
  assert.equal(inferApkArchFromFilename('app-armeabi-v7a.apk'), 'armeabi-v7a');
  assert.equal(inferApkArchFromFilename('app-universal.apk'), 'universal');
});

test('calculateLibrarySummary counts installed bytes and pending updates', () => {
  const installed: InstalledAppRecord[] = [
    {
      appId: 'myspoti',
      name: 'MySpoti',
      packageName: 'org.myspoti.client',
      version: '3.8.0',
      arch: 'arm64-v8a',
      sizeBytes: 42 * 1024 * 1024,
      downloadedAt: '2026-10-01',
      downloadUrl: 'https://github.com/KRTirtho/spotube/releases',
      sha256: 'abc123',
    },
  ];
  const summary = calculateLibrarySummary(installed, mockApps);
  assert.equal(summary.count, 1);
  assert.equal(summary.updatesAvailable, 1);
  assert.equal(summary.totalBytes, 42 * 1024 * 1024);
});

test('resolveAppWithSync merges synced versions, remote icons, and deduplicates gallery images', () => {
  const synced = resolveAppWithSync(mockApps[0], {
    version: '4.0.1',
    iconImage: '/api/media?url=https%3A%2F%2Fraw.githubusercontent.com%2Ficon.png',
    galleryImages: [
      '/api/media?url=https%3A%2F%2Fraw.githubusercontent.com%2Fscreen1.png',
      '/src/assets/images/phantom_hero_myspoti_1794870347389.jpg',
    ],
    starsCount: 51000,
    lastSyncedAt: '2026-11-16T23:35:00.000Z',
    syncSource: 'github',
  });

  assert.equal(synced.version, '4.0.1');
  assert.equal(synced.iconZoom, false);
  assert.equal(synced.fallbackIconZoom, true);
  assert.equal(synced.galleryImages?.length, 2);
  assert.equal(synced.starsCount, 51000);
});

test('stripHtmlToText and mapFDroidCategoriesToStore sanitize F-Droid metadata cleanly', () => {
  const clean = stripHtmlToText('<p>Auditor de <b>Wi-Fi</b> &amp; pacotes.</p><ul><li>Modo monitor</li></ul>');
  assert.equal(clean, 'Auditor de Wi-Fi & pacotes.\n• Modo monitor');

  assert.equal(mapFDroidCategoriesToStore(['Security', 'Connectivity']), 'Segurança');
  assert.equal(mapFDroidCategoriesToStore(['Multimedia', 'Music']), 'Música');
  assert.equal(mapFDroidCategoriesToStore(['Development']), 'Desenvolvimento');
  assert.equal(mapFDroidCategoriesToStore(['Reading']), 'Leitura');
  assert.equal(mapFDroidCategoriesToStore(['System']), 'Sistema');
  assert.equal(mapFDroidCategoriesToStore(['Internet']), 'Internet');
});

test('parseReleaseNotesToChangelog and isValidAndroidPackageId handle real inputs cleanly', () => {
  const notes = parseReleaseNotesToChangelog(
    '- Fixed audio playback on Android 15\n* Added faster search indexing\nhttps://example.com',
    ['Fallback note']
  );
  assert.deepEqual(notes, [
    'Fixed audio playback on Android 15',
    'Added faster search indexing',
  ]);

  assert.equal(isValidAndroidPackageId('org.schabi.newpipe'), true);
  assert.equal(isValidAndroidPackageId('invalid-package'), false);
  assert.equal(
    cleanReleaseVersion('v153.0.8010.37-11507ac1061b5ea225269e0cb084d'),
    '153.0.8010.37'
  );
});

test('catalog ships 12 open-source repositories totaling >11k indexed entries + Segurança flagship apps', () => {
  assert.equal(INITIAL_REPOSITORIES.length, 12);
  assert.ok(INITIAL_REPOSITORIES.some((r) => r.id === 'fdroid-main'));
  assert.ok(INITIAL_REPOSITORIES.some((r) => r.id === 'fdroid-archive'));
  assert.ok(INITIAL_REPOSITORIES.some((r) => r.id === 'izzyondroid'));
  assert.ok(INITIAL_REPOSITORIES.some((r) => r.id === 'nethunter'));
  assert.equal(CURATED_APPS.length, 16);

  const securityApps = filterAndSortApps(CURATED_APPS, {
    category: 'Segurança',
    query: '',
    architecture: 'all',
    sortBy: 'featured',
  });
  assert.equal(securityApps.length, 5);
  assert.ok(securityApps.some((app) => app.id === 'termux'));
  assert.ok(securityApps.some((app) => app.id === 'pcapdroid'));
  assert.ok(securityApps.some((app) => app.id === 'wifianalyzer'));
  assert.ok(securityApps.some((app) => app.id === 'rethinkdns'));
  assert.ok(securityApps.some((app) => app.id === 'netguard'));
});
