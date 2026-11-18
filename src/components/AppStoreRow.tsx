import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { ActiveDownload, AndroidAppItem, InstalledAppRecord } from '../types';
import { formatBytes, hasUpdateAvailable } from '../utils/storeLogic';
import { AppIcon } from './AppIcon';

interface AppStoreRowProps {
  app: AndroidAppItem;
  installedRecord?: InstalledAppRecord;
  activeDownload?: ActiveDownload;
  onSelectApp: (app: AndroidAppItem) => void;
  onQuickDownload: (app: AndroidAppItem) => void;
  highlighted?: boolean;
  showCaption?: boolean;
}

export const AppStoreRow: React.FC<AppStoreRowProps> = ({
  app,
  installedRecord,
  activeDownload,
  onSelectApp,
  onQuickDownload,
  highlighted = false,
  showCaption = true,
}) => {
  const primaryAsset = app.assets[0];
  const needsUpdate = installedRecord
    ? hasUpdateAvailable(installedRecord.version, app.version)
    : false;

  return (
    <div
      className={`flex items-center justify-between gap-3.5 py-3 px-3.5 transition-colors ${
        highlighted
          ? 'rounded-2xl bg-purple-500/[0.14] border border-purple-400/25'
          : 'hover:bg-white/[0.03]'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelectApp(app)}
        className="flex items-center gap-3.5 min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-purple-400 rounded-xl"
      >
        <AppIcon
          name={app.name}
          src={app.iconImage}
          zoom={app.iconZoom}
          fallbackSrc={app.fallbackIconImage}
          fallbackZoom={app.fallbackIconZoom}
          monogram={app.monogram}
          accentColor={app.accentColor}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-[15px] font-bold text-white truncate">
              {app.name}
            </p>
          </div>
          <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{app.tagline}</p>
          <p className="text-[11px] text-slate-400 tabular-nums mt-0.5 truncate">
            {app.category} · v{app.version} · {formatBytes(primaryAsset?.sizeBytes ?? 0)}
          </p>
        </div>
      </button>

      <div className="flex flex-col items-center shrink-0">
        {activeDownload ? (
          <button
            type="button"
            disabled
            aria-label={`Baixando ${app.name}, ${activeDownload.progress}%`}
            className="min-h-[34px] min-w-[78px] px-3.5 py-1.5 rounded-full bg-purple-500/25 border border-purple-400/35 text-purple-200 text-xs font-bold inline-flex items-center justify-center gap-1 tabular-nums whitespace-nowrap"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            <span>{activeDownload.progress}%</span>
          </button>
        ) : installedRecord && !needsUpdate ? (
          <button
            type="button"
            onClick={() => onSelectApp(app)}
            aria-label={`${app.name} já baixado`}
            className="min-h-[34px] min-w-[78px] px-3.5 py-1.5 rounded-full bg-white/12 border border-white/15 text-purple-200 text-xs font-bold inline-flex items-center justify-center gap-1 hover:bg-white/20 transition-colors whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Abrir</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onQuickDownload(app)}
            aria-label={`${needsUpdate ? 'Atualizar' : 'Obter'} ${app.name}`}
            className="min-h-[34px] min-w-[78px] px-4 py-1.5 rounded-full bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center justify-center transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] whitespace-nowrap"
          >
            {needsUpdate ? 'Atualizar' : 'Obter'}
          </button>
        )}
        {showCaption && (
          <span className="mt-1 text-[10px] text-slate-400 whitespace-nowrap">APK Direto</span>
        )}
      </div>
    </div>
  );
};
