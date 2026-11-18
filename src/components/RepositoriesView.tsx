import React, { useState } from 'react';
import { CheckCircle2, Download, FolderGit2, Loader2, Plus, RefreshCw, Smartphone, Trash2 } from 'lucide-react';
import type { RepositorySource } from '../types';
import { HERO_MEDIA } from '../data/catalog';
import { isValidAndroidPackageId, validateGitHubRepoInput } from '../utils/storeLogic';

interface RepositoriesViewProps {
  repositories: RepositorySource[];
  isSyncingAll: boolean;
  lastSyncedLabel: string | null;
  onSyncAll: () => Promise<void>;
  onSyncSingleRepo: (repoId: string) => Promise<void>;
  onToggleRepo: (repoId: string) => void;
  onRemoveRepo: (repoId: string) => void;
  onAddGitHubRepo: (slug: string, url: string) => Promise<{ ok: boolean; message: string }>;
  onAddFDroidPackage: (packageId: string) => Promise<{ ok: boolean; message: string }>;
  onInspectRepo?: (repoId: string) => void;
}

const PRESET_REPOS = [
  { label: 'ReVanced Manager', slug: 'ReVanced/revanced-manager' },
  { label: 'Seal Downloader', slug: 'JunkFood02/Seal' },
  { label: 'Organic Maps', slug: 'organicmaps/organicmaps' },
  { label: 'Termux (F-Droid)', slug: 'com.termux' },
];

