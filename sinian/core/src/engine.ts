import { accessFor, evaluateConsent, type ConsentCase } from "./consent";
import type { MemoryIndex } from "./memory";
import { buildPrompt, type ChatTurn, type Prompt } from "./prompt";
import {
  asksIfReal,
  checkOutput,
  crisisReply,
  DEFAULT_WELLBEING,
  detectCrisis,
  DISCLOSURE_EN,
  DISCLOSURE_ZH,
  minutesUsedToday,
  usageStreak,
  type UsageLog,
  type WellbeingPolicy,
} from "./safety";
import type { Modality, PersonaProfile } from "./types";

/** Any text generator: on-device llama.cpp, a self-hosted server, or a test stub. */
export interface LanguageModel {
  generate(prompt: Prompt, opts: { maxTokens: number; temperature: number }): Promise<string>;
}

export type EngineReply =
  | { kind: "reply"; text: string; modalities: Modality[]; disclosure?: string; checkIn?: string; flagged: string[] }
  | { kind: "crisis"; text: string }
  | { kind: "limit"; text: string }
  | { kind: "unavailable"; reasons: string[] };

export interface EngineOptions {
  persona: PersonaProfile;
  memory: MemoryIndex;
  consent: ConsentCase;
  /** The relative using the phone right now. */
  relativeId: string;
  userName: string;
  model: LanguageModel;
  region?: string;
  policy?: WellbeingPolicy;
  usage?: UsageLog;
}

const FALLBACK_ZH = "这个我说不好，你还是问问身边信得过的人，或者找专业的人帮你看看。";
const FALLBACK_EN = "I can't help with that one. Please ask someone you trust, or a professional.";
const REAL_ACK = /AI|人工智能|模拟|不是.{0,4}本人|not (really )?(him|her|them)|simulation/i;

export class ConversationEngine {
  private history: ChatTurn[] = [];
  private turns = 0;
  readonly usage: UsageLog;
  private readonly policy: WellbeingPolicy;

  constructor(private readonly o: EngineOptions) {
    this.policy = o.policy ?? DEFAULT_WELLBEING;
    this.usage = o.usage ?? { minutesByDay: {} };
  }

  private get disclosure(): string {
    const name = this.o.persona.displayName;
    return this.o.persona.language === "en" ? DISCLOSURE_EN(name) : DISCLOSURE_ZH(name);
  }

  /** The app calls this as time passes in an open session. */
  addUsage(minutes: number, day: string): void {
    this.usage.minutesByDay[day] = (this.usage.minutesByDay[day] ?? 0) + minutes;
  }

  getHistory(): readonly ChatTurn[] {
    return this.history;
  }

  async respond(userText: string, today: string): Promise<EngineReply> {
    const modalities = accessFor(this.o.consent, this.o.relativeId);
    if (modalities.length === 0) {
      const s = evaluateConsent(this.o.consent);
      return { kind: "unavailable", reasons: "reasons" in s ? s.reasons : ["你不在授权的使用者名单中。"] };
    }

    // Crisis comes before the time limit: someone in danger must never hit a wall.
    if (detectCrisis(userText)) {
      return { kind: "crisis", text: crisisReply(this.o.region ?? "CN", this.o.persona.displayName) };
    }

    if (minutesUsedToday(this.usage, today) >= this.policy.maxMinutesPerDay) {
      return {
        kind: "limit",
        text: `今天已经聊了${this.policy.maxMinutesPerDay}分钟了。休息一下，明天再来。也可以给身边的人打个电话。`,
      };
    }

    const lastReply = [...this.history].reverse().find((t) => t.role === "assistant")?.content ?? "";
    const memories = this.o.memory.search(`${userText} ${lastReply}`, 5);
    const prompt = buildPrompt({
      persona: this.o.persona,
      memories,
      history: [...this.history, { role: "user", content: userText }],
      userName: this.o.userName,
    });

    let text = (await this.o.model.generate(prompt, { maxTokens: 200, temperature: 0.8 })).trim();
    let flagged = checkOutput(text);
    if (flagged.length > 0) {
      const retry: Prompt = {
        ...prompt,
        system: `${prompt.system}\n\n上一次回答违反了规则（${flagged.join(",")}）。重新回答，避开这些内容。`,
      };
      text = (await this.o.model.generate(retry, { maxTokens: 200, temperature: 0.6 })).trim();
      const again = checkOutput(text);
      if (again.length > 0) text = this.o.persona.language === "en" ? FALLBACK_EN : FALLBACK_ZH;
      flagged = [...new Set([...flagged, ...again])];
    }

    // Asked "is it really you?" — honesty is enforced, not left to the model.
    if (asksIfReal(userText) && !REAL_ACK.test(text)) {
      text = `${this.disclosure}\n${text}`;
    }

    this.history.push({ role: "user", content: userText }, { role: "assistant", content: text });
    this.turns++;

    const showDisclosure = this.turns === 1 || this.turns % this.policy.disclosureEveryTurns === 0;
    const streak = usageStreak(this.usage, today, true);
    const checkIn =
      this.turns === 1 && streak >= this.policy.checkInAfterStreakDays
        ? `你已经连续${streak}天来聊天了。想念是很正常的。最近有和家人朋友聊聊吗？如果需要，也可以找哀伤辅导师。`
        : undefined;

    return {
      kind: "reply",
      text,
      modalities,
      ...(showDisclosure ? { disclosure: this.disclosure } : {}),
      ...(checkIn ? { checkIn } : {}),
      flagged,
    };
  }
}
