import { createAudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";
import { initLlama, type LlamaContext, type LlamaSpeaker } from "llama.rn";
import { decodeWav, encodeWav } from "./wav";
import { modelFile } from "./models";

export const AI_AUDIO_LABEL = "AIGC: 思念 app synthetic voice. Not a real recording.";

/**
 * On-device voice cloning with llama.rn's TTS API (codec-LM models such as
 * Chatterbox-multilingual or Qwen3-TTS). A 10–30 s clean clip of the person
 * plus its transcript is enough for zero-shot cloning — no training step and
 * no upload.
 */
export class VoiceClone {
  private ctx?: LlamaContext;
  private speaker?: LlamaSpeaker;

  constructor(private readonly backbone: string, private readonly codec: string) {}

  async load(): Promise<void> {
    if (this.ctx) return;
    this.ctx = await initLlama({ model: modelFile(this.backbone).uri, n_gpu_layers: 99, embedding: true });
    await this.ctx.initVocoder({ path: modelFile(this.codec).uri, n_batch: 4096 });
  }

  /** `refWav` is a 16-bit WAV of the person speaking; `refText` is what they say in it. */
  async setReference(refWav: File, refText: string): Promise<void> {
    await this.load();
    await this.speaker?.release();
    const { samples, sampleRate } = decodeWav(await refWav.bytes());
    this.speaker = await this.ctx!.createSpeaker({ refAudio: samples, refAudioSampleRate: sampleRate, refText, bake: true });
  }

  /** Synthesize `text` in the cloned voice and return a labelled WAV file. */
  async synthesize(text: string): Promise<File> {
    if (!this.speaker) throw new Error("还没有设置声音样本");
    const ctx = this.ctx!;
    const { prompt, grammar, embedding, flow } = await ctx.getFormattedAudioCompletion({ prompt: text, speaker: this.speaker });
    const result = await ctx.completion({ prompt, grammar, embedding, temperature: 0.7, top_p: 0.9 });
    const pcm =
      flow === "continuous_embd"
        ? await ctx.decodeAudioEmbeddings(result.embeddings ?? [], result.embedding_dim ?? 0)
        : await ctx.decodeAudioTokens(result.audio_tokens ?? []);
    const out = new File(Paths.cache, `tts-${Date.now()}.wav`);
    out.write(encodeWav(Float32Array.from(pcm), await ctx.getAudioSampleRate(), AI_AUDIO_LABEL));
    return out;
  }

  async speak(text: string): Promise<void> {
    const wav = await this.synthesize(text);
    const player = createAudioPlayer(wav.uri);
    player.addListener("playbackStatusUpdate", (s) => {
      if (s.didJustFinish) {
        player.remove();
        wav.delete();
      }
    });
    player.play();
  }

  async release(): Promise<void> {
    await this.speaker?.release();
    await this.ctx?.releaseVocoder();
    await this.ctx?.release();
    this.speaker = undefined;
    this.ctx = undefined;
  }
}
