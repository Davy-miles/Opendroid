import React from 'react';
import { motion } from 'motion/react';
import { Compass, Download, FolderGit2, Layers } from 'lucide-react';
import type { NavTab } from './TopBar';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  libraryCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  libraryCount,
}) => {
  const items: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'today', label: 'Explorar', icon: Compass },
    { id: 'apps', label: 'Catálogo', icon: Layers },
    { id: 'repos', label: 'Fontes', icon: FolderGit2 },
    { id: 'library', label: 'Biblioteca', icon: Download },
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 pb-safe pointer-events-none">
      <nav
        aria-label="Navegação da loja"
        className="pointer-events-auto mx-auto max-w-md h-[62px] px-1.5 rounded-[30px] liquid-glass border border-purple-300/20 shadow-[0_18px_40px_-10px_rgba(0,0,0,0.9),0_0_24px_-8px_rgba(139,92,246,0.35)] grid grid-cols-4 items-center"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative h-[50px] rounded-[24px] flex flex-col items-center justify-center gap-0.5 px-1 transition-colors focus-visible:outline-2 focus-visible:outline-purple-400 ${
                isActive ? 'text-purple-200' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="phantom-dock-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[24px] bg-purple-600/30 border border-purple-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                />
              )}
              <div className="relative z-10 flex items-center justify-center">
                <Icon className={`w-[19px] h-[19px] ${isActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
                {item.id === 'library' && libraryCount > 0 && (
                  <span className="ml-0.5 text-[10px] font-bold text-purple-300 tabular-nums">
                    {libraryCount}
                  </span>
                )}
              </div>
              <span className="relative z-10 text-[10.5px] font-semibold tracking-tight leading-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
