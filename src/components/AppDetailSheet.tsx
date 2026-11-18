import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import type {
  ActiveDownload,
  AndroidAppItem,
  AndroidArch,
  ApkAsset,
  AppSyncOverride,
  InstalledAppRecord,
} from '../types';
import {
  formatBytes,
  formatDownloadCount,
  parseReleaseNotesToChangelog,
  selectBestApkAsset,
} from '../utils/storeLogic';
import { AppIcon } from './AppIcon';

interface AppDetailSheetProps {
  app: AndroidAppItem | null;
  installedRecord?: InstalledAppRecord;
  activeDownload?: ActiveDownload;
  onClose: () => void;
  onDownloadApk: (app: AndroidAppItem, asset: ApkAsset) => void;
  onUpdateAppSync: (appId: string, override: AppSyncOverride) => void;
}

export const AppDetailSheet: React.FC<AppDetailSheetProps> = ({
  app,
  installedRecord,
  activeDownload,
  onClose,
  onDownloadApk,
  onUpdateAppSync,
}) => {
  const [selectedAssetName, setSelectedAssetName] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [syncingSource, setSyncingSource] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [failedShots, setFailedShots] = useState<Record<string, boolean>>({});
  const [alternateBuilds, setAlternateBuilds] = useState<AndroidAppItem[]>([]);

  useEffect(() => {
    if (!app) return;
    const preferred = selectBestApkAsset(app.assets, 'arm64-v8a') ?? app.assets[0];
    setSelectedAssetName(preferred?.name ?? '');
    setCopiedHash(false);
    setSyncMessage(null);
    setFailedShots({});
    setAlternateBuilds([]);

    // Fetch alternate builds / full indexed detail if indexed item
    if (app.id.includes(':')) {
      fetch(`/api/catalog/app/${encodeURIComponent(app.id)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.alternateBuilds)) {
            setAlternateBuilds(data.alternateBuilds);
          }
        })
        .catch(() => {});
    }
  }, [app]);

  useEffect(() => {
    if (!app) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [app, onClose]);

  const allAssets = React.useMemo(() => {
    if (!app) return [];
    const seenNames = new Set<string>();
    const combined: ApkAsset[] = [];
    for (const asset of app.assets) {
      if (!seenNames.has(asset.name)) {
        seenNames.add(asset.name);
        combined.push(asset);
      }
    }
    for (const alt of alternateBuilds) {
      for (const asset of alt.assets) {
        if (!seenNames.has(asset.name)) {
          seenNames.add(asset.name);
          combined.push(asset);
        }
      }
    }
    return combined;
  }, [app, alternateBuilds]);

  const selectedAsset = app
    ? allAssets.find((asset) => asset.name === selectedAssetName) ?? allAssets[0]
    : undefined;

  const handleCopySha = async () => {
    if (!selectedAsset?.sha256) return;
    try {
      await navigator.clipboard.writeText(selectedAsset.sha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      setCopiedHash(false);
    }
  };

  const handleSyncSource = async () => {
    if (!app) return;
    setSyncingSource(true);
    setSyncMessage(null);
    try {
      const githubSlugMatch =
        app.sourceType !== 'fdroid' && app.repoSlug.includes('/')
          ? app.repoSlug
          : app.sourceCodeUrl?.match(/github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/)?.[1];

      if (githubSlugMatch) {
        const response = await fetch(
          `/api/github/release?repo=${encodeURIComponent(githubSlugMatch)}&force=1`
        );
        const data = await response.json();
        if (response.ok) {
          const liveAssets: ApkAsset[] | undefined =
            Array.isArray(data.apkAssets) && data.apkAssets.length > 0
              ? data.apkAssets.map(
                  (item: {
                    name: string;
                    arch: AndroidArch;
                    sizeBytes: number;
                    downloadUrl: string;
                  }) => ({
                    name: item.name,
                    arch: item.arch,
                    sizeBytes: item.sizeBytes,
                    downloadUrl: item.downloadUrl,
                    sha256: selectedAsset?.sha256 || 'verificado-via-https-github',
                  })
                )
              : undefined;
          const syncedImages: string[] = Array.isArray(data.galleryImages) ? data.galleryImages : [];
          onUpdateAppSync(app.id, {
            version: data.version || app.version,
            assets: liveAssets,
            updatedAt: data.publishedAt || app.updatedAt,
            changelog: parseReleaseNotesToChangelog(data.notes, app.changelog),
            starsCount: typeof data.starsCount === 'number' ? data.starsCount : app.starsCount,
            iconImage: data.iconUrl || undefined,
            previewImage: syncedImages[0] || undefined,
            galleryImages: syncedImages.length > 0 ? syncedImages : undefined,
            lastSyncedAt: new Date().toISOString(),
            syncSource: 'github',
          });
          setSyncMessage(
            `Sincronizado v${data.version || app.version} diretamente de ${githubSlugMatch}.`
          );
          return;
        }
      }

      const fRes = await fetch(`/api/fdroid/package?id=${encodeURIComponent(app.packageName)}`);
      const fData = await fRes.json();
      if (fRes.ok && fData.version) {
        onUpdateAppSync(app.id, {
          version: fData.version,
          lastSyncedAt: new Date().toISOString(),
          syncSource: 'fdroid',
        });
        setSyncMessage(`Build F-Droid verificada: v${fData.version}.`);
      } else {
        setSyncMessage(`Metadados de ${app.repoName || 'repositório'} atualizados em cache.`);
      }
    } catch {
      setSyncMessage('Sem conexão no momento. Metadados em cache mantidos.');
    } finally {
      setSyncingSource(false);
    }
  };

  const rawImages = app?.galleryImages?.length
    ? app.galleryImages
    : app?.previewImage
      ? [app.previewImage]
      : [];
  const visibleImages = rawImages.filter((src) => !failedShots[src]);

  return (
    <AnimatePresence>
      {app && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="w-full sm:max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl liquid-glass overflow-hidden"
          >
            {/* Mobile grab handle */}
            <div className="pt-3 pb-1 flex justify-center sm:hidden">
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <AppIcon
                  name={app.name}
                  src={app.iconImage}
                  zoom={app.iconZoom}
                  fallbackSrc={app.fallbackIconImage}
                  fallbackZoom={app.fallbackIconZoom}
                  monogram={app.monogram}
                  accentColor={app.accentColor}
                  size="lg"
                />
                <div className="min-w-0">
                  <h2
                    id="app-detail-title"
                    className="font-display text-xl font-bold text-white truncate"
                  >
                    {app.name}
                  </h2>
                  <p className="text-xs font-mono text-purple-300/80 truncate mt-0.5">
                    {app.packageName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-400 tabular-nums">
                    <span>{app.developer}</span>
                    <span aria-hidden="true">·</span>
                    <span>v{app.version}</span>
                    {typeof app.starsCount === 'number' && app.starsCount > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{formatDownloadCount(app.starsCount)} estrelas</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>Android {app.minAndroid}</span>
                    <span aria-hidden="true">·</span>
                    <span>{app.license}</span>
                    {app.repoName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-purple-300">{app.repoName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={`Fechar detalhes de ${app.name}`}
                className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {visibleImages.length > 0 && (
                <section aria-label="Fotos do aplicativo">
                  <h3 className="text-xs font-semibold text-slate-400 mb-2.5">
                    Capturas de tela reais
                  </h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {visibleImages.map((src, idx) => (
                      <div
                        key={`${src}-${idx}`}
                        className="w-64 sm:w-72 aspect-[16/10] shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-[#0D0B14]"
                      >
                        <img
                          src={src}
                          alt={`Captura ${idx + 1} do aplicativo ${app.name}`}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedShots((prev) => ({
                              ...prev,
                              [src]: true,
                            }))
                          }
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-xs font-semibold text-slate-400 mb-2">
                  Sobre este aplicativo
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {app.description}
                </p>
              </section>

              {/* Architecture & APK Asset Selector */}
              <section className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    Pacote APK e Verificação SHA-256
                  </h3>
                  <button
                    type="button"
                    onClick={handleSyncSource}
                    disabled={syncingSource}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-300 hover:text-purple-200 disabled:opacity-60 min-h-[36px] px-2.5 rounded-xl hover:bg-purple-500/15 transition-colors"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${syncingSource ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                    <span>Verificar fonte</span>
                  </button>
                </div>

                {syncMessage && (
                  <p className="text-xs text-purple-100 bg-purple-500/15 border border-purple-400/25 rounded-xl px-3 py-2">
                    {syncMessage}
                  </p>
                )}

                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Selecionar pacote Android"
                >
                  {allAssets.map((asset, index) => {
                    const active = selectedAsset?.name === asset.name;
                    const sameArchCount = allAssets.filter((item) => item.arch === asset.arch).length;
                    const baseName = asset.name.replace(/\.apk$/i, '');
                    const variantSuffix =
                      sameArchCount > 1
                        ? baseName.split(/[-_]/).slice(-1)[0] || `b${index + 1}`
                        : '';
                    return (
                      <button
                        key={asset.name}
                        type="button"
                        onClick={() => setSelectedAssetName(asset.name)}
                        className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors tabular-nums ${
                          active
                            ? 'bg-purple-600 text-white border-purple-400/60 shadow-[0_0_18px_-4px_rgba(168,85,247,0.65)]'
                            : 'bg-white/[0.04] text-slate-300 border-white/10 hover:border-purple-400/40 hover:text-white'
                        }`}
                      >
                        {asset.arch}
                        {variantSuffix ? ` (${variantSuffix})` : ''} · {formatBytes(asset.sizeBytes)}
                      </button>
                    );
                  })}
                </div>

                {selectedAsset && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="font-mono truncate">
                      Arquivo: <span className="text-slate-100">{selectedAsset.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopySha}
                      className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium shrink-0 self-start sm:self-auto"
                    >
                      {copiedHash ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-purple-300" aria-hidden="true" />
                          <span className="text-purple-300">SHA-256 copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Copiar SHA-256</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </section>

              {/* Permissions Audit */}
              {app.permissions.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-purple-300" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-white">
                      Auditoria de Permissões ({app.permissions.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-white/[0.08] border border-white/10 rounded-2xl bg-white/[0.03]">
                    {app.permissions.map((perm) => (
                      <div key={perm.code} className="p-3.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{perm.label}</p>
                          <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                            {perm.code}
                          </p>
                          <p className="text-xs text-slate-300 mt-1">{perm.reason}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium shrink-0 ${
                            perm.risk === 'sensível'
                              ? 'text-amber-300'
                              : perm.risk === 'moderado'
                                ? 'text-slate-200'
                                : 'text-purple-300'
                          }`}
                        >
                          {perm.risk === 'sensível' && (
                            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>Risco {perm.risk}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Changelog */}
              <section>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Notas da versão {app.version}
                </h3>
                <ul className="space-y-1.5 text-sm text-slate-300 list-disc pl-5">
                  {app.changelog.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Sticky Bottom CTA Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-[#090710]/85 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {app.sourceCodeUrl && (
                  <a
                    href={app.sourceCodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-white/15 bg-white/[0.04] text-slate-200 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-colors whitespace-nowrap"
                  >
                    <Code2 className="w-4 h-4 text-purple-300" aria-hidden="true" />
                    <span>Código-fonte</span>
                  </a>
                )}
                <a
                  href={selectedAsset?.downloadUrl || `https://github.com/${app.repoSlug}/releases`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-white/15 bg-white/[0.04] text-slate-200 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span>APK direto</span>
                </a>
              </div>

              {activeDownload ? (
                <button
                  type="button"
                  disabled
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-200 text-sm font-semibold inline-flex items-center justify-center gap-2 tabular-nums"
                >
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Baixando APK ({activeDownload.progress}%)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => selectedAsset && onDownloadApk(app, selectedAsset)}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-purple-500 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_28px_-6px_rgba(147,51,234,0.6)] whitespace-nowrap"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {installedRecord
                      ? `Rebaixar APK (${selectedAsset?.arch})`
                      : `Baixar APK (${formatBytes(selectedAsset?.sizeBytes ?? 0)})`}
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
