import { Directory, File, Paths } from "expo-file-system";

/**
 * Model files live in the app's private document directory. They are not
 * bundled: the user downloads them once over Wi-Fi (or sideloads them).
 * Filenames are configurable; the defaults match the models in docs/ARCHITECTURE.md.
 */
export const MODEL_DIR = new Directory(Paths.document, "models");

export interface ModelConfig {
  /** Chat LLM (GGUF). ~4B Q4 for flagships, ~1.7B for mid-range phones. */
  chat: string;
  /** TTS backbone + codec (GGUF) for voice cloning via llama.rn's TTS API. */
  ttsBackbone: string;
  ttsCodec: string;
  /** whisper.cpp ggml model for speech-to-text. */
  stt: string;
}

export const DEFAULT_MODELS: ModelConfig = {
  chat: "chat.gguf",
  ttsBackbone: "tts-backbone.gguf",
  ttsCodec: "tts-codec.gguf",
  stt: "whisper.bin",
};

export function modelFile(name: string): File {
  return new File(MODEL_DIR, name);
}

export function missingModels(cfg: ModelConfig = DEFAULT_MODELS): string[] {
  return Object.values(cfg).filter((n) => !modelFile(n).exists);
}

/** Download a model from a URL the user (or a family member) configured. */
export async function downloadModel(url: string, name: string): Promise<File> {
  if (!MODEL_DIR.exists) MODEL_DIR.create({ intermediates: true });
  const target = modelFile(name);
  if (target.exists) target.delete();
  return File.downloadFileAsync(url, target);
}
