'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, Search, Kanban, Radar, MessageSquare,
  Newspaper, Settings, ChevronLeft, ChevronRight, Sun, Moon, Zap,
  Loader2, Sparkles
} from 'lucide-react';
import { useDealScopeStore } from '@/store/use-deal-scope-store';
import { cn } from '@/lib/utils';

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'recherche', label: 'Recherche', icon: Search },
  { key: 'pipeline', label: 'Pipeline', icon: Kanban },
  { key: 'scan', label: 'Scan IA', icon: Radar },
  { key: 'chat', label: 'Chat IA', icon: MessageSquare, gemmaBadge: true },
  { key: 'actualites', label: 'Actualités & Alertes', icon: Newspaper },
  { key: 'parametres', label: 'Paramètres', icon: Settings },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, toggleSidebar } = useDealScopeStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40 flex flex-col border-r transition-all duration-300',
        'bg-card/80 backdrop-blur-xl border-border',
        sidebarOpen ? 'w-60' : 'w-[72px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="text-base font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                DealScope
              </h1>
              <p className="text-[10px] text-muted-foreground leading-none">M&A Intelligence — Gemma 4</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                'hover:bg-accent/50 group',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
                !sidebarOpen && 'justify-center px-2'
              )}
            >
              <div className="relative shrink-0">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {/* Gemma 4 badge when chat tab is active */}
                {tab.gemmaBadge && isActive && (
                  <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-white" />
                  </span>
                )}
              </div>
              {sidebarOpen && (
                <span className="truncate flex items-center gap-1.5">
                  {tab.label}
                  {tab.gemmaBadge && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-400 leading-none">
                      Gemma 4
                    </span>
                  )}
                </span>
              )}
              {/* Collapsed Gemma 4 badge */}
              {!sidebarOpen && tab.gemmaBadge && isActive && (
                <span className="sr-only">Gemma 4 actif</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="p-2 border-t border-border space-y-1">
        {/* Theme toggle — SSR-safe: render consistent placeholder until mounted */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
          aria-label="Changer de thème"
        >
          {!mounted ? (
            <Loader2 className="w-5 h-5 shrink-0 animate-spin opacity-40" />
          ) : resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 shrink-0" />
          ) : (
            <Moon className="w-5 h-5 shrink-0" />
          )}
          {sidebarOpen && (
            <span>
              {!mounted ? 'Thème…' : resolvedTheme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </span>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
        >
          {sidebarOpen ? (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span>Réduire</span>
            </>
          ) : (
            <ChevronRight className="w-5 h-5 shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
}
