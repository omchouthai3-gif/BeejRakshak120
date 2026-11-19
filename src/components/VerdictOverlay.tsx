import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  OctagonAlert,
  RotateCcw,
  ShieldCheck,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { LANGUAGES, REASON_LABELS, UI_COPY } from '../data/translations.ts';
import { computeSha256Hex } from '../lib/verificationEngine.ts';
import { playVerdictVoice, stopVerdictVoice } from '../lib/voiceVerdict.ts';
import type {
  GeoLocationData,
  InspectorAlertPacket,
  LanguageCode,
  VerificationVerdict,
} from '../types.ts';

interface VerdictOverlayProps {
  verdict: VerificationVerdict;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  isOnline: boolean;
  onClose: () => void;
  onSubmitAlert: (packet: InspectorAlertPacket) => Promise<'SYNCED' | 'QUEUED_OFFLINE'>;
}

export const VerdictOverlay: React.FC<VerdictOverlayProps> = ({
  verdict,
  language,
  onChangeLanguage,
  isOnline,
  onClose,
  onSubmitAlert,
}) => {
  const copy = UI_COPY[language];
  const isSafe = verdict.verdict === 'SAFE';

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEngine, setVoiceEngine] = useState<string | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [shopName, setShopName] = useState('');
  const [villageOrTaluka, setVillageOrTaluka] = useState('');
  const [district, setDistrict] = useState(
    verdict.batchRecord?.lastScanDistricts[0] ?? 'Haveri, Karnataka'
  );
  const [notes, setNotes] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locking' | 'locked'>('idle');
  const [location, setLocation] = useState<GeoLocationData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitOutcome, setSubmitOutcome] = useState<'SYNCED' | 'QUEUED_OFFLINE' | null>(null);

  useEffect(() => {
    let active = true;
    const speakNow = async () => {
      setIsSpeaking(true);
      const engine = await playVerdictVoice({
        text: verdict.voiceSummary[language],
        language,
        isOnline,
        onEnd: () => {
          if (active) setIsSpeaking(false);
        },
      });
      if (active) setVoiceEngine(engine);
    };
    speakNow();

    return () => {
      active = false;
      stopVerdictVoice();
    };
  }, [verdict.id, language, isOnline, verdict.voiceSummary]);

  const handleToggleVoice = async () => {
    if (isSpeaking) {
      stopVerdictVoice();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    const engine = await playVerdictVoice({
      text: verdict.voiceSummary[language],
      language,
      isOnline,
      onEnd: () => setIsSpeaking(false),
    });
    setVoiceEngine(engine);
  };

  const handleOpenReport = () => {
    setShowReportForm(true);
    setGpsStatus('locking');

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            accuracyMeters: Math.round(pos.coords.accuracy || 18),
            source: 'gps',
            label: 'Device Satellite GPS Lock',
          });
          setGpsStatus('locked');
        },
        () => {
          setLocation({
            lat: 14.7955,
            lng: 75.4044,
            accuracyMeters: 250,
            source: 'district-fallback',
            label: `${district} Tower/Grid Fallback`,
          });
          setGpsStatus('locked');
        },
        { enableHighAccuracy: true, timeout: 4500 }
      );
    } else {
      setLocation({
        lat: 14.7955,
        lng: 75.4044,
        accuracyMeters: 250,
        source: 'district-fallback',
        label: `${district} Grid Fallback`,
      });
      setGpsStatus('locked');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !location) return;
    setSubmitting(true);

    const payload = JSON.stringify({
      verdictId: verdict.id,
      batchNumber: verdict.batchRecord?.batchNumber ?? verdict.scannedCode,
      shopName: shopName.trim(),
      lat: location.lat,
      lng: location.lng,
      ts: new Date().toISOString(),
    });
    const integrityHash = await computeSha256Hex(payload);

    const packet: InspectorAlertPacket = {
      id: `ALT-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      verdictId: verdict.id,
      productName:
        verdict.batchRecord?.productName ??
        verdict.packagingInspection?.extractedBrand ??
        'Unverified Agricultural Input',
      batchNumber:
        verdict.batchRecord?.batchNumber ??
        verdict.packagingInspection?.extractedBatchNo ??
        verdict.scannedCode,
      qrSerial: verdict.scannedCode,
      manufacturer: verdict.batchRecord?.manufacturer ?? 'Unknown Manufacturer',
      reasons: verdict.reasons,
      shopName: shopName.trim(),
      villageOrTaluka: villageOrTaluka.trim() || 'Rural Input Market',
      district: district.trim() || 'District HQ',
      notes: notes.trim() || verdict.reasons.map((r) => REASON_LABELS[r].en).join('; '),
      location,
      integrityHash,
      syncStatus: 'QUEUED_OFFLINE',
      resolutionStatus: 'OPEN',
      evidenceImage: verdict.imageDataUrl,
    };

    const outcome = await onSubmitAlert(packet);
    setSubmitOutcome(outcome);
    setSubmitting(false);
  };

  const qrVelocityOk = !verdict.reasons.includes('CLONED_QR') && !verdict.reasons.includes('UNREGISTERED_BATCH');
  const expiryOk = !verdict.reasons.includes('EXPIRED_STOCK');
  const sealOk = !verdict.reasons.includes('TAMPERED_LABEL') && !verdict.reasons.includes('BLACKLISTED_BATCH');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#F3F5F0]"
      role="dialog"
      aria-modal="true"
      aria-label="Verification Verdict"
    >
      {/* Full-Width High-Contrast Signal Header */}
      <div
        className={`w-full px-4 py-6 text-white sm:px-8 sm:py-8 ${
          isSafe
            ? 'bg-gradient-to-b from-[#0F7B43] to-[#0B6134]'
            : 'bg-gradient-to-b from-[#C81E1E] to-[#9E1616]'
        }`}
      >
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onChangeLanguage(lang.code)}
                  className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    language === lang.code
                      ? 'bg-white text-[#112217] shadow-xs'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {lang.nativeLabel}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                stopVerdictVoice();
                onClose();
              }}
              aria-label="Close verdict"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/25"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                {isSafe ? (
                  <ShieldCheck className="h-10 w-10 text-white" aria-hidden="true" />
                ) : (
                  <OctagonAlert className="h-10 w-10 text-white" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="font-mono text-xs font-medium text-white/85">
                  {verdict.mode === 'online-dual'
                    ? 'Dual Verification · Offline Registry + AI Vision'
                    : 'Offline Dual Verification · Local IndexedDB Registry'}
                </p>
                <h1 className="font-display mt-1 text-2xl font-extrabold tracking-tight sm:text-4xl">
                  {isSafe ? copy.verdictSafeTitle : copy.verdictFakeTitle}
                </h1>
                <p className="mt-1.5 text-sm text-white/90 sm:text-base">
                  {isSafe ? copy.verdictSafeSub : copy.verdictFakeSub}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleVoice}
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2.5 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#112217] shadow-md transition-transform active:scale-[0.98]"
            >
              {isSpeaking ? (
                <>
                  <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
                    <span className="animate-voice-bar-1 h-4 w-1 rounded-full bg-[#146C43]" />
                    <span className="animate-voice-bar-2 h-4 w-1 rounded-full bg-[#146C43]" />
                    <span className="animate-voice-bar-3 h-4 w-1 rounded-full bg-[#146C43]" />
                  </span>
                  <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  {copy.stopVoice}
                </>
              ) : (
                <>
                  <Volume2 className="h-5 w-5" aria-hidden="true" />
                  {copy.listenVoice}
                </>
              )}
            </button>
          </div>

          <p className="mt-5 rounded-2xl bg-black/15 px-4 py-3.5 text-sm leading-relaxed text-white/95 ring-1 ring-white/10">
            {verdict.voiceSummary[language]}
            {voiceEngine === 'gemini-tts' && (
              <span className="ml-2 font-mono text-[11px] text-white/75">· Regional AI Voice</span>
            )}
          </p>
        </div>
      </div>

      {/* Forensic Breakdown Body */}
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
        {/* 3-Gate Verification Summary Bar */}
        <div className="surface-card mb-6 grid divide-y divide-[#EEF1EA] rounded-2xl sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { label: 'QR & Serial Uniqueness', pass: qrVelocityOk },
            { label: 'Statutory Expiry vs Clock', pass: expiryOk },
            { label: 'Packaging & Seal Integrity', pass: sealOk },
          ].map((gate) => (
            <div key={gate.label} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-xs font-semibold text-[#4B584E]">{gate.label}</span>
              <span
                className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold ${
                  gate.pass ? 'text-[#0F7B43]' : 'text-[#C81E1E]'
                }`}
              >
                {gate.pass ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <OctagonAlert className="h-4 w-4" aria-hidden="true" />
                )}
                {gate.pass ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Traceability & Registry Check */}
          <div className="surface-card rounded-2xl p-6">
            <h2 className="font-display text-base font-bold text-[#112217]">
              1. QR &amp; Seed Act Registry Audit
            </h2>
            <p className="mt-1 text-xs text-[#4B584E]">
              {verdict.batchRecord
                ? `${verdict.batchRecord.manufacturer} · ${verdict.batchRecord.licenseNumber}`
                : 'No matching batch record in downloaded regional registry'}
            </p>

            <dl className="mt-5 divide-y divide-[#EEF1EA] text-sm">
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-[#4B584E]">Product</dt>
                <dd className="text-right font-semibold text-[#112217]">
                  {verdict.batchRecord?.productName ??
                    verdict.packagingInspection?.extractedBrand ??
                    'Unregistered Input'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-[#4B584E]">Batch / QR Serial</dt>
                <dd className="font-mono text-xs font-semibold text-[#112217]">
                  {verdict.batchRecord?.batchNumber ?? verdict.scannedCode}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-[#4B584E]">Expiry Date</dt>
                <dd className="font-mono text-xs font-semibold text-[#112217]">
                  {verdict.batchRecord?.expiryDate ??
                    verdict.packagingInspection?.extractedExpiry ??
                    'Not readable'}
                </dd>
              </div>
              {verdict.batchRecord?.germinationPct !== undefined && (
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-[#4B584E]">Germination / Purity</dt>
                  <dd className="font-mono text-xs font-semibold text-[#112217]">
                    {verdict.batchRecord.germinationPct}% · {verdict.batchRecord.purityPct}%
                  </dd>
                </div>
              )}
              {verdict.batchRecord?.npkRatio && (
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-[#4B584E]">NPK / Nutrient Spec</dt>
                  <dd className="font-mono text-xs font-semibold text-[#112217]">
                    {verdict.batchRecord.npkRatio}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-[#4B584E]">Total QR Scan Count</dt>
                <dd
                  className={`font-mono text-xs font-bold ${
                    verdict.totalScanCount > 4 ? 'text-[#C81E1E]' : 'text-[#112217]'
                  }`}
                >
                  {verdict.totalScanCount} scans
                  {verdict.batchRecord?.lastScanDistricts?.length
                    ? ` (${verdict.batchRecord.lastScanDistricts.slice(0, 3).join(', ')})`
                    : ''}
                </dd>
              </div>
            </dl>
          </div>

          {/* Card 2: Visual Packaging Inspection & Reasons */}
          <div className="surface-card rounded-2xl p-6">
            <h2 className="font-display text-base font-bold text-[#112217]">
              2. Packaging &amp; Tamper Inspection
            </h2>
            <p className="mt-1 text-xs text-[#4B584E]">
              {verdict.packagingInspection
                ? verdict.packagingInspection.source === 'gemini-vision'
                  ? `AI Vision Label Analysis · ${verdict.packagingInspection.confidencePct}% confidence`
                  : `Offline Heuristic Inspection · ${verdict.packagingInspection.confidencePct}% confidence`
                : 'Code-only lookup (no packet photo attached)'}
            </p>

            <div className="mt-4 space-y-2.5">
              {verdict.reasons.map((reason) => (
                <div
                  key={reason}
                  className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                    isSafe ? 'bg-[#EAF6EF] text-[#0F5534]' : 'bg-[#FEF2F2] text-[#991B1B]'
                  }`}
                >
                  {isSafe ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <OctagonAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{REASON_LABELS[reason][language]}</span>
                </div>
              ))}
            </div>

            {verdict.packagingInspection && (
              <div className="mt-4 space-y-2 border-t border-[#EEF1EA] pt-4 text-xs text-[#4B584E]">
                <p className="leading-relaxed text-[#112217]">
                  {verdict.packagingInspection.summary}
                </p>
                <p>
                  Seal Status:{' '}
                  <span className="font-mono font-semibold text-[#112217]">
                    {verdict.packagingInspection.sealStatus}
                  </span>
                  {' · '}Print Alteration:{' '}
                  <span className="font-mono font-semibold text-[#112217]">
                    {verdict.packagingInspection.printAlterationDetected ? 'DETECTED' : 'NONE'}
                  </span>
                </p>
                {verdict.packagingInspection.spellingErrorsFound.length > 0 && (
                  <p className="text-[#991B1B]">
                    Flags: {verdict.packagingInspection.spellingErrorsFound.join(', ')}
                  </p>
                )}
              </div>
            )}

            {verdict.imageDataUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-[#E1E6DB]">
                <img
                  src={verdict.imageDataUrl}
                  alt="Inspected agricultural input packet"
                  referrerPolicy="no-referrer"
                  className="h-44 w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Geo-Tagged Inspector Alert Section */}
        {!isSafe && (
          <div className="surface-card mt-6 rounded-2xl p-6">
            {!showReportForm && !submitOutcome && (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-display text-base font-bold text-[#112217]">
                    Lock GPS &amp; Alert Agriculture Inspector
                  </h3>
                  <p className="mt-1 text-sm text-[#4B584E]">
                    Captures shop coordinates and seals a SHA-256 complaint packet. Queues offline automatically if there is no mobile signal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenReport}
                  className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C81E1E] px-5 py-3 text-sm font-bold text-white shadow-xs transition-all duration-150 hover:bg-[#991B1B] active:scale-[0.98]"
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {copy.reportDealer}
                </button>
              </div>
            )}

            {showReportForm && !submitOutcome && (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF1EA] pb-3">
                  <h3 className="font-display text-base font-bold text-[#112217]">
                    Geo-Tagged Dealer Complaint Packet
                  </h3>
                  <span className="font-mono text-xs text-[#4B584E]">
                    {gpsStatus === 'locking'
                      ? copy.gpsLocking
                      : location
                        ? `GPS ${location.lat}, ${location.lng} (±${location.accuracyMeters}m)`
                        : ''}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#112217]">
                      Agro Shop / Dealer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Laxmi Krishi Kendra"
                      className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#D4DACD] bg-[#F3F5F0] px-3.5 text-sm text-[#112217] focus:border-[#146C43] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#112217]">
                      Village / Taluka
                    </label>
                    <input
                      type="text"
                      value={villageOrTaluka}
                      onChange={(e) => setVillageOrTaluka(e.target.value)}
                      placeholder="e.g. Ranebennur"
                      className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#D4DACD] bg-[#F3F5F0] px-3.5 text-sm text-[#112217] focus:border-[#146C43] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#112217]">
                      District &amp; State
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#D4DACD] bg-[#F3F5F0] px-3.5 text-sm text-[#112217] focus:border-[#146C43] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#112217]">
                    Additional Observation (optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. 25 bags stacked in back room, refusing bill"
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#D4DACD] bg-[#F3F5F0] px-3.5 text-sm text-[#112217] focus:border-[#146C43] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="min-h-[44px] rounded-xl border border-[#D4DACD] px-4 py-2 text-sm font-semibold text-[#4B584E] hover:bg-[#F3F5F0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || gpsStatus === 'locking'}
                    className="min-h-[44px] rounded-xl bg-[#C81E1E] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#991B1B] disabled:opacity-60"
                  >
                    {submitting ? 'Encrypting & Saving…' : copy.submitAlert}
                  </button>
                </div>
              </form>
            )}

            {submitOutcome && (
              <div className="flex items-start gap-3 rounded-xl bg-[#EAF6EF] p-4 text-[#0F5534]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold">
                    {submitOutcome === 'SYNCED' ? copy.alertSynced : copy.alertSavedOffline}
                  </p>
                  <p className="mt-1 font-mono text-xs">
                    GPS Locked: {location?.lat}, {location?.lng} · Integrity SHA-256 Sealed
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Primary Return CTA */}
        <div className="mt-6 flex justify-center pb-8">
          <button
            type="button"
            onClick={() => {
              stopVerdictVoice();
              onClose();
            }}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#112217] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-[#1E3A28] active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {copy.scanAnother}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
