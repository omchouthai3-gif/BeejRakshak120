import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));
app.use('/api', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const DATA_DIR = path.resolve(process.cwd(), 'data');
const ALERTS_FILE = path.join(DATA_DIR, 'inspector-alerts.json');

interface ServerAlertRecord {
  id: string;
  createdAt: string;
  verdictId: string;
  productName: string;
  batchNumber: string;
  qrSerial: string;
  manufacturer: string;
  reasons: string[];
  shopName: string;
  villageOrTaluka: string;
  district: string;
  notes: string;
  location: {
    lat: number;
    lng: number;
    accuracyMeters: number;
    source: string;
    label: string;
  };
  integrityHash: string;
  syncStatus: 'SYNCED';
  resolutionStatus: 'OPEN' | 'INVESTIGATING' | 'ACTION_TAKEN';
  evidenceImage?: string;
}

const INITIAL_ALERTS: ServerAlertRecord[] = [];

function ensureAlertsFile(): ServerAlertRecord[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ALERTS_FILE)) {
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(INITIAL_ALERTS, null, 2), 'utf-8');
    return INITIAL_ALERTS;
  }
  try {
    const raw = fs.readFileSync(ALERTS_FILE, 'utf-8');
    return JSON.parse(raw) as ServerAlertRecord[];
  } catch {
    return INITIAL_ALERTS;
  }
}

