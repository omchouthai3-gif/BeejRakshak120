import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  OctagonAlert,
  QrCode,
  Search,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import jsQR from 'jsqr';
import { UI_COPY } from '../data/translations.ts';
import type { LanguageCode, VerificationVerdict } from '../types.ts';

interface VerifyWorkspaceProps {
  language: LanguageCode;
  isOnline: boolean;
  isVerifying: boolean;
  recentVerdicts: VerificationVerdict[];
  onRunVerification: (params: {
    scannedCode?: string;
    imageDataUrl?: string;
    inputMethod: VerificationVerdict['inputMethod'];
  }) => Promise<void>;
  onSelectRecentVerdict: (verdict: VerificationVerdict) => void;
}

export const VerifyWorkspace: React.FC<VerifyWorkspaceProps> = ({
  language,
  isOnline,
  isVerifying,
  recentVerdicts,
  onRunVerification,
  onSelectRecentVerdict,
}) => {
  const copy = UI_COPY[language];

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [liveQrHit, setLiveQrHit] = useState<string | null>(null);
  const [scanPulse, setScanPulse] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);

  const stopCamera = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setLiveQrHit(null);
    setTorchOn(false);
    setScanPulse(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const scanFrameLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (qr && qr.data) {
          setLiveQrHit(qr.data);
          setScanPulse(true);
          setAiHint(
            isOnline
              ? 'QR locked · Gemini Vision is inspecting packaging for seals, batch stamps & tampering…'
              : 'QR locked · Running offline heuristic packaging check…'
          );
          const snapshot = canvas.toDataURL('image/jpeg', 0.86);
          stopCamera();
          onRunVerification({
            scannedCode: qr.data,
            imageDataUrl: snapshot,
            inputMethod: 'camera-qr',
          }).finally(() => {
            setScanPulse(false);
            setAiHint(null);
          });
          return;
        }
      }
    }
    rafRef.current = requestAnimationFrame(scanFrameLoop);
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()?.[0];
    if (!track) return;
    const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
    if (!capabilities?.torch) {
      setCameraError('Torch / flashlight is not available on this device camera.');
      return;
    }
    try {
      await track.applyConstraints({
        // @ts-expect-error – torch is a non-standard constraint supported on many Android WebViews
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn((v) => !v);
    } catch {
      setCameraError('Could not toggle torch on this device.');
    }
  };

  const handleStartCamera = async () => {
    setCameraError(null);
    setAiHint(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera access is not supported on this device. Please upload a packet photo or enter the batch / QR code manually.'
      );
      return;
    }
    try {
      // Prefer high-res rear camera for QR + label forensics on Android / mobile
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTorchOn(false);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play().catch(() => {});
          rafRef.current = requestAnimationFrame(scanFrameLoop);
        }
      });
    } catch {
      setCameraError(
        'Camera permission was declined or no camera was detected. On Android, grant Camera permission in system settings, then retry. Or use "Upload Packet Photo".'
      );
    }
  };

  const handleCaptureCameraPhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setAiHint(
      isOnline
        ? 'Capturing · Gemini Vision AI is inspecting seals, batch stamps & packaging integrity…'
        : 'Capturing · Offline packaging heuristic is running…'
    );
    stopCamera();
    try {
      await onRunVerification({
        imageDataUrl: dataUrl,
        inputMethod: 'camera-qr',
      });
    } finally {
      setAiHint(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
      if (dataUrl) {
        setAiHint(
          isOnline
            ? 'Photo loaded · Gemini Vision AI is inspecting the packet for tampering…'
            : 'Photo loaded · Offline heuristic packaging check…'
        );
        try {
          await onRunVerification({
            imageDataUrl: dataUrl,
            inputMethod: 'photo-upload',
          });
        } finally {
          setAiHint(null);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await onRunVerification({
      scannedCode: manualCode.trim(),
      inputMethod: 'manual-code',
    });
  };

  return (
    <div className="space-y-10">
      {/* Primary Verification Console */}
      <section className="grid items-stretch gap-6 lg:grid-cols-12">
        {/* Left: Optical Camera & Label Forensics Console */}
        <div className="surface-card flex flex-col justify-between rounded-3xl p-6 sm:p-8 lg:col-span-7">
          <div>
            <p className="text-xs font-semibold text-[#146C43]">
              Seed Act 2026 Traceability · Instant Shop Counter Check
            </p>
            <h1 className="font-display text-balance mt-2 text-3xl font-extrabold tracking-[-0.02em] text-[#112217] sm:text-4xl">
              {copy.scanHeroTitle}
            </h1>
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-[#4B584E] sm:text-base">
              {copy.scanHeroSub}
            </p>
            <p className="mt-3 text-xs font-medium text-[#5D6B60] tabular-nums">
              12 Regional Lots Cached · 4 Regional Voices · 0 KB Signal Required
            </p>
          </div>

          {/* Precision Viewfinder Frame – Integrated Scanner */}
          <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#22392B] bg-[#0E1E14]">
            {cameraActive ? (
              <div className="relative aspect-[16/10] w-full bg-black">
                <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
                  <div className={`relative h-48 w-48 transition-all ${scanPulse ? 'scale-110' : ''}`}>
                    <span className={`absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-[3px] border-t-[3px] ${liveQrHit ? 'border-[#F2C94C]' : 'border-[#34D399]'}`} />
                    <span className={`absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-[3px] border-t-[3px] ${liveQrHit ? 'border-[#F2C94C]' : 'border-[#34D399]'}`} />
                    <span className={`absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-[3px] border-l-[3px] ${liveQrHit ? 'border-[#F2C94C]' : 'border-[#34D399]'}`} />
                    <span className={`absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-[3px] border-r-[3px] ${liveQrHit ? 'border-[#F2C94C]' : 'border-[#34D399]'}`} />
                    <div className="animate-scan-sweep absolute inset-x-2 top-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#34D399] to-transparent" />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-xs font-medium text-white">
                      {liveQrHit ? `Locked: ${liveQrHit}` : 'Align QR or front label inside frame'}
                    </span>
                  </div>
                </div>
                {/* Live status chip */}
                <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#34D399] backdrop-blur-sm">
                  Live QR + AI Scanner
                </div>
              </div>
            ) : (
              <div className="relative flex aspect-[16/10] flex-col items-center justify-center px-6 py-8 text-center text-white">
                <div className="pointer-events-none relative flex h-40 w-56 flex-col items-center justify-center">
                  <span className="absolute left-0 top-0 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-[#34D399]/70" />
                  <span className="absolute right-0 top-0 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-[#34D399]/70" />
                  <span className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-[#34D399]/70" />
                  <span className="absolute bottom-0 right-0 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-[#34D399]/70" />

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                    <QrCode className="h-7 w-7 text-[#F2C94C]" aria-hidden="true" />
                  </div>
                  <p className="font-display mt-3 text-base font-bold tracking-tight">
                    Integrated Dual-Engine Scanner
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#C6D1C9]">
                    Live QR decode + Gemini Vision AI packaging forensics (seals, stamps, expiry, tampering). Works offline with local heuristics.
                  </p>
                </div>
              </div>
            )}

            {(isVerifying || aiHint) && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0E1E14]/90 text-white backdrop-blur-xs">
                <Loader2 className="h-8 w-8 animate-spin text-[#34D399]" aria-hidden="true" />
                <p className="font-display mt-3 text-sm font-bold">
                  {aiHint ? 'AI Model Running…' : 'Running Dual Verification…'}
                </p>
                <p className="mt-1 max-w-xs px-4 text-center font-mono text-xs text-[#C6D1C9]">
                  {aiHint ?? 'Checking IndexedDB registry & packaging integrity'}
                </p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {cameraError && (
            <p className="mt-3 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-2.5 text-xs font-medium text-[#991B1B]">
              {cameraError}
            </p>
          )}

          {aiHint && !isVerifying && (
            <p className="mt-3 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] px-4 py-2.5 text-xs font-medium text-[#146C43]">
              {aiHint}
            </p>
          )}

          {/* Thumb-Friendly Primary Action Row */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {cameraActive ? (
              <>
                <button
                  type="button"
                  onClick={handleCaptureCameraPhoto}
                  disabled={isVerifying}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#146C43] px-5 py-3 text-sm font-bold text-white shadow-xs transition-all duration-150 hover:bg-[#0F5534] active:scale-[0.98] disabled:opacity-60"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  {copy.captureInspect}
                </button>
                <button
                  type="button"
                  onClick={toggleTorch}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#D4DACD] bg-white px-5 py-3 text-sm font-semibold text-[#112217] transition-colors hover:bg-[#F3F5F0]"
                >
                  <span className="text-base leading-none" aria-hidden="true">{torchOn ? '🔦' : '💡'}</span>
                  {torchOn ? 'Torch On' : 'Torch'}
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#D4DACD] bg-white px-5 py-3 text-sm font-semibold text-[#112217] transition-colors hover:bg-[#F3F5F0] sm:col-span-2"
                >
                  <CameraOff className="h-4 w-4" aria-hidden="true" />
                  {copy.stopCamera}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStartCamera}
                  disabled={isVerifying}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#146C43] px-5 py-3 text-sm font-bold text-white shadow-xs transition-all duration-150 hover:bg-[#0F5534] active:scale-[0.98] disabled:opacity-60"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  {copy.startCamera}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isVerifying}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#D4DACD] bg-white px-5 py-3 text-sm font-semibold text-[#112217] transition-all duration-150 hover:bg-[#F3F5F0] active:scale-[0.98] disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {copy.uploadPhoto}
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Right: Manual Batch Lookup + Recent Counter Checks */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="surface-card rounded-3xl p-6">
            <h2 className="font-display text-lg font-bold text-[#112217]">
              Manual Batch / QR Lookup
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#4B584E]">
              If a QR label is scratched or faded, type the batch number printed on the packet to check expiry and scan velocity offline.
            </p>

            <form onSubmit={handleManualSubmit} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B584E]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder={copy.manualPlaceholder}
                  className="min-h-[46px] w-full rounded-xl border border-[#D4DACD] bg-[#F3F5F0] pl-10 pr-3 font-mono text-xs text-[#112217] placeholder:font-sans placeholder:text-[#6B786E] focus:border-[#146C43] focus:bg-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying || !manualCode.trim()}
                className="min-h-[46px] shrink-0 whitespace-nowrap rounded-xl bg-[#112217] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#1E3A28] active:scale-[0.98] disabled:opacity-45"
              >
                {copy.verifyButton}
              </button>
            </form>

            </div>

          <div className="surface-card flex flex-1 flex-col justify-between rounded-3xl p-6">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-[#112217]">
                  Recent Counter Checks
                </h2>
                <span className="font-mono text-xs font-medium text-[#4B584E]">
                  {isOnline ? 'AI + Registry' : 'Offline Registry'}
                </span>
              </div>

              {recentVerdicts.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-[#D4DACD] bg-[#F9FAF7] p-5 text-center">
                  <p className="text-sm font-medium text-[#112217]">No packets scanned yet</p>
                  <p className="mt-1 text-xs text-[#4B584E]">
                    Scan a packet QR or upload a photo to see the full-screen voice verdict.
                  </p>
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-[#EEF1EA]">
                  {recentVerdicts.slice(0, 4).map((item) => {
                    const safe = item.verdict === 'SAFE';
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onSelectRecentVerdict(item)}
                          className="flex w-full min-h-[58px] items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[#F3F5F0]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {safe ? (
                              <CheckCircle2
                                className="h-5 w-5 shrink-0 text-[#0F7B43]"
                                aria-hidden="true"
                              />
                            ) : (
                              <OctagonAlert
                                className="h-5 w-5 shrink-0 text-[#C81E1E]"
                                aria-hidden="true"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#112217]">
                                {item.batchRecord?.productName ?? item.scannedCode}
                              </p>
                              <p className="truncate font-mono text-[11px] text-[#4B584E]">
                                {item.scannedCode} ·{' '}
                                {new Date(item.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 font-mono text-xs font-bold ${
                              safe ? 'text-[#0F7B43]' : 'text-[#C81E1E]'
                            }`}
                          >
                            {item.verdict}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
