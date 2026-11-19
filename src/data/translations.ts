import type { LanguageCode, VerdictReason } from '../types.ts';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  speechLang: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', speechLang: 'en-IN' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', speechLang: 'hi-IN' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', speechLang: 'mr-IN' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', speechLang: 'kn-IN' },
];

export const UI_COPY: Record<
  LanguageCode,
  {
    tagline: string;
    navVerify: string;
    navRegistry: string;
    navAlerts: string;
    navGuide: string;
    offlineBadge: string;
    onlineBadge: string;
    simulateOffline: string;
    scanHeroTitle: string;
    scanHeroSub: string;
    startCamera: string;
    stopCamera: string;
    captureInspect: string;
    uploadPhoto: string;
    manualPlaceholder: string;
    verifyButton: string;
    sampleBenchTitle: string;
    sampleBenchSub: string;
    verdictSafeTitle: string;
    verdictSafeSub: string;
    verdictFakeTitle: string;
    verdictFakeSub: string;
    listenVoice: string;
    stopVoice: string;
    reportDealer: string;
    scanAnother: string;
    gpsLocking: string;
    submitAlert: string;
    alertSavedOffline: string;
    alertSynced: string;
  }
> = {
  en: {
    tagline: 'Instant offline seed & fertilizer verification before you pay',
    navVerify: 'Verify Packet',
    navRegistry: 'Offline Registry',
    navAlerts: 'Inspector Desk',
    navGuide: 'Field Guide',
    offlineBadge: 'Offline Mode · Local Registry Active',
    onlineBadge: 'Connected · AI + Registry Sync Ready',
    simulateOffline: 'Zero-Signal Shop Mode',
    scanHeroTitle: 'Verify before you sow',
    scanHeroSub:
      'Scan the packet QR code or snap the front label. Works inside zero-signal village shops using your downloaded batch registry.',
    startCamera: 'Open Camera Scanner',
    stopCamera: 'Close Camera',
    captureInspect: 'Capture & Inspect Label',
    uploadPhoto: 'Upload Packet Photo',
    manualPlaceholder: 'Enter QR serial or batch number (e.g. SH1124C21)',
    verifyButton: 'Verify Now',
    sampleBenchTitle: 'How verification works',
    sampleBenchSub: 'Scan a packet QR or upload a photo. Online mode uses Gemini Vision; offline mode uses the local registry.',
    verdictSafeTitle: 'SAFE TO BUY',
    verdictSafeSub: 'Verified against Seed Act 2026 registry & packaging check',
    verdictFakeTitle: 'DO NOT BUY — RISK DETECTED',
    verdictFakeSub: 'Packet failed authenticity, expiry, or label integrity checks',
    listenVoice: 'Hear Voice Verdict',
    stopVoice: 'Stop Audio',
    reportDealer: 'Report Dealer (Lock GPS)',
    scanAnother: 'Scan Next Packet',
    gpsLocking: 'Locking shop GPS coordinates…',
    submitAlert: 'Queue Inspector Alert',
    alertSavedOffline: 'Saved to encrypted offline queue — will auto-sync when signal returns.',
    alertSynced: 'Alert transmitted to District Agriculture Inspector Desk.',
  },
  hi: {
    tagline: 'खरीदने से पहले बीज और खाद की तुरंत ऑफ़लाइन जाँच',
    navVerify: 'पैकेट जाँचें',
    navRegistry: 'ऑफ़लाइन रजिस्ट्री',
    navAlerts: 'इंस्पेक्टर डेस्क',
    navGuide: 'गाइड',
    offlineBadge: 'ऑफ़लाइन मोड · लोकल डेटा सक्रिय',
    onlineBadge: 'ऑनलाइन · AI और रजिस्ट्री सिंक चालू',
    simulateOffline: 'बिना नेटवर्क (गाँव) मोड',
    scanHeroTitle: 'बोने से पहले असली बीज की पहचान करें',
    scanHeroSub:
      'पैकेट का QR कोड स्कैन करें या सामने के लेबल की फ़ोटो लें। बिना इंटरनेट वाले गाँव की दुकान में भी काम करता है।',
    startCamera: 'कैमरा स्कैनर खोलें',
    stopCamera: 'कैमरा बंद करें',
    captureInspect: 'फ़ोटो लें और लेबल जाँचें',
    uploadPhoto: 'पैकेट की फ़ोटो चुनें',
    manualPlaceholder: 'QR या बैच नंबर लिखें (जैसे SH1124C21)',
    verifyButton: 'अभी जाँचें',
    sampleBenchTitle: 'सत्यापन कैसे काम करता है',
    sampleBenchSub: 'पैकेट का QR स्कैन करें या फोटो अपलोड करें। ऑनलाइन मोड में Gemini Vision, ऑफलाइन में स्थानीय रजिस्ट्री।',
    verdictSafeTitle: 'खरीदने के लिए सुरक्षित',
    verdictSafeSub: 'बीज अधिनियम 2026 रजिस्ट्री और पैकेट जाँच में सही पाया गया',
    verdictFakeTitle: 'सावधान! नकली या खराब माल',
    verdictFakeSub: 'यह पैकेट सुरक्षा, एक्सपायरी या लेबल जाँच में फेल हो गया है',
    listenVoice: 'आवाज़ में सुनें',
    stopVoice: 'आवाज़ रोकें',
    reportDealer: 'दुकानदार की शिकायत करें (GPS)',
    scanAnother: 'अगला पैकेट जाँचें',
    gpsLocking: 'दुकान की GPS लोकेशन लॉक हो रही है…',
    submitAlert: 'कृषि अधिकारी को शिकायत भेजें',
    alertSavedOffline: 'ऑफ़लाइन शिकायत सुरक्षित — नेटवर्क आते ही अपने-आप भेज दी जाएगी।',
    alertSynced: 'शिकायत जिला कृषि निरीक्षक को भेज दी गई है।',
  },
  mr: {
    tagline: 'खरेदीपूर्वी बियाणे आणि खतांची तात्काळ ऑफलाइन तपासणी',
    navVerify: 'पॅकेट तपासा',
    navRegistry: 'ऑफलाइन नोंदणी',
    navAlerts: 'तपासणी कक्ष',
    navGuide: 'मार्गदर्शक',
    offlineBadge: 'ऑफलाइन मोड · स्थानिक डेटा सक्रिय',
    onlineBadge: 'ऑनलाइन · AI आणि नोंदणी सिंक सुरू',
    simulateOffline: 'नेटवर्कशिवाय (गाव) मोड',
    scanHeroTitle: 'पेरणीपूर्वी बियाण्यांची खात्री करा',
    scanHeroSub:
      'पॅकेटचा QR कोड स्कॅन करा किंवा पुढील लेबलचा फोटो काढा. नेटवर्क नसलेल्या गावातील दुकानातही पूर्णपणे काम करते.',
    startCamera: 'कॅमेरा स्कॅनर उघडा',
    stopCamera: 'कॅमेरा बंद करा',
    captureInspect: 'फोटो काढा आणि तपासा',
    uploadPhoto: 'पॅकेटचा फोटो निवडा',
    manualPlaceholder: 'QR किंवा बॅच क्रमांक टाका (उदा. SH1124C21)',
    verifyButton: 'आत्ता तपासा',
    sampleBenchTitle: 'पडताळणी कशी होते',
    sampleBenchSub: 'पॅकेटचा QR स्कॅन करा किंवा फोटो अपलोड करा. ऑनलाइन Gemini Vision; ऑफलाइन स्थानिक नोंदणी.',
    verdictSafeTitle: 'खरेदीसाठी सुरक्षित',
    verdictSafeSub: 'बियाणे कायदा २०२६ नोंदणी आणि लेबल तपासणीत अस्सल आढळले',
    verdictFakeTitle: 'सावधान! बनावट किंवा मुदतबाह्य माल',
    verdictFakeSub: 'हे पॅकेट अस्सलपणा, मुदत किंवा सील तपासणीत नापास झाले आहे',
    listenVoice: 'आवाजात ऐका',
    stopVoice: 'आवाज थांबवा',
    reportDealer: 'विक्रेत्याची तक्रार करा (GPS)',
    scanAnother: 'पुढील पॅकेट तपासा',
    gpsLocking: 'दुकानाचे GPS स्थान नोंदवत आहे…',
    submitAlert: 'कृषी अधिकाऱ्यांकडे तक्रार पाठवा',
    alertSavedOffline: 'ऑफलाइन तक्रार जतन केली — नेटवर्क मिळताच आपोआप पाठवली जाईल.',
    alertSynced: 'जिल्हा कृषी निरीक्षकांकडे तक्रार पाठवली आहे.',
  },
  kn: {
    tagline: 'ಖರೀದಿಸುವ ಮೊದಲು ಬೀಜ ಮತ್ತು ರಸಗೊಬ್ಬರದ ತಕ್ಷಣದ ಆಫ್‌ಲೈನ್ ಪರಿಶೀಲನೆ',
    navVerify: 'ಪ್ಯಾಕೆಟ್ ಪರಿಶೀಲಿಸಿ',
    navRegistry: 'ಆಫ್‌ಲೈನ್ ನೋಂದಣಿ',
    navAlerts: 'ಇನ್‌ಸ್ಪೆಕ್ಟರ್ ಡೆಸ್ಕ್',
    navGuide: 'ಮಾರ್ಗದರ್ಶಿ',
    offlineBadge: 'ಆಫ್‌ಲೈನ್ ಮೋಡ್ · ಸ್ಥಳೀಯ ಡೇಟಾ ಸಕ್ರಿಯ',
    onlineBadge: 'ಆನ್‌ಲೈನ್ · AI ಮತ್ತು ಡೇಟಾ ಸಿಂಕ್ ಸಿದ್ಧ',
    simulateOffline: 'ಸಿಗ್ನಲ್ ಇಲ್ಲದ ಅಂಗಡಿ ಮೋಡ್',
    scanHeroTitle: 'ಬಿತ್ತನೆ ಮಾಡುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ',
    scanHeroSub:
      'ಪ್ಯಾಕೆಟ್ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಮುಂಭಾಗದ ಲೇಬಲ್ ಫೋಟೋ ತೆಗೆಯಿರಿ. ಸಿಗ್ನಲ್ ಇಲ್ಲದ ಹಳ್ಳಿ ಅಂಗಡಿಗಳಲ್ಲೂ ಕೆಲಸ ಮಾಡುತ್ತದೆ.',
    startCamera: 'ಕ್ಯಾಮೆರಾ ಸ್ಕ್ಯಾನರ್ ತೆರೆಯಿರಿ',
    stopCamera: 'ಕ್ಯಾಮೆರಾ ಮುಚ್ಚಿ',
    captureInspect: 'ಫೋಟೋ ತೆಗೆದು ಪರಿಶೀಲಿಸಿ',
    uploadPhoto: 'ಪ್ಯಾಕೆಟ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    manualPlaceholder: 'QR ಅಥವಾ ಬ್ಯಾಚ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (ಉದಾ. SH1124C21)',
    verifyButton: 'ಈಗ ಪರಿಶೀಲಿಸಿ',
    sampleBenchTitle: 'ಪರಿಶೀಲನೆ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ',
    sampleBenchSub: 'ಪ್ಯಾಕೆಟ್ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ಆನ್‌ಲೈನ್ Gemini Vision; ಆಫ್‌ಲೈನ್ ಸ್ಥಳೀಯ ನೋಂದಣಿ.',
    verdictSafeTitle: 'ಖರೀದಿಸಲು ಸುರಕ್ಷಿತ',
    verdictSafeSub: 'ಬೀಜ ಕಾಯ್ದೆ 2026 ನೋಂದಣಿ ಮತ್ತು ಪ್ಯಾಕೇಜಿಂಗ್ ಪರಿಶೀಲನೆಯಲ್ಲಿ ದೃಢಪಟ್ಟಿದೆ',
    verdictFakeTitle: 'ಖರೀದಿಸಬೇಡಿ — ಅಪಾಯ ಪತ್ತೆಯಾಗಿದೆ',
    verdictFakeSub: 'ಈ ಪ್ಯಾಕೆಟ್ ಅಸಲಿತನ, ಅವಧಿ ಅಥವಾ ಲೇಬಲ್ ಪರೀಕ್ಷೆಯಲ್ಲಿ ವಿಫಲವಾಗಿದೆ',
    listenVoice: 'ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ',
    stopVoice: 'ಧ್ವನಿ ನಿಲ್ಲಿಸಿ',
    reportDealer: 'ಅಂಗಡಿ ವರದಿ ಮಾಡಿ (GPS)',
    scanAnother: 'ಮುಂದಿನ ಪ್ಯಾಕೆಟ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    gpsLocking: 'ಅಂಗಡಿಯ GPS ಸ್ಥಳವನ್ನು ಲಾಕ್ ಮಾಡಲಾಗುತ್ತಿದೆ…',
    submitAlert: 'ಕೃಷಿ ಅಧಿಕಾರಿಗೆ ದೂರು ಕಳುಹಿಸಿ',
    alertSavedOffline: 'ಆಫ್‌ಲೈನ್ ದೂರು ಉಳಿಸಲಾಗಿದೆ — ಸಿಗ್ನಲ್ ಬಂದ ತಕ್ಷಣ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.',
    alertSynced: 'ಜಿಲ್ಲಾ ಕೃಷಿ ನಿರೀಕ್ಷಕರಿಗೆ ದೂರು ಕಳುಹಿಸಲಾಗಿದೆ.',
  },
};

