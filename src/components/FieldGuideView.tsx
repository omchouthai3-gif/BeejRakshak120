import React from 'react';
import { ArrowRight, Database, MapPin, QrCode, Volume2 } from 'lucide-react';

export const FieldGuideView: React.FC = () => {
  return (
    <div className="space-y-8">
      <section className="surface-card rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold text-[#146C43]">
          Digital India · 2026 Seed Act Traceability
        </p>
        <h1 className="font-display mt-1 text-2xl font-extrabold tracking-tight text-[#112217] sm:text-3xl">
          How BeejRakshak Protects Your Harvest
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#4B584E] sm:text-base">
          Instant dual-layer authentication at the village input counter—combining local batch registries with visual packaging forensics and regional voice alerts.
        </p>

        {/* System Architecture Flow Strip */}
        <div className="mt-6 grid gap-3 rounded-2xl border border-[#E1E6DB] bg-[#F3F5F0] p-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4">
            <p className="font-mono text-xs font-semibold text-[#146C43]">01 · Input Layer</p>
            <p className="font-display mt-1 text-sm font-bold text-[#112217]">
              QR + Front Label Capture
            </p>
            <p className="mt-1 text-xs text-[#4B584E]">
              Camera decodes Seed Act QR codes and photographs seals &amp; batch print.
            </p>
          </div>
          <div className="rounded-xl bg-white p-4">
            <p className="font-mono text-xs font-semibold text-[#146C43]">02 · Offline Engine</p>
            <p className="font-display mt-1 text-sm font-bold text-[#112217]">
              Clone, Expiry &amp; Seal Audit
            </p>
            <p className="mt-1 text-xs text-[#4B584E]">
              Cross-checks IndexedDB lots, device clock expiry, and label tampering.
            </p>
          </div>
          <div className="rounded-xl bg-white p-4">
            <p className="font-mono text-xs font-semibold text-[#146C43]">03 · Action Layer</p>
            <p className="font-display mt-1 text-sm font-bold text-[#112217]">
              Voice Verdict + GPS Alert
            </p>
            <p className="mt-1 text-xs text-[#4B584E]">
              Speaks Green/Red verdict regionally and queues GPS complaints offline.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E1E6DB] bg-[#F9FAF7] p-5">
            <div className="flex items-center gap-3">
              <QrCode className="h-5 w-5 text-[#146C43]" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-[#112217]">
                01. Dual Verification Beats Photocopied QRs
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#4B584E]">
              Counterfeiters often photocopy one genuine QR code onto 500 fake bags. BeejRakshak cross-checks both QR scan velocity across districts and visual packaging markers (peeling seals, smudged stamps, and spelling typos).
            </p>
          </div>

          <div className="rounded-2xl border border-[#E1E6DB] bg-[#F9FAF7] p-5">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-[#146C43]" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-[#112217]">
                02. 100% Offline-First Regional Registry
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#4B584E]">
              Compressed state seed and fertilizer registries live directly inside your phone&apos;s IndexedDB storage. Even inside metal-roofed village godowns with zero signal, expiry and batch authenticity verify instantaneously.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E1E6DB] bg-[#F9FAF7] p-5">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-[#146C43]" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-[#112217]">
                03. Voice-First Verdict in Local Languages
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#4B584E]">
              Mandatory seed tables are printed in tiny English text. BeejRakshak flashes an unmistakable full-screen Green or Red signal and speaks the reason aloud in Hindi, Marathi, Kannada, or English.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E1E6DB] bg-[#F9FAF7] p-5">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[#146C43]" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-[#112217]">
                04. Geo-Tagged Inspector Accountability
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#4B584E]">
              When a packet fails, one tap locks satellite GPS coordinates and seals a SHA-256 tamper-proof report packet—queuing offline and syncing directly to the District Agriculture Inspector Desk once signal returns.
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-[#112217]">
          3-Step Shop Counter Checklist Before You Pay
        </h2>
        <ol className="mt-4 divide-y divide-[#EEF1EA] text-sm">
          <li className="flex items-start gap-3 py-4">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#146C43]" aria-hidden="true" />
            <div>
              <span className="font-display font-bold text-[#112217]">Step 1 · Inspect the Seal:</span>{' '}
              <span className="text-[#4B584E]">
                Authentic pouches carry an embossed hologram or stitched Seed Certification tag—never buy packets with peeling over-stickers or overwritten ink dates.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3 py-4">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#146C43]" aria-hidden="true" />
            <div>
              <span className="font-display font-bold text-[#112217]">Step 2 · Scan Before Opening:</span>{' '}
              <span className="text-[#4B584E]">
                Hold the unopened bag under BeejRakshak&apos;s camera and listen for the Green confirmation before paying cash or UPI.
              </span>
            </div>
          </li>
          <li className="flex items-start gap-3 py-4">
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#146C43]" aria-hidden="true" />
            <div>
              <span className="font-display font-bold text-[#112217]">Step 3 · Report Flagged Stock:</span>{' '}
              <span className="text-[#4B584E]">
                If the screen turns Red, walk away and submit the GPS-locked alert so your district Seed Inspector can seize the counterfeit lot.
              </span>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
};
