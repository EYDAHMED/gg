import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capgo/capacitor-speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { AppLanguage } from '../types';
import { PhoneControl, isAndroidNative } from '../services/phoneControlService';

interface UseVoiceAssistantOptions {
  language: AppLanguage;
  wakeWordEnabled: boolean;
  voiceReplyEnabled: boolean;
  onCommand: (transcript: string) => void;
}

export function useVoiceAssistant({ language, wakeWordEnabled, voiceReplyEnabled, onCommand }: UseVoiceAssistantOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isWakeListening, setIsWakeListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  const isNative = Capacitor.isNativePlatform();
  const webSpeechRec = typeof window !== 'undefined'
    ? (window as unknown as Record<string, any>).SpeechRecognition || (window as unknown as Record<string, any>).webkitSpeechRecognition
    : undefined;
  const isSupported = isNative || Boolean(webSpeechRec);

  const speak = useCallback(async (text: string) => {
    if (!voiceReplyEnabled) return;
    if (isNative) {
      try { await TextToSpeech.stop(); await TextToSpeech.speak({ text, lang: language === 'ar' ? 'ar-EG' : 'en-US', rate: 1.0 }); } catch {}
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language === 'ar' ? 'ar-EG' : 'en-US';
      window.speechSynthesis.speak(u);
    }
  }, [isNative, language, voiceReplyEnabled]);

  const listenNativeOnce = useCallback(async () => {
    if (!isNative || isListening) return;
    try {
      await PhoneControl.pauseWakeService();
      await SpeechRecognition.requestPermissions();
      setIsListening(true);
      const res = await SpeechRecognition.start({ language: language === 'ar' ? 'ar-EG' : 'en-US', maxResults: 1, partialResults: false, popup: false });
      const spoken = res.matches?.[0]?.trim() || '';
      if (spoken) { setLastTranscript(spoken); onCommandRef.current(spoken); }
    } catch {} finally {
      setIsListening(false);
      if (wakeWordEnabled) setTimeout(() => PhoneControl.resumeWakeService(), 800);
    }
  }, [isListening, isNative, language, wakeWordEnabled]);

  useEffect(() => {
    if (!isAndroidNative()) return;
    let handlePromise: Promise<{ remove: () => void }> | null = null;
    if (wakeWordEnabled) {
      PhoneControl.startWakeService().then(() => setIsWakeListening(true));
      handlePromise = PhoneControl.onWakeTriggered(() => { listenNativeOnce(); });
    } else {
      PhoneControl.stopWakeService().then(() => setIsWakeListening(false));
    }
    return () => { handlePromise?.then((h) => h.remove()); };
  }, [wakeWordEnabled, listenNativeOnce]);

  const togglePushToTalk = useCallback(() => {
    if (isNative) {
      if (isListening) { SpeechRecognition.stop().catch(() => {}); setIsListening(false); }
      else { listenNativeOnce(); }
      return;
    }
    if (!webSpeechRec) return;
    const rec = new webSpeechRec();
    rec.lang = language === 'ar' ? 'ar-EG' : 'en-US';
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript?.trim();
      if (text) { setLastTranscript(text); onCommandRef.current(text); }
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    setIsListening(true);
    rec.start();
  }, [isListening, isNative, language, listenNativeOnce, webSpeechRec]);

  return { isSupported, isListening, isWakeListening, lastTranscript, togglePushToTalk, speak };
}