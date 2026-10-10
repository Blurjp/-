import { initLlama, type LlamaContext } from "llama.rn";
import type { LanguageModel, Prompt } from "@sinian/core";
import { modelFile } from "./models";

/** On-device chat model via llama.cpp. Nothing leaves the phone. */
export class LocalLlm implements LanguageModel {
  private ctx?: LlamaContext;

  constructor(private readonly fileName: string) {}

  async load(onProgress?: (p: number) => void): Promise<void> {
    if (this.ctx) return;
    this.ctx = await initLlama(
      { model: modelFile(this.fileName).uri, n_ctx: 4096, n_gpu_layers: 99, use_mlock: false },
      onProgress,
    );
  }

  async generate(prompt: Prompt, opts: { maxTokens: number; temperature: number }): Promise<string> {
    await this.load();
    const res = await this.ctx!.completion({
      messages: [{ role: "system", content: prompt.system }, ...prompt.messages],
      jinja: true,
      enable_thinking: false, // Qwen3-style models: no visible reasoning in a chat with family
      n_predict: opts.maxTokens,
      temperature: opts.temperature,
      top_p: 0.9,
      penalty_repeat: 1.1,
    });
    return res.text;
  }

  async release(): Promise<void> {
    await this.ctx?.release();
    this.ctx = undefined;
  }
}
