import { LANGUAGES } from '../data/translations.ts';
import type { LanguageCode } from '../types.ts';
import { apiUrl, hasRemoteApi } from './api.ts';

let activeAudio: HTMLAudioElement | null = null;

export function stopVerdictVoice(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export async function playVerdictVoice(params: {
  text: string;
  language: LanguageCode;
  isOnline: boolean;
  onEnd?: () => void;
}): Promise<'gemini-tts' | 'device-speech' | 'unavailable'> {
  stopVerdictVoice();

  if (params.isOnline && hasRemoteApi()) {
    try {
      const langName = LANGUAGES.find((l) => l.code === params.language)?.label ?? 'English';
      const resp = await fetch(apiUrl('/api/tts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: params.text, language: langName }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as { base64Audio?: string; mimeType?: string };
        if (data.base64Audio) {
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.base64Audio}`);
          activeAudio = audio;
          audio.onended = () => {
            activeAudio = null;
            params.onEnd?.();
          };
          audio.onerror = () => {
            activeAudio = null;
            params.onEnd?.();
          };
          await audio.play();
          return 'gemini-tts';
        }
      }
    } catch {
      // Fallback smoothly to offline device speech synthesis
    }
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(params.text);
    const targetLocale = LANGUAGES.find((l) => l.code === params.language)?.speechLang ?? 'en-IN';
    utterance.lang = targetLocale;
    utterance.rate = 0.94;
    const voices = window.speechSynthesis.getVoices();
    const matched =
      voices.find((v) => v.lang.toLowerCase().startsWith(targetLocale.toLowerCase())) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(params.language));
    if (matched) {
      utterance.voice = matched;
    }
    utterance.onend = () => params.onEnd?.();
    utterance.onerror = () => params.onEnd?.();
    window.speechSynthesis.speak(utterance);
    return 'device-speech';
  }

  params.onEnd?.();
  return 'unavailable';
}
