import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { UI_COPY } from '../data/translations.ts';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import type { LanguageCode } from '../types.ts';

export type AppTab = 'verify' | 'registry' | 'alerts' | 'guide';

interface TopBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  language: LanguageCode;
  onSyncAll: () => void;
  isSyncing: boolean;
  queuedCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  language,
  onSyncAll,
  isSyncing,
  queuedCount,
}) => {
  const copy = UI_COPY[language];
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const navItems: { id: AppTab; label: string }[] = [
    { id: 'verify', label: copy.navVerify },
    { id: 'registry', label: copy.navRegistry },
    {
      id: 'alerts',
      label: queuedCount > 0 ? `${copy.navAlerts} (${queuedCount})` : copy.navAlerts,
    },
    { id: 'guide', label: copy.navGuide },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E1E6DB] bg-[#F3F5F0]/90 backdrop-blur-md">
        <div className="mx-auto flex h-13 max-w-6xl items-center justify-between gap-8 px-4 sm:h-16 sm:px-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('verify')}
            className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
          >
            <svg
              className="h-8 w-8 shrink-0 shadow-xs"
              viewBox="0 0 512 512"
              fill="none"
              aria-hidden="true"
            >
              <rect width="512" height="512" rx="124" fill="#146C43" />
              <path
                d="M256 90L390 144V250C390 335 332 400 256 426C180 400 122 335 122 250V144L256 90Z"
                fill="#0D4F31"
              />
              <path
                d="M256 164C256 164 196 206 196 268C196 302 223 330 256 330C289 330 316 302 316 268C316 206 256 164 256 164Z"
                fill="#F2C94C"
              />
            </svg>
            <span className="font-display text-lg font-extrabold tracking-tight text-[#112217]">
              BeejRakshak
            </span>
          </button>

          {/* Zone 2: 4 single-line navigation links */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`relative shrink-0 whitespace-nowrap py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#146C43] ${
                    active ? 'text-[#112217]' : 'text-[#4B584E] hover:text-[#112217]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-[#146C43]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary action */}
          <div className="flex shrink-0 items-center">
            {isInstallable && !isInstalled ? (
              <button
                type="button"
                onClick={install}
                className="inline-flex min-h-[40px] shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-[#146C43] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:bg-[#0F5534] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Install App
              </button>
            ) : isIOS && !isInstalled ? (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="inline-flex min-h-[40px] shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-[#146C43] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:bg-[#0F5534] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Install App
              </button>
            ) : (
              <button
                type="button"
                onClick={onSyncAll}
                disabled={isSyncing}
                className="inline-flex min-h-[40px] shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-[#112217] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:bg-[#1E3A28] active:scale-[0.98] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146C43]"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                {isSyncing ? 'Syncing…' : 'Sync Offline DB'}
              </button>
            )}
          </div>
        </div>
      </header>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#E1E6DB] bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-[#112217]">
              Install BeejRakshak on iPhone
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#4B584E]">
              1. Tap the <strong>Share</strong> icon in Safari.
              <br />
              2. Scroll down and select <strong>Add to Home Screen</strong> for zero-signal offline access.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#112217] py-2.5 text-sm font-semibold text-white hover:bg-[#1E3A28]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
