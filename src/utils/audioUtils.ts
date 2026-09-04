/**
 * Audio utility helpers for formatting, downloading, and synthesis
 */

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function triggerDownload(urlOrBlob: string | Blob, filename: string): void {
  const isBlob = urlOrBlob instanceof Blob;
  const url = isBlob ? URL.createObjectURL(urlOrBlob) : urlOrBlob;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.wav') ? filename : `${filename}.wav`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  if (isBlob) {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

/**
 * Creates a downloadable WAV blob from raw Float32Array PCM samples (used for browser audio recording/synthesis fallback)
 */
export function encodePcmToWavBlob(
  audioBuffer: AudioBuffer
): Blob {
  const numOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numOfChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF chunk descriptor
  view.setUint32(0, 0x46464952, false); // "RIFF"
  view.setUint32(4, 36 + length, true);
  view.setUint32(8, 0x45564157, false); // "WAVE"

  // fmt sub-chunk
  view.setUint32(12, 0x20746d66, false); // "fmt "
  view.setUint32(16, 16, true); // subchunk1size (16 for PCM)
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2 * numOfChannels, true); // byte rate
  view.setUint16(32, numOfChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data sub-chunk
  view.setUint32(36, 0x61746164, false); // "data"
  view.setUint32(40, length, true);

  pos = 44;
  for (let i = 0; i < numOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  while (offset < audioBuffer.length) {
    for (let i = 0; i < numOfChannels; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
