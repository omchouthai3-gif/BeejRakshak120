import React, { useMemo, useState } from 'react';
import { CheckCircle2, Download, QrCode, RefreshCw, Search, X } from 'lucide-react';
import QRCode from 'qrcode';
import type { RegionalPackMeta, SeedBatchRecord } from '../types.ts';

interface OfflineRegistryViewProps {
  batches: SeedBatchRecord[];
  packs: RegionalPackMeta[];
  onSyncPack: (packId: string) => Promise<void>;
  onQuickVerifyCode: (code: string) => Promise<void>;
}

export const OfflineRegistryView: React.FC<OfflineRegistryViewProps> = ({
  batches,
  packs,
  onSyncPack,
  onQuickVerifyCode,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'FLAGGED'>('ALL');
  const [syncingPack, setSyncingPack] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<{ batch: SeedBatchRecord; dataUrl: string } | null>(
    null
  );

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'VALID'
            ? b.registryStatus === 'VALID'
            : b.registryStatus !== 'VALID';

      if (!matchesStatus) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        b.productName.toLowerCase().includes(q) ||
        b.batchNumber.toLowerCase().includes(q) ||
        b.qrSerial.toLowerCase().includes(q) ||
        b.manufacturer.toLowerCase().includes(q) ||
        b.state.toLowerCase().includes(q)
      );
    });
  }, [batches, search, statusFilter]);

  const handleSync = async (packId: string) => {
    setSyncingPack(packId);
    await onSyncPack(packId);
    setSyncingPack(null);
  };

  const handleOpenQr = async (batch: SeedBatchRecord) => {
    const dataUrl = await QRCode.toDataURL(batch.qrSerial, {
      width: 280,
      margin: 2,
      color: { dark: '#112217', light: '#FFFFFF' },
    });
    setQrPreview({ batch, dataUrl });
  };

  const totalKb = packs.reduce((sum, p) => sum + p.sizeKb, 0);

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <section className="surface-card flex flex-col justify-between gap-5 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="text-xs font-semibold text-[#146C43]">
            IndexedDB Local Storage · Zero-Signal Ready
          </p>
          <h1 className="font-display mt-1 text-2xl font-extrabold tracking-tight text-[#112217] sm:text-3xl">
            Offline Seed &amp; Fertilizer Registry
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-[#4B584E]">
            Compressed regional batch packs cached on your device for instant verification inside rural shops without cellular data.
          </p>
        </div>
        <div className="flex items-center gap-6 text-right tabular-nums">
          <div>
            <p className="text-xs text-[#4B584E]">Cached Lots</p>
            <p className="font-display text-3xl font-extrabold text-[#112217]">{batches.length}</p>
          </div>
          <div className="h-10 w-px bg-[#E1E6DB]" />
          <div>
            <p className="text-xs text-[#4B584E]">Pack Footprint</p>
            <p className="font-display text-3xl font-extrabold text-[#146C43]">{totalKb} KB</p>
          </div>
        </div>
      </section>

      {/* Regional Pack Cards */}
      <section className="grid gap-5 md:grid-cols-3">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="surface-card flex flex-col justify-between rounded-2xl p-5"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-[#4B584E]">
                <span>{pack.state}</span>
                <span className="font-mono">{pack.sizeKb} KB</span>
              </div>
              <h2 className="font-display mt-1.5 text-base font-bold text-[#112217]">{pack.name}</h2>
              <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#0F7B43]">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {pack.batchCount} batches synced · {pack.updatedAt}
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#EEF1EA]">
                <div className="h-full w-full rounded-full bg-[#146C43]" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSync(pack.id)}
              disabled={syncingPack === pack.id}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#D4DACD] bg-[#F3F5F0] px-4 py-2 text-xs font-semibold text-[#112217] transition-colors hover:bg-[#E7ECE2] disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${syncingPack === pack.id ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {syncingPack === pack.id ? 'Refreshing Pack…' : 'Refresh Local Pack'}
            </button>
          </div>
        ))}
      </section>

      {/* Search & Registry Table */}
      <section className="surface-card rounded-3xl p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B584E]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search batch, product, QR serial, or state…"
              className="min-h-[44px] w-full rounded-xl border border-[#D4DACD] bg-[#F3F5F0] pl-10 pr-4 text-sm text-[#112217] focus:border-[#146C43] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-[#F3F5F0] p-1">
            {(
              [
                { id: 'ALL', label: 'All Batches' },
                { id: 'VALID', label: 'Safe Only' },
                { id: 'FLAGGED', label: 'Flagged / Expired' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`min-h-[38px] whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-white text-[#112217] shadow-xs'
                    : 'text-[#4B584E] hover:text-[#112217]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[740px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E1E6DB] text-xs font-semibold text-[#4B584E]">
                <th className="py-3 pr-4">Product &amp; Brand</th>
                <th className="px-4 py-3">Batch / QR Serial</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Scans</th>
                <th className="px-4 py-3">Registry Status</th>
                <th className="py-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1EA] tabular-nums">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[#4B584E]">
                    No batches match your search filter.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const isSafe = batch.registryStatus === 'VALID';
                  return (
                    <tr key={batch.id} className="transition-colors hover:bg-[#F7F9F5]">
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-[#112217]">{batch.productName}</p>
                        <p className="text-xs text-[#4B584E]">
                          {batch.manufacturer} · {batch.netWeight} · ₹{batch.mrpInr}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-[#112217]">
                        <p className="font-semibold">{batch.batchNumber}</p>
                        <p className="text-[#4B584E]">{batch.qrSerial}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-[#112217]">
                        {batch.expiryDate}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#112217]">
                        {batch.knownScanCount}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-mono text-xs font-bold ${
                            isSafe ? 'text-[#0F7B43]' : 'text-[#C81E1E]'
                          }`}
                        >
                          {batch.registryStatus}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenQr(batch)}
                            title="View QR code"
                            className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[#D4DACD] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#112217] hover:bg-[#F3F5F0]"
                          >
                            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                            QR
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickVerifyCode(batch.qrSerial)}
                            className="min-h-[38px] rounded-lg bg-[#112217] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3A28]"
                          >
                            Verify
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* QR Code Preview Modal */}
      {qrPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl border border-[#E1E6DB] bg-white p-6 text-center shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#112217]">
                Batch QR Code
              </h3>
              <button
                type="button"
                onClick={() => setQrPreview(null)}
                aria-label="Close QR preview"
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-[#4B584E] hover:bg-[#F3F5F0]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={qrPreview.dataUrl}
              alt={`QR code for ${qrPreview.batch.productName}`}
              className="mx-auto mt-4 h-52 w-52 rounded-2xl border border-[#E1E6DB] bg-white p-2.5"
            />
            <p className="mt-3 text-sm font-bold text-[#112217]">{qrPreview.batch.productName}</p>
            <p className="mt-1 font-mono text-xs text-[#4B584E]">{qrPreview.batch.qrSerial}</p>
            <p className="mt-1 text-xs text-[#4B584E]">
              Exp {qrPreview.batch.expiryDate} · {qrPreview.batch.state}
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href={qrPreview.dataUrl}
                download={`${qrPreview.batch.batchNumber}-qr.png`}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#D4DACD] px-4 py-2 text-xs font-semibold text-[#112217] hover:bg-[#F3F5F0]"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Save PNG
              </a>
              <button
                type="button"
                onClick={() => {
                  const serial = qrPreview.batch.qrSerial;
                  setQrPreview(null);
                  onQuickVerifyCode(serial);
                }}
                className="min-h-[44px] flex-1 rounded-xl bg-[#146C43] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F5534]"
              >
                Verify Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
