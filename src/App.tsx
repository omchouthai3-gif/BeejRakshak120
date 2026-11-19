import { useCallback, useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';
import { FieldGuideView } from './components/FieldGuideView.tsx';
import { InspectorDeskView } from './components/InspectorDeskView.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { OfflineRegistryView } from './components/OfflineRegistryView.tsx';
import { TopBar, type AppTab } from './components/TopBar.tsx';
import { VerdictOverlay } from './components/VerdictOverlay.tsx';
import { VerifyWorkspace } from './components/VerifyWorkspace.tsx';
import { LANGUAGES, UI_COPY } from './data/translations.ts';
import { useOnlineStatus } from './hooks/useOnlineStatus.ts';
import { apiUrl, hasRemoteApi } from './lib/api.ts';
import {
  getAllBatches,
  getLocalAlerts,
  initializeOfflineDatabase,
  saveLocalAlert,
  syncRegionalPack,
} from './lib/indexedDb.ts';
import { verifyPacket } from './lib/verificationEngine.ts';
import type {
  InspectorAlertPacket,
  LanguageCode,
  PackagingInspectionResult,
  RegionalPackMeta,
  SeedBatchRecord,
  VerificationVerdict,
} from './types.ts';

export default function App() {
  const networkOnline = useOnlineStatus();
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const effectiveOnline = networkOnline && !simulatedOffline;

  const [activeTab, setActiveTab] = useState<AppTab>('verify');
  const [language, setLanguage] = useState<LanguageCode>('en');

  const [batches, setBatches] = useState<SeedBatchRecord[]>([]);
  const [packs, setPacks] = useState<RegionalPackMeta[]>([]);
  const [alerts, setAlerts] = useState<InspectorAlertPacket[]>([]);
  const [recentVerdicts, setRecentVerdicts] = useState<VerificationVerdict[]>([]);
  const [activeVerdict, setActiveVerdict] = useState<VerificationVerdict | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const copy = UI_COPY[language];

  const loadAlertsMerged = useCallback(async (online: boolean) => {
    const localAlerts = await getLocalAlerts();
    if (!online || !hasRemoteApi()) {
      setAlerts(localAlerts);
      return;
    }

    try {
      const resp = await fetch(apiUrl('/api/alerts'));
      if (resp.ok) {
        const data = (await resp.json()) as { alerts?: InspectorAlertPacket[] };
        const serverAlerts = data.alerts ?? [];
        const mergedMap = new Map<string, InspectorAlertPacket>();
        for (const s of serverAlerts) mergedMap.set(s.id, s);
        for (const l of localAlerts) {
          if (l.syncStatus === 'QUEUED_OFFLINE' || !mergedMap.has(l.id)) {
            mergedMap.set(l.id, l);
          }
        }
        const merged = Array.from(mergedMap.values()).sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        );
        setAlerts(merged);
        return;
      }
    } catch {
      // Offline fallback
    }
    setAlerts(localAlerts);
  }, []);

  const syncQueuedAlerts = useCallback(async () => {
    if (!effectiveOnline || !hasRemoteApi()) return;
    const localAlerts = await getLocalAlerts();
    const queued = localAlerts.filter((a) => a.syncStatus === 'QUEUED_OFFLINE');
    if (queued.length === 0) {
      await loadAlertsMerged(true);
      return;
    }

    for (const packet of queued) {
      try {
        const resp = await fetch(apiUrl('/api/alerts'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(packet),
        });
        if (resp.ok) {
          const syncedPacket: InspectorAlertPacket = { ...packet, syncStatus: 'SYNCED' };
          await saveLocalAlert(syncedPacket);
        }
      } catch {
        // Keep queued for next reconnect
      }
    }
    await loadAlertsMerged(true);
    setStatusNotice(
      `Synced ${queued.length} offline dealer report${queued.length > 1 ? 's' : ''} to Agriculture Dept.`
    );
    setTimeout(() => setStatusNotice(null), 4000);
  }, [effectiveOnline, loadAlertsMerged]);

  useEffect(() => {
    (async () => {
      const { batches: initialBatches, packs: initialPacks } = await initializeOfflineDatabase();
      setBatches(initialBatches);
      setPacks(initialPacks);
      await loadAlertsMerged(effectiveOnline);
    })();
  }, []);

  useEffect(() => {
    if (effectiveOnline) {
      syncQueuedAlerts();
    } else {
      loadAlertsMerged(false);
    }
  }, [effectiveOnline, syncQueuedAlerts, loadAlertsMerged]);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    const updatedPacks = await syncRegionalPack('all');
    const updatedBatches = await getAllBatches();
    setPacks(updatedPacks);
    setBatches(updatedBatches);
    if (effectiveOnline) {
      await syncQueuedAlerts();
    }
    setIsSyncing(false);
    setStatusNotice('Offline batch registry updated in IndexedDB.');
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const handleSyncPack = async (packId: string) => {
    const updatedPacks = await syncRegionalPack(packId);
    const updatedBatches = await getAllBatches();
    setPacks(updatedPacks);
    setBatches(updatedBatches);
  };

  const handleRunVerification = async (params: {
    scannedCode?: string;
    imageDataUrl?: string;
    inputMethod: VerificationVerdict['inputMethod'];
    sampleOverride?: {
      batchId?: string;
      tampered?: boolean;
      sealStatus?: PackagingInspectionResult['sealStatus'];
      summary?: string;
    };
  }) => {
    setIsVerifying(true);
    try {
      const result = await verifyPacket({
        ...params,
        isOnline: effectiveOnline,
      });
      setRecentVerdicts((prev) => [result, ...prev.slice(0, 11)]);
      setActiveVerdict(result);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitAlert = async (
    packet: InspectorAlertPacket
  ): Promise<'SYNCED' | 'QUEUED_OFFLINE'> => {
    if (effectiveOnline && hasRemoteApi()) {
      try {
        const resp = await fetch(apiUrl('/api/alerts'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(packet),
        });
        if (resp.ok) {
          const synced: InspectorAlertPacket = { ...packet, syncStatus: 'SYNCED' };
          await saveLocalAlert(synced);
          await loadAlertsMerged(true);
          return 'SYNCED';
        }
      } catch {
        // Fall through to offline queue
      }
    }

    await saveLocalAlert(packet);
    await loadAlertsMerged(false);
    return 'QUEUED_OFFLINE';
  };

  const handleUpdateResolution = async (
    alertId: string,
    resolutionStatus: InspectorAlertPacket['resolutionStatus']
  ) => {
    if (!effectiveOnline || !hasRemoteApi()) return;
    try {
      const resp = await fetch(apiUrl(`/api/alerts/${encodeURIComponent(alertId)}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionStatus }),
      });
      if (resp.ok) {
        await loadAlertsMerged(true);
      }
    } catch {
      // Ignore transient error
    }
  };

  const queuedCount = alerts.filter((a) => a.syncStatus === 'QUEUED_OFFLINE').length;

  return (
    <div className="min-h-screen bg-[#F3F5F0] pb-20 text-[#112217] md:pb-14">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        language={language}
        onSyncAll={handleSyncAll}
        isSyncing={isSyncing}
        queuedCount={queuedCount}
      />

      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-7">
        {/* Workspace Control Strip: Regional Language + Offline Shop Mode */}
        <div className="mb-7 flex flex-col justify-between gap-3 border-b border-[#E1E6DB] pb-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#E7ECE2] p-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`min-h-[40px] whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  language === lang.code
                    ? 'bg-white text-[#112217] shadow-xs'
                    : 'text-[#4B584E] hover:text-[#112217]'
                }`}
              >
                {lang.nativeLabel}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#4B584E]">
              {effectiveOnline ? (
                <Wifi className="h-4 w-4 text-[#146C43]" aria-hidden="true" />
              ) : (
                <WifiOff className="h-4 w-4 text-[#B45309]" aria-hidden="true" />
              )}
              {effectiveOnline ? copy.onlineBadge : copy.offlineBadge}
            </span>

            <button
              type="button"
              onClick={() => setSimulatedOffline((v) => !v)}
              aria-pressed={simulatedOffline}
              className={`min-h-[40px] whitespace-nowrap rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                simulatedOffline
                  ? 'border-[#B45309] bg-[#FEF3C7] text-[#92400E]'
                  : 'border-[#D4DACD] bg-white text-[#112217] hover:bg-[#E7ECE2]'
              }`}
            >
              {simulatedOffline ? 'Exit Zero-Signal Mode' : copy.simulateOffline}
            </button>
          </div>
        </div>

        {statusNotice && (
          <div className="mb-6 rounded-2xl border border-[#146C43]/30 bg-[#EAF6EF] px-4 py-3 text-xs font-semibold text-[#0F5534]">
            {statusNotice}
          </div>
        )}

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === 'verify' && (
            <VerifyWorkspace
              language={language}
              isOnline={effectiveOnline}
              isVerifying={isVerifying}
              recentVerdicts={recentVerdicts}
              onRunVerification={handleRunVerification}
              onSelectRecentVerdict={setActiveVerdict}
            />
          )}

          {activeTab === 'registry' && (
            <OfflineRegistryView
              batches={batches}
              packs={packs}
              onSyncPack={handleSyncPack}
              onQuickVerifyCode={async (code) => {
                await handleRunVerification({
                  scannedCode: code,
                  inputMethod: 'manual-code',
                });
              }}
            />
          )}

          {activeTab === 'alerts' && (
            <InspectorDeskView
              alerts={alerts}
              language={language}
              isOnline={effectiveOnline}
              onSyncQueuedAlerts={syncQueuedAlerts}
              onUpdateResolution={handleUpdateResolution}
            />
          )}

          {activeTab === 'guide' && <FieldGuideView />}
        </motion.div>
      </main>

      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        language={language}
        queuedCount={queuedCount}
      />

      {activeVerdict && (
        <VerdictOverlay
          verdict={activeVerdict}
          language={language}
          onChangeLanguage={setLanguage}
          isOnline={effectiveOnline}
          onClose={() => setActiveVerdict(null)}
          onSubmitAlert={handleSubmitAlert}
        />
      )}
    </div>
  );
}
