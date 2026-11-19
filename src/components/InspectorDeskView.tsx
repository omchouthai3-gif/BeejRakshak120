import React, { useMemo, useState } from 'react';
import { Check, CloudUpload, Copy, MapPin, ShieldAlert } from 'lucide-react';
import { REASON_LABELS } from '../data/translations.ts';
import type { InspectorAlertPacket, LanguageCode } from '../types.ts';

interface InspectorDeskViewProps {
  alerts: InspectorAlertPacket[];
  language: LanguageCode;
  isOnline: boolean;
  onSyncQueuedAlerts: () => Promise<void>;
  onUpdateResolution: (
    alertId: string,
    status: InspectorAlertPacket['resolutionStatus']
  ) => Promise<void>;
}

export const InspectorDeskView: React.FC<InspectorDeskViewProps> = ({
  alerts,
  language,
  isOnline,
  onSyncQueuedAlerts,
  onUpdateResolution,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'QUEUED' | 'OPEN' | 'ACTION_TAKEN'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const queuedCount = alerts.filter((a) => a.syncStatus === 'QUEUED_OFFLINE').length;
  const openCount = alerts.filter((a) => a.resolutionStatus === 'OPEN').length;
  const actionTakenCount = alerts.filter((a) => a.resolutionStatus === 'ACTION_TAKEN').length;

  const filteredAlerts = useMemo(() => {
    if (filter === 'ALL') return alerts;
    if (filter === 'QUEUED') return alerts.filter((a) => a.syncStatus === 'QUEUED_OFFLINE');
    if (filter === 'OPEN') return alerts.filter((a) => a.resolutionStatus !== 'ACTION_TAKEN');
    return alerts.filter((a) => a.resolutionStatus === 'ACTION_TAKEN');
  }, [alerts, filter]);

  const handleSync = async () => {
    setSyncing(true);
    await onSyncQueuedAlerts();
    setSyncing(false);
  };

  const handleCopyCoords = async (alert: InspectorAlertPacket) => {
    const text = `${alert.location.lat}, ${alert.location.lng}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(alert.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & KPI Strip */}
      <section className="surface-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold text-[#C81E1E]">
              District Regulatory Accountability · Geo-Tagged Evidence
            </p>
            <h1 className="font-display mt-1 text-2xl font-extrabold tracking-tight text-[#112217] sm:text-3xl">
              Agriculture Inspector Desk
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#4B584E]">
              Encrypted counterfeit &amp; expired stock reports queued from rural shops. Offline packets auto-sync to this desk as soon as cellular signal returns.
            </p>
          </div>
          {queuedCount > 0 && (
            <button
              type="button"
              onClick={handleSync}
              disabled={!isOnline || syncing}
              className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-[#146C43] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#0F5534] disabled:opacity-50"
            >
              <CloudUpload className="h-4 w-4" aria-hidden="true" />
              {syncing
                ? 'Syncing Queue…'
                : isOnline
                  ? `Sync ${queuedCount} Queued Alert${queuedCount > 1 ? 's' : ''}`
                  : `${queuedCount} Waiting for Signal`}
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 border-t border-[#EEF1EA] pt-6 sm:grid-cols-4 tabular-nums">
          <div>
            <p className="text-xs font-medium text-[#4B584E]">Total Alerts</p>
            <p className="font-display mt-1 text-3xl font-extrabold text-[#112217]">
              {alerts.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#4B584E]">Queued Offline</p>
            <p className="font-display mt-1 text-3xl font-extrabold text-[#B45309]">
              {queuedCount}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#4B584E]">Open Cases</p>
            <p className="font-display mt-1 text-3xl font-extrabold text-[#C81E1E]">
              {openCount}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#4B584E]">Action Taken</p>
            <p className="font-display mt-1 text-3xl font-extrabold text-[#0F7B43]">
              {actionTakenCount}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#E7ECE2] p-1">
          {(
            [
              { id: 'ALL', label: `All (${alerts.length})` },
              { id: 'QUEUED', label: `Queued (${queuedCount})` },
              { id: 'OPEN', label: 'Active Cases' },
              { id: 'ACTION_TAKEN', label: `Resolved (${actionTakenCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[38px] whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === tab.id
                  ? 'bg-white text-[#112217] shadow-xs'
                  : 'text-[#4B584E] hover:text-[#112217]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <section className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="surface-card rounded-2xl p-10 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-[#4B584E]" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-[#112217]">
              No dealer alerts in this view.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <article key={alert.id} className="surface-card rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="flex items-start gap-4">
                  {alert.evidenceImage && (
                    <img
                      src={alert.evidenceImage}
                      alt={`Evidence for ${alert.productName}`}
                      referrerPolicy="no-referrer"
                      className="h-24 w-24 shrink-0 rounded-xl border border-[#E1E6DB] object-cover"
                    />
                  )}
                  <div>
                    <p className="font-mono text-xs text-[#4B584E]">
                      {alert.id} ·{' '}
                      <span
                        className={
                          alert.syncStatus === 'QUEUED_OFFLINE'
                            ? 'font-bold text-[#B45309]'
                            : 'font-bold text-[#0F7B43]'
                        }
                      >
                        {alert.syncStatus === 'QUEUED_OFFLINE' ? 'QUEUED OFFLINE' : 'SYNCED TO DEPT'}
                      </span>{' '}
                      · {new Date(alert.createdAt).toLocaleDateString()}
                    </p>
                    <h2 className="font-display mt-1 text-lg font-bold text-[#112217]">
                      {alert.shopName}
                    </h2>
                    <p className="text-sm text-[#4B584E]">
                      {alert.villageOrTaluka ? `${alert.villageOrTaluka}, ` : ''}
                      {alert.district}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#112217]">
                      {alert.productName}{' '}
                      <span className="font-mono text-xs font-normal text-[#4B584E]">
                        (Batch {alert.batchNumber})
                      </span>
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#C81E1E]">
                      {alert.reasons.map((r) => REASON_LABELS[r][language]).join(' · ')}
                    </p>
                    {alert.notes && (
                      <p className="mt-2 text-xs leading-relaxed text-[#4B584E]">{alert.notes}</p>
                    )}
                  </div>
                </div>

                {/* Inspector Status & GPS Coordinates */}
                <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                  <button
                    type="button"
                    onClick={() => handleCopyCoords(alert)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#E1E6DB] bg-[#F3F5F0] px-2.5 py-1 font-mono text-xs text-[#112217] transition-colors hover:bg-[#E7ECE2]"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#C81E1E]" aria-hidden="true" />
                    <span>
                      {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                    </span>
                    {copiedId === alert.id ? (
                      <Check className="h-3.5 w-3.5 text-[#0F7B43]" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3 w-3 text-[#4B584E]" aria-hidden="true" />
                    )}
                  </button>
                  <p className="font-mono text-[11px] text-[#4B584E]">
                    SHA-256: {alert.integrityHash.slice(0, 14)}…
                  </p>

                  {alert.syncStatus === 'SYNCED' && (
                    <div className="flex items-center gap-1 rounded-xl bg-[#F3F5F0] p-1">
                      {(
                        [
                          { id: 'OPEN', label: 'Open' },
                          { id: 'INVESTIGATING', label: 'Inspecting' },
                          { id: 'ACTION_TAKEN', label: 'Action Taken' },
                        ] as const
                      ).map((step) => (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => onUpdateResolution(alert.id, step.id)}
                          className={`min-h-[36px] whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                            alert.resolutionStatus === step.id
                              ? 'bg-[#112217] text-white'
                              : 'text-[#4B584E] hover:text-[#112217]'
                          }`}
                        >
                          {step.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};
