import { initWhisper, type WhisperContext } from "whisper.rn";
import { modelFile } from "./models";

/** On-device speech-to-text so the user can talk instead of type. */
export class LocalStt {
  private ctx?: WhisperContext;

  constructor(private readonly fileName: string) {}

  async transcribe(wavUri: string, language: "zh" | "en" = "zh"): Promise<string> {
    this.ctx ??= await initWhisper({ filePath: modelFile(this.fileName).uri });
    const { promise } = this.ctx.transcribe(wavUri, { language });
    return (await promise).result.trim();
  }

  async release(): Promise<void> {
    await this.ctx?.release();
    this.ctx = undefined;
  }
}
