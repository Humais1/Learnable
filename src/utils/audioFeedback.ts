import { Audio } from 'expo-av';

const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const toBase64 = (bytes: Uint8Array): string => {
  let result = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    result +=
      base64Chars[(n >> 18) & 63] +
      base64Chars[(n >> 12) & 63] +
      base64Chars[(n >> 6) & 63] +
      base64Chars[n & 63];
  }
  if (i < bytes.length) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8);
    result += base64Chars[(n >> 18) & 63] + base64Chars[(n >> 12) & 63];
    result += i + 1 < bytes.length ? base64Chars[(n >> 6) & 63] : '=';
    result += '=';
  }
  return result;
};

const writeString = (view: DataView, offset: number, text: string) => {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
};

const buildWav = (frequency: number, durationMs: number, volume = 0.3): string => {
  const sampleRate = 8000;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM header size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t) * volume;
    view.setInt16(44 + i * 2, sample * 0x7fff, true);
  }

  const base64 = toBase64(new Uint8Array(buffer));
  return `data:audio/wav;base64,${base64}`;
};

export const playCorrectSound = async () => {
  const uri = buildWav(880, 120);
  const { sound } = await Audio.Sound.createAsync({ uri });
  await sound.playAsync();
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync();
    }
  });
};

export const playWrongSound = async () => {
  const uri = buildWav(220, 160);
  const { sound } = await Audio.Sound.createAsync({ uri });
  await sound.playAsync();
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync();
    }
  });
};