export const REASON_LABELS: Record<VerdictReason, Record<LanguageCode, string>> = {
  VERIFIED_AUTHENTIC: {
    en: 'Genuine manufacturer batch & intact seal',
    hi: 'असली कंपनी बैच और सुरक्षित सील',
    mr: 'अस्सल कंपनी बॅच आणि अखंड सील',
    kn: 'ಅಸಲಿ ಕಂಪನಿ ಬ್ಯಾಚ್ ಮತ್ತು ಸುರಕ್ಷಿತ ಸೀಲ್',
  },
  CLONED_QR: {
    en: 'Cloned QR serial scanned across multiple districts',
    hi: 'नकली QR कोड — एक ही नंबर कई जिलों में स्कैन हुआ है',
    mr: 'क्लोन केलेला QR कोड — एकाच क्रमांकाची अनेक जिल्ह्यांत नक्कल',
    kn: 'ನಕಲಿ QR ಕೋಡ್ — ಒಂದೇ ಸಂಖ್ಯೆ ಹಲವು ಜಿಲ್ಲೆಗಳಲ್ಲಿ ಸ್ಕ್ಯಾನ್ ಆಗಿದೆ',
  },
  EXPIRED_STOCK: {
    en: 'Expired stock past statutory germination/use date',
    hi: 'एक्सपायरी तारीख निकल चुकी है — पुराना स्टॉक',
    mr: 'वापराची मुदत संपलेली आहे — जुना साठा',
    kn: 'ಬಳಕೆಯ ಅವಧಿ ಮುಗಿದಿದೆ — ಹಳೆಯ ದಾಸ್ತಾನು',
  },
  TAMPERED_LABEL: {
    en: 'Tampered packaging, smudged batch, or fake seal',
    hi: 'पैकेट के लेबल, प्रिंट या सील में छेड़छाड़ मिली',
    mr: 'पॅकेटचे सील फाटलेले किंवा लेबलमध्ये छेडछाड',
    kn: 'ಪ್ಯಾಕೆಟ್ ಸೀಲ್ ಹರಿದಿದೆ ಅಥವಾ ಲೇಬಲ್‌ನಲ್ಲಿ ತಿದ್ದುಪಡಿ ಇದೆ',
  },
  BLACKLISTED_BATCH: {
    en: 'Blacklisted lot flagged by Agriculture Department',
    hi: 'कृषि विभाग द्वारा ब्लैकलिस्ट किया गया बैच',
    mr: 'कृषी विभागाने काळ्या यादीत टाकलेला बॅच',
    kn: 'ಕೃಷಿ ಇಲಾಖೆಯಿಂದ ಕಪ್ಪುಪಟ್ಟಿಗೆ ಸೇರಿಸಲಾದ ಬ್ಯಾಚ್',
  },
  UNREGISTERED_BATCH: {
    en: 'Unregistered batch not found in Seed Act registry',
    hi: 'यह बैच नंबर सरकारी रजिस्ट्री में दर्ज नहीं है',
    mr: 'हा बॅच क्रमांक सरकारी नोंदणीत आढळला नाही',
    kn: 'ಈ ಬ್ಯಾಚ್ ಸಂಖ್ಯೆ ಅಧಿಕೃತ ನೋಂದಣಿಯಲ್ಲಿ ಕಂಡುಬಂದಿಲ್ಲ',
  },
};
