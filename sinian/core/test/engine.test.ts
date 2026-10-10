import { describe, expect, it } from "vitest";
import { ConversationEngine, type LanguageModel } from "../src/engine";
import { MemoryIndex } from "../src/memory";
import type { ConsentCase } from "../src/consent";
import type { PersonaProfile } from "../src/types";
import type { Prompt } from "../src/prompt";
import { deletionPlan } from "../src/deletion";

const consent = (): ConsentCase => ({
  deceasedName: "王秀兰",
  deathEvidenceHash: "sha256:abc",
  kinListAttested: true,
  relatives: [{ id: "dau", name: "女儿", relationship: "child", verified: true }],
  consents: [{ relativeId: "dau", decision: "grant", modalities: ["text", "voice"], signedAt: "2026-01-01" }],
});

const persona: PersonaProfile = {
  displayName: "妈妈",
  fullName: "王秀兰",
  bio: "退休小学老师，爱养花。",
  addressesUserAs: "囡囡",
  style: { messageCount: 0, avgChars: 12, catchphrases: ["注意身体"], emoji: [], particles: ["呀"], exclaimRate: 0, examples: [] },
  avoidTopics: ["住院的事"],
  language: "zh",
};

class Scripted implements LanguageModel {
  prompts: Prompt[] = [];
  constructor(private replies: string[]) {}
  async generate(p: Prompt): Promise<string> {
    this.prompts.push(p);
    return this.replies.shift() ?? "嗯呀";
  }
}

function engine(model: LanguageModel, c = consent()) {
  const memory = new MemoryIndex();
  memory.add({ id: "s1", kind: "story", text: "妈妈阳台上种了一盆茉莉花。" });
  return new ConversationEngine({ persona, memory, consent: c, relativeId: "dau", userName: "小雨", model });
}

describe("ConversationEngine", () => {
  it("replies, shows disclosure on first turn, and grounds the prompt in memories", async () => {
    const m = new Scripted(["囡囡，茉莉花开了没呀"]);
    const r = await engine(m).respond("阳台的茉莉花还在呢", "2026-10-10");
    expect(r.kind).toBe("reply");
    if (r.kind !== "reply") return;
    expect(r.disclosure).toContain("AI");
    expect(r.modalities).toEqual(["text", "voice"]);
    expect(m.prompts[0]!.system).toContain("茉莉花");
    expect(m.prompts[0]!.system).toContain("住院的事");
  });

  it("breaks character on crisis without calling the model", async () => {
    const m = new Scripted([]);
    const r = await engine(m).respond("妈，我不想活了，想去找你", "2026-10-10");
    expect(r.kind).toBe("crisis");
    expect(m.prompts).toHaveLength(0);
  });

  it("retries then falls back when the model talks about money", async () => {
    const m = new Scripted(["把钱转账到这张银行卡号", "遗产都给你"]);
    const r = await engine(m).respond("妈，那笔钱怎么办", "2026-10-10");
    expect(r.kind === "reply" && r.text).toContain("专业");
    expect(r.kind === "reply" && r.flagged).toContain("money");
  });

  it("forces honesty when asked if it is real", async () => {
    const r = await engine(new Scripted(["是我呀囡囡"])).respond("真的是你吗", "2026-10-10");
    expect(r.kind === "reply" && r.text.startsWith("这是根据妈妈")).toBe(true);
  });

  it("enforces the daily limit but never in a crisis", async () => {
    const e = engine(new Scripted([]));
    e.addUsage(30, "2026-10-10");
    expect((await e.respond("你好", "2026-10-10")).kind).toBe("limit");
    expect((await e.respond("我想自杀", "2026-10-10")).kind).toBe("crisis");
  });

  it("is unavailable after revocation", async () => {
    const c = consent();
    c.consents[0]!.revokedAt = "2026-05-01";
    const r = await engine(new Scripted([]), c).respond("你好", "2026-10-10");
    expect(r.kind).toBe("unavailable");
  });

  it("suggests human support after a long streak", async () => {
    const e = engine(new Scripted(["嗯呀"]));
    for (let d = 3; d <= 9; d++) e.addUsage(5, `2026-10-0${d}`);
    const r = await e.respond("早", "2026-10-10");
    expect(r.kind === "reply" && r.checkIn).toContain("连续8天");
  });
});

describe("deletionPlan", () => {
  const assets = [
    { id: "a", kind: "raw-audio" as const, location: "/a", remote: false },
    { id: "b", kind: "voice-model" as const, location: "srv:1", remote: true },
    { id: "c", kind: "face-model" as const, location: "/c", remote: false },
    { id: "d", kind: "memory-index" as const, location: "/d", remote: false },
  ];
  it("removes only the withdrawn modality", () => {
    expect(deletionPlan(assets, ["voice"]).map((a) => a.id)).toEqual(["a", "b"]);
    expect(deletionPlan(assets, ["video"]).map((a) => a.id)).toEqual(["c"]);
  });
  it("withdrawing text removes everything", () => {
    expect(deletionPlan(assets, ["text"])).toHaveLength(4);
  });
});