function saveAlertsFile(records: ServerAlertRecord[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(ALERTS_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'BeejRakshak/1.0',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'BeejRakshak API',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

app.get('/api/alerts', (_req, res) => {
  const alerts = ensureAlertsFile();
  res.json({ alerts });
});

app.post('/api/alerts', (req, res) => {
  const incoming = req.body as Partial<ServerAlertRecord>;
  if (!incoming || !incoming.id || !incoming.batchNumber || !incoming.shopName) {
    res.status(400).json({ error: 'Missing required alert fields (id, batchNumber, shopName).' });
    return;
  }
  const existing = ensureAlertsFile();
  const idx = existing.findIndex((a) => a.id === incoming.id);
  const record: ServerAlertRecord = {
    id: incoming.id,
    createdAt: incoming.createdAt ?? new Date().toISOString(),
    verdictId: incoming.verdictId ?? 'VRD-UNKNOWN',
    productName: incoming.productName ?? 'Unregistered Agricultural Input',
    batchNumber: incoming.batchNumber,
    qrSerial: incoming.qrSerial ?? 'UNKNOWN',
    manufacturer: incoming.manufacturer ?? 'Unknown Manufacturer',
    reasons: Array.isArray(incoming.reasons) ? incoming.reasons : ['UNREGISTERED_BATCH'],
    shopName: incoming.shopName,
    villageOrTaluka: incoming.villageOrTaluka ?? '',
    district: incoming.district ?? 'Unknown District',
    notes: incoming.notes ?? '',
    location: incoming.location ?? {
      lat: 0,
      lng: 0,
      accuracyMeters: 0,
      source: 'district-fallback',
      label: 'Unavailable',
    },
    integrityHash: incoming.integrityHash ?? '',
    syncStatus: 'SYNCED',
    resolutionStatus: incoming.resolutionStatus ?? 'OPEN',
    evidenceImage: incoming.evidenceImage,
  };
  if (idx >= 0) {
    existing[idx] = record;
  } else {
    existing.unshift(record);
  }
  saveAlertsFile(existing);
  res.status(201).json({ alert: record });
});

app.patch('/api/alerts/:id', (req, res) => {
  const { id } = req.params;
  const { resolutionStatus } = req.body as { resolutionStatus?: ServerAlertRecord['resolutionStatus'] };
  if (!resolutionStatus || !['OPEN', 'INVESTIGATING', 'ACTION_TAKEN'].includes(resolutionStatus)) {
    res.status(400).json({ error: 'Invalid resolutionStatus.' });
    return;
  }
  const alerts = ensureAlertsFile();
  const target = alerts.find((a) => a.id === id);
  if (!target) {
    res.status(404).json({ error: 'Alert not found.' });
    return;
  }
  target.resolutionStatus = resolutionStatus;
  saveAlertsFile(alerts);
  res.json({ alert: target });
});

app.post('/api/inspect-package', async (req, res) => {
  const { imageBase64, mimeType, todayIso } = req.body as {
    imageBase64?: string;
    mimeType?: string;
    todayIso?: string;
  };

  if (!imageBase64) {
    res.status(400).json({ error: 'imageBase64 is required.' });
    return;
  }

  const ai = getAiClient();
  if (!ai) {
    res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server. Offline heuristic verification remains active.',
    });
    return;
  }

  try {
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `You are an agricultural seed & fertilizer packaging forensics inspector in India. Today's date is ${todayIso || new Date().toISOString().slice(0, 10)}.
Inspect this packet photo carefully for:
1. Visible batch number / lot number, expiry date, and brand/manufacturer name.
2. Spelling errors, gibberish text, or brand impersonation typos on English or regional labels.
3. Tampering signs: peeling/crooked hologram or "GENUINE SEEDS" sticker seals, smudged/overwritten batch stamps, faded/low-grade counterfeit printing.
4. Whether the printed expiry date is already past today's date (${todayIso || new Date().toISOString().slice(0, 10)}).
Return precise structured JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            labelTampered: {
              type: Type.BOOLEAN,
              description: 'True if seal is peeling/fake, ink is smudged/overwritten, or print looks counterfeit.',
            },
            spellingErrorsFound: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of suspicious spelling mistakes or garbled text found on packaging.',
            },
            sealStatus: {
              type: Type.STRING,
              description: 'One of INTACT, PEELING_OR_FAKE, MISSING, UNCHECKED',
            },
            printAlterationDetected: {
              type: Type.BOOLEAN,
              description: 'True if batch/expiry stamp appears smudged, scratched, or altered.',
            },
            extractedBatchNo: {
              type: Type.STRING,
              description: 'Batch or lot number visible on the packet, or empty string if unreadable.',
            },
            extractedExpiry: {
              type: Type.STRING,
              description: 'Expiry date printed on the packet (e.g. 11/2025 or 13 NOV 2025), or empty string.',
            },
            extractedBrand: {
              type: Type.STRING,
              description: 'Brand or product name printed on the packet.',
            },
            confidencePct: {
              type: Type.INTEGER,
              description: 'Inspection confidence percentage 0-100.',
            },
            summary: {
              type: Type.STRING,
              description: 'Concise 1-2 sentence forensic summary in plain English.',
            },
          },
          required: [
            'labelTampered',
            'spellingErrorsFound',
            'sealStatus',
            'printAlterationDetected',
            'extractedBatchNo',
            'extractedExpiry',
            'extractedBrand',
            'confidencePct',
            'summary',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      labelTampered?: boolean;
      spellingErrorsFound?: string[];
      sealStatus?: string;
      printAlterationDetected?: boolean;
      extractedBatchNo?: string;
      extractedExpiry?: string;
      extractedBrand?: string;
      confidencePct?: number;
      summary?: string;
    };

    const validSeals = ['INTACT', 'PEELING_OR_FAKE', 'MISSING', 'UNCHECKED'] as const;
    const sealStatus = validSeals.includes(parsed.sealStatus as (typeof validSeals)[number])
      ? (parsed.sealStatus as (typeof validSeals)[number])
      : 'UNCHECKED';

    res.json({
      inspection: {
        source: 'gemini-vision',
        labelTampered: Boolean(parsed.labelTampered),
        spellingErrorsFound: Array.isArray(parsed.spellingErrorsFound) ? parsed.spellingErrorsFound : [],
        sealStatus,
        printAlterationDetected: Boolean(parsed.printAlterationDetected),
        extractedBatchNo: parsed.extractedBatchNo?.trim() || null,
        extractedExpiry: parsed.extractedExpiry?.trim() || null,
        extractedBrand: parsed.extractedBrand?.trim() || null,
        confidencePct: typeof parsed.confidencePct === 'number' ? parsed.confidencePct : 85,
        summary: parsed.summary || 'Visual packaging inspection completed.',
      },
    });
  } catch (err) {
    console.error('Gemini Vision inspection error:', err);
    res.status(502).json({
      error: err instanceof Error ? err.message : 'Gemini Vision request failed.',
    });
  }
});

app.post('/api/tts', async (req, res) => {
  const { text, language } = req.body as { text?: string; language?: string };
  if (!text) {
    res.status(400).json({ error: 'text is required.' });
    return;
  }

  const ai = getAiClient();
  if (!ai) {
    res.status(503).json({ error: 'GEMINI_API_KEY not configured for TTS.' });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: `Clear, warm, reassuring Indian agricultural advisor speaking ${language || 'English'} slowly and clearly for rural farmers`,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      res.status(502).json({ error: 'No audio payload returned from TTS model.' });
      return;
    }

    res.json({
      mimeType: 'audio/wav',
      base64Audio,
    });
  } catch (err) {
    console.error('Gemini TTS error:', err);
    res.status(502).json({
      error: err instanceof Error ? err.message : 'TTS generation failed.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BeejRakshak server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
