export type LanguageCode = 'en' | 'hi' | 'mr' | 'kn';

export type ProductCategory = 'seed' | 'fertilizer';

export type RegistryStatus = 'VALID' | 'EXPIRED' | 'BLACKLISTED' | 'CLONED';

export type VerdictType = 'SAFE' | 'FAKE';

export type VerdictReason =
  | 'VERIFIED_AUTHENTIC'
  | 'CLONED_QR'
  | 'EXPIRED_STOCK'
  | 'TAMPERED_LABEL'
  | 'BLACKLISTED_BATCH'
  | 'UNREGISTERED_BATCH';

export interface SeedBatchRecord {
  id: string;
  qrSerial: string;
  batchNumber: string;
  productName: string;
  cropOrType: string;
  category: ProductCategory;
  manufacturer: string;
  licenseNumber: string;
  regionPack: string;
  state: string;
  mfgDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  germinationPct?: number;
  purityPct?: number;
  npkRatio?: string;
  netWeight: string;
  mrpInr: number;
  registryStatus: RegistryStatus;
  knownScanCount: number;
  lastScanDistricts: string[];
  sealPatternNote: string;
}

export interface PackagingInspectionResult {
  source: 'gemini-vision' | 'offline-heuristic';
  labelTampered: boolean;
  spellingErrorsFound: string[];
  sealStatus: 'INTACT' | 'PEELING_OR_FAKE' | 'MISSING' | 'UNCHECKED';
  printAlterationDetected: boolean;
  extractedBatchNo: string | null;
  extractedExpiry: string | null;
  extractedBrand: string | null;
  confidencePct: number;
  summary: string;
}

export interface VerificationVerdict {
  id: string;
  timestamp: string;
  verdict: VerdictType;
  reasons: VerdictReason[];
  primaryReason: VerdictReason;
  mode: 'online-dual' | 'offline-dual';
  inputMethod: 'camera-qr' | 'photo-upload' | 'manual-code' | 'field-sample';
  scannedCode: string;
  batchRecord: SeedBatchRecord | null;
  packagingInspection: PackagingInspectionResult | null;
  localScanCount: number;
  totalScanCount: number;
  imageDataUrl?: string;
  voiceSummary: Record<LanguageCode, string>;
}

export interface GeoLocationData {
  lat: number;
  lng: number;
  accuracyMeters: number;
  source: 'gps' | 'district-fallback';
  label: string;
}

export interface InspectorAlertPacket {
  id: string;
  createdAt: string;
  verdictId: string;
  productName: string;
  batchNumber: string;
  qrSerial: string;
  manufacturer: string;
  reasons: VerdictReason[];
  shopName: string;
  villageOrTaluka: string;
  district: string;
  notes: string;
  location: GeoLocationData;
  integrityHash: string;
  syncStatus: 'QUEUED_OFFLINE' | 'SYNCED';
  resolutionStatus: 'OPEN' | 'INVESTIGATING' | 'ACTION_TAKEN';
  evidenceImage?: string;
}

export interface RegionalPackMeta {
  id: string;
  name: string;
  state: string;
  batchCount: number;
  sizeKb: number;
  updatedAt: string;
  downloaded: boolean;
}
