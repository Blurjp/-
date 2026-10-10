import { describe, expect, it } from "vitest";
import { parseChatExport, parseWhatsApp, parseWeChatText, senders } from "../src/importers/index";

describe("WhatsApp", () => {
  it("parses iOS format, multiline and skips media", () => {
    const raw = [
      "[3/4/22, 9:05:11 PM] Mum: Did you eat?",
      "Remember your coat",
      "[3/4/22, 9:06:00 PM] Me: yes mum",
      "[3/4/22, 9:07:00 PM] Mum: image omitted",
    ].join("\n");
    const m = parseWhatsApp(raw);
    expect(m).toHaveLength(2);
    expect(m[0]).toEqual({ time: "2022-04-03T21:05:11", sender: "Mum", text: "Did you eat?\nRemember your coat" });
  });

  it("parses Android format", () => {
    const m = parseWhatsApp("25/12/2021, 08:30 - Dad: Merry Christmas!");
    expect(m[0]).toEqual({ time: "2021-12-25T08:30:00", sender: "Dad", text: "Merry Christmas!" });
  });
});

describe("WeChat", () => {
  const raw = [
    "2023-05-01 20:15:03 妈妈",
    "吃饭了没",
    "",
    "2023-05-01 20:16:10 我",
    "吃了",
    "2023-05-01 20:16:30 妈妈",
    "[图片]",
    "2023-05-01 20:17:00 妈妈",
    "天冷了多穿点呢",
    "别感冒了",
  ].join("\n");

  it("parses header + body blocks and skips placeholders", () => {
    const m = parseWeChatText(raw);
    expect(m.map((x) => x.text)).toEqual(["吃饭了没", "吃了", "天冷了多穿点呢\n别感冒了"]);
    expect(m[0]!.time).toBe("2023-05-01T20:15:03");
  });

  it("is auto-detected", () => {
    expect(parseChatExport(raw)).toHaveLength(3);
    expect(senders(parseChatExport(raw))).toEqual(["妈妈", "我"]);
  });
});
