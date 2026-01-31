import { Audio } from 'expo-av';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const scorePronunciation = (expected: string, transcript: string) => {
  const exp = normalize(expected);
  const said = normalize(transcript);
  if (!exp || !said) return { matched: false, score: 0, transcript };
  if (said === exp) return { matched: true, score: 1, transcript };
  if (said.includes(exp)) return { matched: true, score: 0.75, transcript };
  return { matched: false, score: 0, transcript };
};

export const startRecording = async () => {
  await Audio.requestPermissionsAsync();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync({
    isMeteringEnabled: true,
    android: {
      extension: '.3gp',
      outputFormat: Audio.AndroidOutputFormat.THREE_GPP,
      audioEncoder: Audio.AndroidAudioEncoder.AMR_NB,
      sampleRate: 8000,
      numberOfChannels: 1,
      bitRate: 12200,
    },
    ios: {
      extension: '.caf',
      outputFormat: Audio.IOSOutputFormat.LINEARPCM,
      audioQuality: Audio.IOSAudioQuality.MIN,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
  });
  await recording.startAsync();
  return recording;
};

export const stopRecording = async (recording: Audio.Recording) => {
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  if (!uri) throw new Error('Recording failed.');
  return uri;
};

export const transcribeWithGoogle = async (uri: string, apiKey: string) => {
  const base64 = await new File(uri).base64();
  const proxyUrl = process.env.EXPO_PUBLIC_STT_PROXY_URL ?? '';
  if (proxyUrl) {
    const audioConfig =
      Platform.OS === 'android'
        ? { encoding: 'AMR', sampleRateHertz: 8000, audioChannelCount: 1 }
        : { encoding: 'LINEAR16', sampleRateHertz: 16000, audioChannelCount: 1 };
    const res = await fetch(`${proxyUrl.replace(/\/$/, '')}/stt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: base64,
        languageCode: 'en-US',
        config: audioConfig,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Speech-to-text failed.');
    }
    const data = await res.json();
    return data?.transcript ?? '';
  }

  const body = {
    config: {
      encoding: 'ENCODING_UNSPECIFIED',
      languageCode: 'en-US',
    },
    audio: {
      content: base64,
    },
  };

  const res = await fetch(
    `https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Speech-to-text failed.');
  }
  const data = await res.json();
  const transcript =
    data?.results?.[0]?.alternatives?.[0]?.transcript ??
    '';
  return transcript;
};
