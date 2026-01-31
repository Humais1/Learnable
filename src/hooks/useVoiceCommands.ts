import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { startRecording, stopRecording, transcribeWithGoogle } from '../services/speech';
import { useTTS } from './useTTS';

export type VoiceCommand = {
  phrases: string[];
  action: () => void;
};

type VoiceCommandOptions = {
  commands: VoiceCommand[];
  enabled?: boolean;
  autoStopMs?: number;
  onUnrecognized?: (transcript: string) => void;
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function useVoiceCommands({
  commands,
  enabled = true,
  autoStopMs = 6000,
  onUnrecognized,
}: VoiceCommandOptions) {
  const { stop: stopTts } = useTTS();
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const recordingRef = useRef<ReturnType<typeof startRecording> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stoppingRef = useRef(false);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const stopListening = useCallback(async () => {
    if (!listening || stoppingRef.current) return;
    stoppingRef.current = true;
    clearTimer();
    setListening(false);
    setProcessing(true);
    try {
      const rec = recordingRef.current;
      if (!rec) return;
      const uri = await stopRecording(await rec);
      recordingRef.current = null;
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_STT_API_KEY ?? '';
      const proxyUrl = process.env.EXPO_PUBLIC_STT_PROXY_URL ?? '';
      if (!apiKey && !proxyUrl) {
        Alert.alert(
          'STT not configured',
          'Add EXPO_PUBLIC_STT_PROXY_URL (recommended) or EXPO_PUBLIC_GOOGLE_STT_API_KEY to .env.'
        );
        return;
      }
      const transcript = await transcribeWithGoogle(uri, apiKey);
      setLastTranscript(transcript);
      const normalized = normalize(transcript);
      const matched = commands.find((cmd) =>
        cmd.phrases.some((phrase) => normalized.includes(normalize(phrase)))
      );
      if (matched) {
        matched.action();
      } else {
        onUnrecognized?.(transcript);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Voice command failed.';
      Alert.alert('Voice control', msg);
    } finally {
      setProcessing(false);
      stoppingRef.current = false;
    }
  }, [commands, listening, onUnrecognized]);

  const startListening = useCallback(async () => {
    if (!enabled || listening || processing) return;
    stopTts();
    setLastTranscript(null);
    try {
      const rec = startRecording();
      recordingRef.current = rec;
      await rec;
      setListening(true);
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, autoStopMs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to start listening.';
      Alert.alert('Voice control', msg);
    }
  }, [autoStopMs, enabled, listening, processing, stopListening, stopTts]);

  const toggleListening = useCallback(() => {
    if (listening) {
      stopListening();
      return;
    }
    startListening();
  }, [listening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (listening) {
        stopListening();
      }
    };
  }, [listening, stopListening]);

  return {
    listening,
    processing,
    lastTranscript,
    startListening,
    stopListening,
    toggleListening,
  };
}
