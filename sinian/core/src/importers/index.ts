import type { ChatMessage } from "../types";

/**
 * Chat history importers. Everything runs on the phone; raw exports are never uploaded.
 *
 * Supported:
 *  - WhatsApp "Export chat" (iOS `[d/m/yy, hh:mm:ss] Name: text` and
 *    Android `d/m/yy, hh:mm - Name: text`).
 *  - WeChat text exports as produced by common PC backup tools
 *    (`2023-05-01 20:15:03 妈妈` header line, message body on following lines).
 * Continuation lines (multi-line messages) are appended to the previous message.
 */

const WA_IOS = /^‎?\[(\d{1,4})[./-](\d{1,2})[./-](\d{1,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?\]\s+([^:]+):\s?(.*)$/i;
const WA_ANDROID = /^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?\s+-\s+([^:]+):\s?(.*)$/i;
const WECHAT_HEADER = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(.+?)\s*$/;

/** WhatsApp placeholders for media and system lines that carry no words of the person. */
const WA_SKIP = /^(<Media omitted>|<附件：.*>|image omitted|audio omitted|video omitted|sticker omitted|This message was deleted|‎?Messages and calls are end-to-end encrypted.*)$/i;
const WECHAT_SKIP = /^(\[图片\]|\[语音\]|\[视频\]|\[表情\]|\[动画表情\]|\[文件\]|\[位置\]|\[链接\].*|.*撤回了一条消息)$/;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function waTime(m: RegExpMatchArray): string {
  // WhatsApp follows the phone's locale; assume day-first unless that is impossible.
  let a = Number(m[1]), b = Number(m[2]), y = Number(m[3]);
  if (a > 31) [a, y] = [y, a]; // year-first export
  let day = a, month = b;
  if (month > 12 && day <= 12) [day, month] = [month, day];
  if (y < 100) y += 2000;
  let h = Number(m[4]);
  const ampm = m[7]?.toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${y}-${pad(month)}-${pad(day)}T${pad(h)}:${m[5]}:${m[6] ?? "00"}`;
}

export function parseWhatsApp(raw: string): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(WA_IOS) ?? line.match(WA_ANDROID);
    if (m) {
      const text = (m[9] ?? "").trim();
      if (WA_SKIP.test(text)) continue;
      out.push({ time: waTime(m), sender: (m[8] ?? "").trim(), text });
    } else if (out.length > 0 && line.trim()) {
      out[out.length - 1]!.text += "\n" + line.trim();
    }
  }
  return out.filter((x) => x.text.length > 0);
}

export function parseWeChatText(raw: string): ChatMessage[] {
  const out: ChatMessage[] = [];
  let current: ChatMessage | undefined;
  const flush = () => {
    if (current && current.text && !WECHAT_SKIP.test(current.text)) out.push(current);
    current = undefined;
  };
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(WECHAT_HEADER);
    if (m) {
      flush();
      current = {
        time: `${m[1]}-${m[2]}-${m[3]}T${pad(Number(m[4]))}:${m[5]}:${m[6]}`,
        sender: m[7] ?? "",
        text: "",
      };
    } else if (current && line.trim()) {
      current.text = current.text ? current.text + "\n" + line.trim() : line.trim();
    }
  }
  flush();
  return out;
}

/** Pick a parser by sniffing the first non-empty lines. */
export function parseChatExport(raw: string): ChatMessage[] {
  const head = raw.split(/\r?\n/).filter((l) => l.trim()).slice(0, 5);
  if (head.some((l) => WECHAT_HEADER.test(l))) return parseWeChatText(raw);
  return parseWhatsApp(raw);
}

/** Distinct sender names, most active first — used for the "which one is them?" picker. */
export function senders(messages: ChatMessage[]): string[] {
  const counts = new Map<string, number>();
  for (const m of messages) counts.set(m.sender, (counts.get(m.sender) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
}
