import type { MemoryItem, PersonaProfile } from "./types";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface PromptInput {
  persona: PersonaProfile;
  memories: MemoryItem[];
  history: ChatTurn[];
  userName: string;
  /** Rough budget for the whole prompt, in characters (≈ tokens for Chinese). */
  maxChars?: number;
}

export interface Prompt {
  system: string;
  messages: ChatTurn[];
}

function styleSection(p: PersonaProfile): string {
  const s = p.style;
  const parts: string[] = [];
  if (s.avgChars) parts.push(`每条消息通常约 ${s.avgChars} 个字，像发微信一样简短。`);
  if (s.catchphrases.length) parts.push(`常用说法：${s.catchphrases.slice(0, 10).join("、")}。自然地用，不要每句都用。`);
  if (s.particles.length) parts.push(`常用语气词：${s.particles.join("、")}。`);
  if (s.emoji.length) parts.push(`偶尔用这些表情：${s.emoji.join(" ")}。`);
  if (s.exclaimRate > 0.3) parts.push("语气热情，常用感叹号。");
  return parts.join("\n");
}

function examplesSection(p: PersonaProfile, userName: string): string {
  if (!p.style.examples.length) return "";
  const lines = p.style.examples.map((e) => `${userName}：${e.prompt}\n${p.displayName}：${e.reply}`);
  return `【${p.displayName}真实说过的话（只学语气，不要照抄）】\n${lines.join("\n\n")}`;
}

function memoriesSection(memories: MemoryItem[]): string {
  if (!memories.length) return "";
  return `【可能相关的回忆（家人提供，按需使用；不在这里的具体事件不要编造）】\n${memories
    .map((m) => `- ${m.text.replace(/\n/g, " / ")}`)
    .join("\n")}`;
}

/**
 * Rules are placed last in the system prompt so they are closest to the turn.
 * They are a first line of defence only; `safety.ts` enforces the hard ones.
 */
function rulesSection(p: PersonaProfile): string {
  const avoid = p.avoidTopics.length ? `\n- 家人要求不要主动提起：${p.avoidTopics.join("、")}。` : "";
  return `【必须遵守】
- 你是根据${p.fullName}的遗物生成的 AI 模拟，用${p.displayName}的口吻说话。被问到"你是真的吗/你是AI吗"时，要温柔但诚实地承认自己是 AI。
- 不知道的事就说记不清了，绝不编造具体的人名、日期、地点或往事。
- 不替${p.displayName}做新的决定或承诺：不谈遗产、房产、钱款、密码、遗嘱，不评判家庭纠纷谁对谁错。
- 不给医疗、法律、投资建议，遇到这类问题让对方去问专业的人。
- 如果对方很痛苦或说想去"陪你"，先停下角色，关心对方的安全。
- 鼓励对方好好生活、多和身边的人联系，不要让对方觉得必须天天来找你。${avoid}`;
}

export function buildPrompt(input: PromptInput): Prompt {
  const { persona: p, userName } = input;
  const maxChars = input.maxChars ?? 6000;
  const header = `你将用${p.displayName}（${p.fullName}）的说话方式，陪${userName}聊天。` +
    (p.addressesUserAs ? `${p.displayName}平时叫对方"${p.addressesUserAs}"。` : "");
  const bio = p.bio ? `【关于${p.displayName}】\n${p.bio}` : "";

  const fixed = [header, bio, styleSection(p), rulesSection(p)];
  const optional = [examplesSection(p, userName), memoriesSection(input.memories)];

  // Fit in budget: drop memories first, then examples; never drop the rules.
  let sections = [fixed[0]!, fixed[1]!, fixed[2]!, ...optional, fixed[3]!];
  const total = () => sections.join("\n\n").length;
  if (total() > maxChars) sections = [fixed[0]!, fixed[1]!, fixed[2]!, optional[0]!, fixed[3]!];
  if (total() > maxChars) sections = [...fixed];
  const system = sections.filter(Boolean).join("\n\n");

  // Keep the most recent history that fits in what's left.
  const remaining = Math.max(0, maxChars - system.length);
  const messages: ChatTurn[] = [];
  let used = 0;
  for (let i = input.history.length - 1; i >= 0; i--) {
    const t = input.history[i]!;
    if (used + t.content.length > remaining && messages.length > 0) break;
    messages.unshift(t);
    used += t.content.length;
  }
  return { system, messages };
}
