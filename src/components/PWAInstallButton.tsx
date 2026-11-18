import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors whitespace-nowrap shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_22px_-6px_rgba(147,51,234,0.65)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 ${
          compact ? 'min-h-[40px] px-3 text-xs' : 'px-4 py-2 text-xs'
        }`}
      >
        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Instalar App</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-pwa-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGuide(false);
          }}
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl liquid-glass p-6">
            <div className="w-10 h-1.5 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="install-pwa-title" className="text-lg font-bold text-white">
                    Instalar Phantom Store
                  </h2>
                  <p className="text-xs text-slate-400">
                    PWA instalável e código nativo Android em Kotlin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Fechar guia de instalação"
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-slate-300 leading-relaxed">
              {isIOS ? (
                <div className="rounded-2xl bg-white/[0.04] p-4 border border-white/10 space-y-2">
                  <p className="font-semibold text-white">No Safari (iPhone / iPad):</p>
                  <p>1. Toque no botão Compartilhar na barra inferior do navegador.</p>
                  <p>2. Role para baixo e toque em Adicionar à Tela de Início.</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-white/[0.04] p-4 border border-white/10 space-y-2">
                  <p className="font-semibold text-white">No Chrome para Android:</p>
                  <p>
                    1. Abra o menu do navegador e toque em{' '}
                    <strong className="text-white">Instalar aplicativo</strong> para rodar o Phantom
                    Store em tela cheia.
                  </p>
                  <p>
                    2. Para instalar APKs baixados no celular, habilite{' '}
                    <strong className="text-white">Instalar apps desconhecidos</strong> para o
                    navegador nas configurações do Android.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
