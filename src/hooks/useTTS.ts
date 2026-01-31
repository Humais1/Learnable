import { useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  language?: string;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Global "speak" helper for voice-first UX.
 * Uses OS TTS (expo-speech) so every screen can announce its title on focus.
 */
export function useTTS(options: TTSOptions = {}) {
  const speakingRef = useRef(false);
  const defaultOptions: TTSOptions = {
    rate: 0.9,
    pitch: 1,
    language: 'en-US',
    ...options,
  };

  const speak = useCallback(
    (text: string, overrideOptions?: TTSOptions) => {
      if (!text?.trim()) return;
      const opts = { ...defaultOptions, ...overrideOptions };
      speakingRef.current = true;
      try {
        Speech.speak(text, {
          rate: opts.rate ?? 0.9,
          pitch: opts.pitch ?? 1,
          language: opts.language ?? 'en-US',
          onDone: () => {
            speakingRef.current = false;
            opts.onDone?.();
          },
          onError: (err) => {
            speakingRef.current = false;
            if (__DEV__) console.warn('[useTTS] speak onError', err);
            opts.onError?.(err as Error);
          },
        });
      } catch (err) {
        speakingRef.current = false;
        if (__DEV__) console.warn('[useTTS] speak failed', err);
        opts.onError?.(err as Error);
      }
    },
    [defaultOptions.rate, defaultOptions.pitch, defaultOptions.language]
  );

  const stop = useCallback(() => {
    Speech.stop();
    speakingRef.current = false;
  }, []);

  const isSpeaking = useCallback(() => speakingRef.current, []);

  return { speak, stop, isSpeaking };
}
