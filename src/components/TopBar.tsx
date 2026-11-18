import React from 'react';
import { motion } from 'motion/react';
import { PWAInstallButton } from './PWAInstallButton';

export type NavTab = 'today' | 'apps' | 'repos' | 'library';

interface TopBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  libraryCount: number;
  totalCatalogCount?: number;
}

const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'today', label: 'Explorar' },
  { id: 'apps', label: 'Catálogo' },
  { id: 'repos', label: 'Fontes' },
  { id: 'library', label: 'Biblioteca' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  libraryCount,
  totalCatalogCount,
}) => {
  return (
    <header className="hidden md:block sticky top-0 z-30 liquid-glass-bar border-b">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('today')}
          className="font-display text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-purple-200 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
        >
          Phantom Store
        </button>

        {/* Zone 2: Clean 4-item single-line store navigation */}
        <nav aria-label="Navegação principal da loja" className="flex items-center gap-8">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const suffix =
              item.id === 'apps' && totalCatalogCount && totalCatalogCount > 100
                ? ` (${Math.floor(totalCatalogCount / 1000)}k+)`
                : item.id === 'library' && libraryCount > 0
                  ? ` (${libraryCount})`
                  : '';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 inline-flex items-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 ${
                  isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <span className="tabular-nums">
                  {item.label}
                  {suffix}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="phantom-nav-underline"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.75)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
