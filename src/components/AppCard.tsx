import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Download, Loader2 } from 'lucide-react';
import type { ActiveDownload, AndroidAppItem, InstalledAppRecord } from '../types';
import { formatBytes } from '../utils/storeLogic';
import { AppIcon } from './AppIcon';

interface AppCardProps {
  app: AndroidAppItem;
  installedRecord?: InstalledAppRecord;
  activeDownload?: ActiveDownload;
  onSelectApp: (app: AndroidAppItem) => void;
  onQuickDownload: (app: AndroidAppItem) => void;
  compactMedia?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  installedRecord,
  activeDownload,
  onSelectApp,
  onQuickDownload,
  compactMedia = false,
}) => {
  const [previewFailed, setPreviewFailed] = useState(false);
  const primaryAsset = app.assets[0];
  const hasRealPreview = Boolean(app.previewImage && !previewFailed);

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className="liquid-glass-card rounded-3xl overflow-hidden flex flex-col justify-between group h-full"
    >
      {!compactMedia && (
        <button
          type="button"
          onClick={() => onSelectApp(app)}
          aria-label={`Ver prévia de ${app.name}`}
          className="w-full aspect-[16/9] bg-[#0B0815] overflow-hidden block border-b border-white/[0.06] focus-visible:outline-2 focus-visible:outline-purple-400 relative"
        >
          {hasRealPreview ? (
            <img
              src={app.previewImage}
              alt={`Captura do aplicativo ${app.name}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setPreviewFailed(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center relative overflow-hidden"
              style={{
                background: `radial-gradient(circle at 30% 25%, ${app.accentColor}44, #0B0815 72%)`,
              }}
            >
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
            </div>
          )}
        </button>
      )}

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <button
            type="button"
            onClick={() => onSelectApp(app)}
            aria-label={`Abrir detalhes de ${app.name}`}
            className="shrink-0 rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
          >
            <AppIcon
              name={app.name}
              src={app.iconImage}
              zoom={app.iconZoom}
              fallbackSrc={app.fallbackIconImage}
              fallbackZoom={app.fallbackIconZoom}
              monogram={app.monogram}
              accentColor={app.accentColor}
            />
          </button>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onSelectApp(app)}
              className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 rounded w-full"
            >
              <h3 className="font-display text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                {app.name}
              </h3>
            </button>

            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-400 tabular-nums">
              <span>{app.category}</span>
              <span aria-hidden="true">·</span>
              <span>v{app.version}</span>
              <span aria-hidden="true">·</span>
              <span>{formatBytes(primaryAsset?.sizeBytes ?? 0)}</span>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
              {app.tagline}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 truncate">
            {app.repoName || (app.sourceType === 'fdroid' ? 'F-Droid' : 'GitHub')}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSelectApp(app)}
              className="min-h-[36px] px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors whitespace-nowrap shrink-0"
            >
              Detalhes
            </button>

            {activeDownload ? (
              <button
                type="button"
                disabled
                aria-label={`Baixando ${app.name}, ${activeDownload.progress}%`}
                className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold inline-flex items-center gap-1.5 tabular-nums whitespace-nowrap shrink-0"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>{activeDownload.progress}%</span>
              </button>
            ) : installedRecord ? (
              <button
                type="button"
                onClick={() => onSelectApp(app)}
                aria-label={`${app.name} baixado na biblioteca`}
                className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-purple-200 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-white/15 transition-colors whitespace-nowrap shrink-0"
              >
                <Check className="w-3.5 h-3.5 text-purple-300" aria-hidden="true" />
                <span>Baixado</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onQuickDownload(app)}
                aria-label={`Baixar APK de ${app.name}`}
                className="min-h-[36px] px-4 py-1.5 rounded-full bg-purple-600 text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-purple-500 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Obter</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
};
