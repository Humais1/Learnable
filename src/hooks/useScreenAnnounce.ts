import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTTS } from './useTTS';

/**
 * Announce screen title on focus for voice-first UX.
 * Call once at top of each screen with the message to speak.
 * On native, delay slightly so TTS is ready (Expo Go / device).
 */
export function useScreenAnnounce(message: string, deps: unknown[] = []) {
  const { speak } = useTTS();
  useEffect(() => {
    if (!message) return;
    if (Platform.OS === 'web') {
      speak(message);
      return;
    }
    const t = setTimeout(() => speak(message), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
