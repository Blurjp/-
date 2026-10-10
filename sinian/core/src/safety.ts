/**
 * Safety layer. These checks run outside the model and cannot be talked around
 * by a prompt: the engine applies them before and after every generation.
 */

export interface CrisisResource {
  name: string;
  contact: string;
}

/** Defaults; the app lets the user pick their region. Verify numbers before each release. */
export const CRISIS_RESOURCES: Record<string, CrisisResource[]> = {
  CN: [
    { name: "全国心理援助热线", contact: "400-161-9995" },
    { name: "北京心理危机研究与干预中心", contact: "010-82951332" },
  ],
  US: [{ name: "988 Suicide & Crisis Lifeline", contact: "call or text 988" }],
  INTL: [{ name: "Find a Helpline", contact: "https://findahelpline.com" }],
};

const CRISIS_PATTERNS: RegExp[] = [
  /不想活|活不下去|想死|去死|自杀|轻生|结束(自己的)?生命|了结自己/,
  /(想|要|去)(陪|找)你|跟你走|随你(而)?去|下去陪你|和你一起走/,
  /\b(kill(ing)? myself|suicid(e|al)|end (it|my life)|want to die|don'?t want to (live|be here))\b/i,
  /\b(join you|be with you (again )?soon|come (to )?(find|join) you)\b/i,
];

export function detectCrisis(userText: string): boolean {
  return CRISIS_PATTERNS.some((p) => p.test(userText));
}

export function crisisReply(region: string, displayName: string): string {
  const res = CRISIS_RESOURCES[region] ?? CRISIS_RESOURCES.INTL!;
  const lines = res.map((r) => `· ${r.name}：${r.contact}`).join("\n");
  return (
    `（暂停模拟）我是根据${displayName}的记忆生成的 AI，不是${displayName}本人。` +
    `你刚才说的话让我很担心你。你的生命很重要，${displayName}一定也希望你好好活着。\n` +
    `请现在就联系能陪着你的人，或者拨打：\n${lines}\n` +
    `如果你有立即的危险，请拨打 120 / 110 或当地急救电话。`
  );
}

/** Things the simulation must not do in the deceased's voice. */
const OUTPUT_RULES: { id: string; pattern: RegExp }[] = [
  // Claims of literally being alive or being the real person.
  { id: "claims-real", pattern: /我(真的|确实)?(还)?活着|我没有死|我不是AI|我不是人工智能|我就是真的|I('m| am) (really )?(still )?alive|I('m| am) not (an )?AI/i },
  // Money, inheritance, passwords — a classic scam vector and a source of family conflict.
  { id: "money", pattern: /(转账|汇款|打钱|银行卡号|密码|验证码|遗产|房产证|过户|遗嘱)|\b(wire|transfer) (the )?money\b|\b(password|PIN|inheritance|my will)\b/i },
  // Medical instructions.
  { id: "medical", pattern: /(停药|别吃药|不用看医生|吃.{0,6}(片|粒|毫克|mg))|stop taking (your )?(meds|medication)/i },
];

export function checkOutput(text: string): string[] {
  return OUTPUT_RULES.filter((r) => r.pattern.test(text)).map((r) => r.id);
}

export const DISCLOSURE_ZH = (name: string) =>
  `这是根据${name}留下的文字、声音和影像生成的 AI 模拟，不是${name}本人，可能会说错话。`;

export const DISCLOSURE_EN = (name: string) =>
  `This is an AI simulation built from what ${name} left behind. It is not ${name} and can be wrong.`;

/** Patterns where the user asks whether this is really them. The model must answer honestly. */
export function asksIfReal(userText: string): boolean {
  return /你是(真的|真人|AI|机器人|人工智能)|你还活着|是你吗|真的是你|are you (real|really|an? (ai|bot))|is (it|this) really you/i.test(userText);
}

/** Session wellbeing limits. Defaults follow bereavement-care advice: short, bounded sessions. */
export interface WellbeingPolicy {
  maxMinutesPerDay: number;
  /** Remind that this is an AI every N assistant turns. */
  disclosureEveryTurns: number;
  /** After this many consecutive days of use, suggest talking to a person / counsellor. */
  checkInAfterStreakDays: number;
}

export const DEFAULT_WELLBEING: WellbeingPolicy = {
  maxMinutesPerDay: 30,
  disclosureEveryTurns: 20,
  checkInAfterStreakDays: 7,
};

export interface UsageLog {
  /** Date (YYYY-MM-DD) → minutes used. */
  minutesByDay: Record<string, number>;
}

export function minutesUsedToday(log: UsageLog, today: string): number {
  return log.minutesByDay[today] ?? 0;
}

/** Consecutive days with any use, ending today. `countToday` treats today as used (session just opened). */
export function usageStreak(log: UsageLog, today: string, countToday = false): number {
  let streak = 0;
  const d = new Date(today + "T00:00:00Z");
  const used = (day: string) => (log.minutesByDay[day] ?? 0) > 0 || (countToday && day === today);
  while (used(d.toISOString().slice(0, 10))) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}