export const RepositoriesView: React.FC<RepositoriesViewProps> = ({
  repositories,
  isSyncingAll,
  lastSyncedLabel,
  onSyncAll,
  onSyncSingleRepo,
  onToggleRepo,
  onRemoveRepo,
  onAddGitHubRepo,
  onAddFDroidPackage,
  onInspectRepo,
}) => {
  const [repoInput, setRepoInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncingRepoId, setSyncingRepoId] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const trimmed = repoInput.trim();
    if (isValidAndroidPackageId(trimmed)) {
      setIsSubmitting(true);
      const result = await onAddFDroidPackage(trimmed);
      setIsSubmitting(false);
      if (result.ok) {
        setRepoInput('');
        setFormSuccess(result.message);
      } else {
        setFormError(result.message);
      }
      return;
    }

    const validation = validateGitHubRepoInput(trimmed);
    if (!validation.valid || !validation.slug || !validation.url) {
      setFormError(
        validation.error ||
          'Informe proprietario/repositorio do GitHub ou um pacote F-Droid (ex.: com.termux).'
      );
      return;
    }

    if (repositories.some((r) => r.slug.toLowerCase() === validation.slug!.toLowerCase())) {
      setFormError(`O repositório ${validation.slug} já está na sua lista.`);
      return;
    }

    setIsSubmitting(true);
    const result = await onAddGitHubRepo(validation.slug, validation.url);
    setIsSubmitting(false);

    if (result.ok) {
      setRepoInput('');
      setFormSuccess(result.message);
    } else {
      setFormError(result.message);
    }
  };

  const handleSyncSingle = async (repoId: string) => {
    setSyncingRepoId(repoId);
    await onSyncSingleRepo(repoId);
    setSyncingRepoId(null);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Intro Banner */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-0 liquid-glass rounded-3xl overflow-hidden">
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center gap-4">
          <div>
            <p className="text-xs font-semibold text-purple-300 tracking-wide">
              Fontes independentes de APK
            </p>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white tracking-tight [text-wrap:balance]">
              Sincronize repositórios do GitHub e índices F-Droid
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Conecte projetos do GitHub ou pacotes F-Droid pelo ID. A Phantom Store sincroniza
              versões, arquivos APK, notas de lançamento e ícones/imagens oficiais direto da fonte.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSyncAll()}
              disabled={isSyncingAll}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-purple-600 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:bg-purple-500 disabled:opacity-60 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_28px_-6px_rgba(147,51,234,0.6)] whitespace-nowrap"
            >
              <RefreshCw
                className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>
                {isSyncingAll ? 'Sincronizando apps e imagens...' : 'Sincronizar Tudo Agora'}
              </span>
            </button>
            {lastSyncedLabel && (
              <span className="text-xs text-slate-400 tabular-nums">
                Última sincronização: {lastSyncedLabel}
              </span>
            )}
          </div>
        </div>
        <div className="lg:col-span-5 min-h-[200px] bg-[#0D0B14]">
          {!imgError ? (
            <img
              src={HERO_MEDIA.vault}
              alt="Módulos criptográficos em obsidiana e vidro representando repositórios verificados"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0D0B14] text-purple-300 p-8">
              <FolderGit2 className="w-12 h-12" aria-hidden="true" />
            </div>
          )}
        </div>
      </section>

      {/* Add Custom Repository / F-Droid Package Form */}
      <section className="liquid-glass rounded-3xl p-6">
        <h2 className="font-display text-lg font-bold text-white">
          Adicionar repositório GitHub ou pacote F-Droid
        </h2>
        <p className="mt-1 text-sm text-slate-300">
          Informe <span className="font-mono text-purple-300">proprietario/repositorio</span>, uma URL
          do GitHub ou um ID Android F-Droid (ex.:{' '}
          <span className="font-mono text-purple-300">com.termux</span>).
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <label htmlFor="repo-input" className="sr-only">
              Repositório GitHub ou pacote F-Droid
            </label>
            <input
              id="repo-input"
              type="text"
              value={repoInput}
              onChange={(e) => {
                setRepoInput(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="Ex.: JunkFood02/Seal, https://github.com/... ou com.termux"
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.04] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:bg-white/[0.07] focus:border-purple-400"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-purple-500 disabled:opacity-60 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] whitespace-nowrap shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="w-4 h-4" aria-hidden="true" />
              )}
              <span>Adicionar Repositório</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400">Sugestões rápidas:</span>
            {PRESET_REPOS.map((preset) => (
              <button
                key={preset.slug}
                type="button"
                onClick={() => {
                  setRepoInput(preset.slug);
                  setFormError(null);
                }}
                className="min-h-[34px] px-3 py-1 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-medium text-slate-200 hover:bg-white/10 hover:border-purple-400/40 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {formError && (
            <p
              role="alert"
              className="text-xs font-medium text-red-200 bg-red-500/15 border border-red-400/30 rounded-xl px-3.5 py-2.5"
            >
              {formError}
            </p>
          )}
          {formSuccess && (
            <p
              role="status"
              className="text-xs font-medium text-purple-100 bg-purple-500/20 border border-purple-400/30 rounded-xl px-3.5 py-2.5"
            >
              {formSuccess}
            </p>
          )}
        </form>
      </section>

      {/* Active Repositories List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-white">
            Repositórios configurados ({repositories.length})
          </h2>
        </div>

        <div className="liquid-glass rounded-3xl divide-y divide-white/[0.08]">
          {repositories.map((repo) => {
            const isDefault = !repo.id.startsWith('custom-');
            const isRowSyncing = syncingRepoId === repo.id || isSyncingAll;
            const statusLabel =
              repo.syncStatus === 'online'
                ? 'Online'
                : repo.syncStatus === 'offline'
                  ? 'Offline'
                  : 'Em cache';

            return (
              <div
                key={repo.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-white truncate">
                      {repo.name}
                    </h3>
                    {repo.verified && (
                      <CheckCircle2
                        className="w-4 h-4 text-purple-400 shrink-0"
                        aria-label="Fonte verificada"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400 tabular-nums">
                    <span className="font-mono text-purple-300/80">{repo.slug}</span>
                    <span aria-hidden="true">·</span>
                    <span>{repo.kind === 'fdroid' ? 'Índice F-Droid' : 'GitHub Releases'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{repo.appCount === 1 ? '1 pacote' : `${repo.appCount} pacotes`}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        repo.syncStatus === 'online'
                          ? 'text-purple-300 font-medium'
                          : repo.syncStatus === 'offline'
                            ? 'text-amber-300'
                            : 'text-slate-400'
                      }
                    >
                      {statusLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Sincronizado em {repo.lastSyncedAt.slice(0, 10)}</span>
                  </div>
                  <p className="text-sm text-slate-300">{repo.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {onInspectRepo && (
                    <button
                      type="button"
                      onClick={() => onInspectRepo(repo.id)}
                      className="min-h-[40px] px-3 py-2 rounded-xl border border-purple-400/30 bg-purple-600/20 text-xs font-semibold text-purple-100 hover:bg-purple-600 transition-colors whitespace-nowrap"
                    >
                      Explorar ({repo.appCount.toLocaleString('pt-BR')})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSyncSingle(repo.id)}
                    disabled={isRowSyncing || !repo.enabled}
                    aria-label={`Sincronizar repositório ${repo.name}`}
                    className="min-h-[40px] px-3 py-2 rounded-xl border border-white/10 bg-white/[0.05] text-xs font-medium text-slate-200 hover:bg-white/10 hover:border-purple-400/40 disabled:opacity-50 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isRowSyncing ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                    <span>Sincronizar</span>
                  </button>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={repo.enabled}
                    aria-label={`${repo.enabled ? 'Desativar' : 'Ativar'} repositório ${repo.name}`}
                    onClick={() => onToggleRepo(repo.id)}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                      repo.enabled
                        ? 'bg-purple-500/20 text-purple-200 border-purple-400/35'
                        : 'bg-white/[0.04] text-slate-400 border-white/10'
                    }`}
                  >
                    {repo.enabled ? 'Ativo' : 'Pausado'}
                  </button>

                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => onRemoveRepo(repo.id)}
                      aria-label={`Remover repositório ${repo.name}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-500/15 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Native Android Kotlin Project Export */}
      <section className="liquid-glass rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-300" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-white">
              App Nativo Android (Kotlin + Jetpack Compose)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Código-fonte completo em <span className="font-mono text-purple-200">android/</span> com{' '}
            <span className="font-mono text-purple-200">PackageInstaller.Session</span>, detecção automática de ABI,
            leitura de pacotes instalados via <span className="font-mono text-purple-200">PackageManager</span> e workflow Gradle para compilar o APK no Android Studio ou GitHub Actions.
          </p>
        </div>

        <a
          href="/api/android/archive"
          download="phantom-store-android-kotlin.zip"
          className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span>Baixar Projeto Kotlin (.zip)</span>
        </a>
      </section>
    </div>
  );
};
