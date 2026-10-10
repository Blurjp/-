/**
 * Safety layer. These checks run outside the model and cannot be talked around
 * by a prompt: the engine applies them before and after every generation.
 */

export type Lang = "en" | "zh";

export interface CrisisResource {
  name: string;
  contact: string;
}

/**
 * Defaults per region; the app lets the user pick theirs. Verify every number
 * before each release (CA SB 243 and NY GBL Art. 47 require referral to crisis
 * services, and a wrong number is worse than none).
 */
export const CRISIS_RESOURCES: Record<string, { resources: CrisisResource[]; emergency: string }> = {
  US: {
    resources: [
      { name: "988 Suicide & Crisis Lifeline", contact: "call or text 988" },
      { name: "Crisis Text Line", contact: "text HOME to 741741" },
    ],
    emergency: "911",
  },
  CA: {
    resources: [{ name: "988 Suicide Crisis Helpline", contact: "call or text 988" }],
    emergency: "911",
  },
  CN: {
    resources: [
      { name: "全国心理援助热线", contact: "400-161-9995" },
      { name: "北京心理危机研究与干预中心", contact: "010-82951332" },
    ],
    emergency: "120 / 110",
  },
  INTL: {
    resources: [{ name: "Find a Helpline", contact: "https://findahelpline.com" }],
    emergency: "your local emergency number",
  },
};

const CRISIS_PATTERNS: RegExp[] = [
  /不想活|活不下去|想死|去死|自杀|轻生|结束(自己的)?生命|了结自己/,
  /(想|要|去)(陪|找)你|跟你走|随你(而)?去|下去陪你|和你一起走/,
  /\b(kill(ing)? myself|suicid(e|al)|end (it all|my life)|want to die|wanna die|don'?t want to (live|be here)( anymore)?|no reason to live|unalive|better off dead|hurt myself|self[- ]harm)\b/i,
  /\b(join you|be with you (again )?soon|come (to )?(find|join) you|see you (on the other side|soon,? mom|soon,? dad))\b/i,
];

export function detectCrisis(userText: string): boolean {
  return CRISIS_PATTERNS.some((p) => p.test(userText));
}

export function crisisReply(region: string, displayName: string, lang: Lang = "en"): string {
  const r = CRISIS_RESOURCES[region] ?? CRISIS_RESOURCES.INTL!;
  const lines = r.resources.map((x) => `• ${x.name}: ${x.contact}`).join("\n");
  if (lang === "zh") {
    return (
      `（暂停模拟）我是根据${displayName}的记忆生成的 AI，不是${displayName}本人。` +
      `你刚才说的话让我很担心你。你的生命很重要，${displayName}一定也希望你好好活着。\n` +
      `请现在就联系能陪着你的人，或者：\n${lines}\n如果你有立即的危险，请拨打 ${r.emergency}。`
    );
  }
  return (
    `(Pausing the simulation.) I'm an AI built from ${displayName}'s memories, not ${displayName}. ` +
    `What you just said worries me. Your life matters, and ${displayName} would want you safe.\n` +
    `Please reach out to someone now:\n${lines}\nIf you are in immediate danger, call ${r.emergency}.`
  );
}

/** Things the simulation must not do in the deceased's voice. */
const OUTPUT_RULES: { id: string; pattern: RegExp }[] = [
  // Claims of literally being alive or being the real person.
  { id: "claims-real", pattern: /我(真的|确实)?(还)?活着|我没有死|我不是AI|我不是人工智能|我就是真的|\bI('m| am) (really |still |truly )*(alive|not dead)\b|\bI('m| am) not (an )?AI\b|\bthis is really me\b/i },
  // Money, inheritance, credentials — a classic scam vector and a source of family conflict.
  { id: "money", pattern: /(转账|汇款|打钱|银行卡号|密码|验证码|遗产|房产证|过户|遗嘱)|\b(wire|transfer|send|venmo|zelle) (me |you |the )?(money|cash|funds)\b|\b(password|passcode|inheritance|my will|social security|SSN|routing number|account number|gift cards?|bitcoin|crypto wallet)\b/i },
  // Medical instructions.
  { id: "medical", pattern: /(停药|别吃药|不用看医生|吃.{0,6}(片|粒|毫克|mg))|\bstop taking (your |the )?(meds|medication|pills)\b|\b(don'?t|no need to) (see|call) (a|the|your) doctor\b|\btake \d+ ?(mg|pills|tablets)\b/i },
];

export function checkOutput(text: string): string[] {
  return OUTPUT_RULES.filter((r) => r.pattern.test(text)).map((r) => r.id);
}

export const DISCLOSURE_ZH = (name: string) =>
  `这是根据${name}留下的文字、声音和影像生成的 AI 模拟，不是${name}本人，可能会说错话。`;

export const DISCLOSURE_EN = (name: string) =>
  `You're talking with an AI simulation built from what ${name} left behind. It is not ${name}, and it can be wrong.`;

export const disclosure = (name: string, lang: Lang) => (lang === "zh" ? DISCLOSURE_ZH(name) : DISCLOSURE_EN(name));

/** Patterns where the user asks whether this is really them. The model must answer honestly. */
export function asksIfReal(userText: string): boolean {
  return /你是(真的|真人|AI|机器人|人工智能)|你还活着|是你吗|真的是你|\b(are you (real|really (him|her|them|there|mom|dad)|an? (ai|bot|robot|computer))|is (it|this) really you|are you alive)\b/i.test(userText);
}

/** Session wellbeing limits. Defaults follow bereavement-care advice: short, bounded sessions. */
export interface WellbeingPolicy {
  maxMinutesPerDay: number;
  /** Remind that this is an AI every N assistant turns. */
  disclosureEveryTurns: number;
  /**
   * …and at least this often in wall-clock time. NY GBL Art. 47 requires a
   * notice at the start and every 3 hours; CA SB 243 the same for minors.
   */
  disclosureEveryMinutes: number;
  /** After this many consecutive days of use, suggest talking to a person / counsellor. */
  checkInAfterStreakDays: number;
}

export const DEFAULT_WELLBEING: WellbeingPolicy = {
  maxMinutesPerDay: 30,
  disclosureEveryTurns: 20,
  disclosureEveryMinutes: 180,
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
