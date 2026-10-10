/** Minimal PCM WAV encode/decode for TTS output and voice-clone reference clips. */

/**
 * Encode mono float samples as 16-bit PCM WAV. `comment` goes into a LIST/INFO
 * ICMT chunk — used as the implicit "AI-generated" label required for synthetic
 * audio (《人工智能生成合成内容标识办法》, EU AI Act Art. 50).
 */
export function encodeWav(samples: Float32Array, sampleRate: number, comment?: string): Uint8Array {
  const info = comment ? new TextEncoder().encode(comment + "\0") : undefined;
  const infoPad = info ? info.length % 2 : 0;
  const listSize = info ? 4 + 8 + info.length + infoPad : 0; // "INFO" + ICMT header + text
  const dataOff = 44 + (info ? 8 + listSize : 0);
  const bytes = new Uint8Array(dataOff + samples.length * 2);
  const v = new DataView(bytes.buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, bytes.length - 8, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  if (info) {
    str(36, "LIST");
    v.setUint32(40, listSize, true);
    str(44, "INFO");
    str(48, "ICMT");
    v.setUint32(52, info.length, true);
    bytes.set(info, 56);
  }
  str(dataOff - 8, "data");
  v.setUint32(dataOff - 4, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    v.setInt16(dataOff + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return bytes;
}

/** Decode 16-bit PCM WAV to mono float samples (channels are averaged). */
export function decodeWav(bytes: Uint8Array): { samples: Float32Array; sampleRate: number } {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (o: number) => String.fromCharCode(...bytes.subarray(o, o + 4));
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") throw new Error("不是 WAV 文件");
  let off = 12, channels = 1, sampleRate = 16000, bits = 16;
  while (off + 8 <= bytes.length) {
    const id = tag(off), size = v.getUint32(off + 4, true);
    if (id === "fmt ") {
      channels = v.getUint16(off + 10, true);
      sampleRate = v.getUint32(off + 12, true);
      bits = v.getUint16(off + 22, true);
    } else if (id === "data") {
      if (bits !== 16) throw new Error("只支持 16-bit PCM WAV");
      const frames = Math.floor(size / 2 / channels);
      const out = new Float32Array(frames);
      for (let f = 0; f < frames; f++) {
        let sum = 0;
        for (let c = 0; c < channels; c++) sum += v.getInt16(off + 8 + (f * channels + c) * 2, true);
        out[f] = sum / channels / 0x8000;
      }
      return { samples: out, sampleRate };
    }
    off += 8 + size + (size % 2);
  }
  throw new Error("WAV 中没有音频数据");
}
