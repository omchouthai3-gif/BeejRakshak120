import React from 'react';
import { BookOpen, Database, ScanLine, ShieldAlert } from 'lucide-react';
import { UI_COPY } from '../data/translations.ts';
import type { LanguageCode } from '../types.ts';
import type { AppTab } from './TopBar.tsx';

interface MobileBottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  language: LanguageCode;
  queuedCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  language,
  queuedCount,
}) => {
  const copy = UI_COPY[language];

  const items: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'verify', label: copy.navVerify, icon: ScanLine },
    { id: 'registry', label: copy.navRegistry, icon: Database },
    { id: 'alerts', label: copy.navAlerts, icon: ShieldAlert },
    { id: 'guide', label: copy.navGuide, icon: BookOpen },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E2E6DC] bg-white/95 backdrop-blur-md md:hidden"
      aria-label="Mobile Navigation"
    >
      <div className="grid h-14 grid-cols-4 items-center">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex h-full min-h-[44px] flex-col items-center justify-center gap-0.5 px-1 transition-colors ${
                active ? 'text-[#146C43]' : 'text-[#4B584E]'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="max-w-full truncate text-[10px] font-semibold tracking-tight">
                {item.label}
              </span>
              {item.id === 'alerts' && queuedCount > 0 && (
                <span className="absolute right-4 top-1.5 font-mono text-[10px] font-bold text-[#C81E1E]">
                  {queuedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
