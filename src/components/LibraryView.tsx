import React, { useState } from 'react';
import {
  CheckCircle2,
  Compass,
  Download,
  ExternalLink,
  FileJson,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { ActiveDownload, AndroidAppItem, InstalledAppRecord } from '../types';
import {
  calculateLibrarySummary,
  formatBytes,
  hasUpdateAvailable,
} from '../utils/storeLogic';
import { AppIcon } from './AppIcon';

interface LibraryViewProps {
  installedApps: InstalledAppRecord[];
  activeDownloads: Record<string, ActiveDownload>;
  catalog: AndroidAppItem[];
  isSyncingAll: boolean;
  onSyncAll: () => Promise<number>;
  onExplore: () => void;
  onSelectApp: (app: AndroidAppItem) => void;
  onReDownload: (record: InstalledAppRecord) => void;
  onRemoveInstalled: (appId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  installedApps,
  activeDownloads,
  catalog,
  isSyncingAll,
  onSyncAll,
  onExplore,
  onSelectApp,
  onReDownload,
  onRemoveInstalled,
}) => {
  const [updateCheckStatus, setUpdateCheckStatus] = useState<string | null>(null);

  const summary = calculateLibrarySummary(installedApps, catalog);
  const activeList = Object.values(activeDownloads);

  const handleCheckUpdates = async () => {
    setUpdateCheckStatus(null);
    const updatesFound = await onSyncAll();
    if (updatesFound > 0) {
      setUpdateCheckStatus(
        `${updatesFound} atualização(ões) encontrada(s) nos repositórios conectados.`
      );
    } else if (installedApps.length === 0) {
      setUpdateCheckStatus(
        'Catálogo e repositórios sincronizados com sucesso com as versões mais recentes.'
      );
    } else {
      setUpdateCheckStatus('Todos os aplicativos da sua biblioteca estão atualizados.');
    }
  };

  const handleExportManifest = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      source: 'Phantom Store',
      apps: installedApps,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'phantom-store-biblioteca.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Biblioteca de APKs
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Gerencie seus downloads, sincronize novas versões dos repositórios e exporte sua lista.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCheckUpdates}
            disabled={isSyncingAll}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-white/15 bg-white/[0.05] text-slate-100 text-xs font-semibold inline-flex items-center gap-2 hover:bg-white/10 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            <RefreshCw
              className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isSyncingAll ? 'Verificando...' : 'Verificar atualizações'}</span>
          </button>

          {installedApps.length > 0 && (
            <button
              type="button"
              onClick={handleExportManifest}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-purple-500 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] whitespace-nowrap"
            >
              <FileJson className="w-4 h-4" aria-hidden="true" />
              <span>Exportar lista (.json)</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-400">Apps na biblioteca</p>
          <p className="mt-1 font-display text-2xl font-bold text-white tabular-nums">
            {summary.count}
          </p>
        </div>
        <div className="liquid-glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-400">Tamanho total dos APKs</p>
          <p className="mt-1 font-display text-2xl font-bold text-white tabular-nums">
            {formatBytes(summary.totalBytes)}
          </p>
        </div>
        <div className="liquid-glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-400">Atualizações pendentes</p>
          <p className="mt-1 font-display text-2xl font-bold text-white tabular-nums">
            {summary.updatesAvailable}
          </p>
        </div>
      </div>

      {updateCheckStatus && (
        <div
          role="status"
          className="rounded-2xl bg-purple-500/15 border border-purple-400/30 px-4 py-3 text-xs font-medium text-purple-100 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" aria-hidden="true" />
          <span>{updateCheckStatus}</span>
        </div>
      )}

      {/* Active Downloads */}
      {activeList.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-base font-bold text-white">
            Baixando agora ({activeList.length})
          </h2>
          <div className="liquid-glass rounded-3xl divide-y divide-white/[0.08]">
            {activeList.map((dl) => {
              const app = catalog.find((item) => item.id === dl.appId);
              if (!app) return null;
              return (
                <div key={dl.appId} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <AppIcon
                        name={app.name}
                        src={app.iconImage}
                        zoom={app.iconZoom}
                        fallbackSrc={app.fallbackIconImage}
                        fallbackZoom={app.fallbackIconZoom}
                        monogram={app.monogram}
                        accentColor={app.accentColor}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{app.name}</p>
                        <p className="text-xs text-slate-400 tabular-nums">
                          {dl.arch} · {formatBytes(dl.totalBytes)}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 tabular-nums">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      {dl.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-150"
                      style={{ width: `${dl.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Installed / Downloaded APKs */}
      {installedApps.length === 0 && activeList.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-400/25 text-purple-300 flex items-center justify-center mx-auto">
            <Download className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-white">
            Sua biblioteca está vazia
          </h2>
          <p className="mt-1.5 text-sm text-slate-300 max-w-md mx-auto">
            Baixe aplicativos como MySpoti, NewPipe ou Mihon na aba Hoje para acompanhar versões
            e verificar assinaturas SHA-256 aqui.
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-purple-500 transition-colors"
          >
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>Explorar loja</span>
          </button>
        </div>
      ) : (
        <section className="space-y-3">
          <h2 className="font-display text-base font-bold text-white">
            APKs baixados ({installedApps.length})
          </h2>
          <div className="liquid-glass rounded-3xl divide-y divide-white/[0.08]">
            {installedApps.map((record) => {
              const catalogApp = catalog.find((item) => item.id === record.appId);
              const hasUpdate = catalogApp
                ? hasUpdateAvailable(record.version, catalogApp.version)
                : false;

              return (
                <div
                  key={record.appId}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <AppIcon
                      name={record.name}
                      src={catalogApp?.iconImage}
                      zoom={catalogApp?.iconZoom}
                      fallbackSrc={catalogApp?.fallbackIconImage}
                      fallbackZoom={catalogApp?.fallbackIconZoom}
                      monogram={catalogApp?.monogram || record.name.slice(0, 2).toUpperCase()}
                      accentColor={catalogApp?.accentColor || '#7C3AED'}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => catalogApp && onSelectApp(catalogApp)}
                        className="font-display text-sm font-bold text-white hover:text-purple-300 truncate block text-left"
                      >
                        {record.name}
                      </button>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-400 tabular-nums">
                        <span>v{record.version}</span>
                        <span aria-hidden="true">·</span>
                        <span>{record.arch}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatBytes(record.sizeBytes)}</span>
                        <span aria-hidden="true">·</span>
                        <span>Baixado em {record.downloadedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <a
                      href={record.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-medium text-slate-200 hover:bg-white/10 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Link APK</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onReDownload(record)}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        hasUpdate
                          ? 'bg-purple-600 text-white hover:bg-purple-500'
                          : 'bg-white/10 text-slate-100 hover:bg-white/15'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {hasUpdate
                          ? `Atualizar p/ v${catalogApp?.version}`
                          : 'Atualizar registro'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveInstalled(record.appId)}
                      aria-label={`Remover ${record.name} da biblioteca`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-500/15 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
