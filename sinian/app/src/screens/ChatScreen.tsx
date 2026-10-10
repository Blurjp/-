import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TextInput, View } from "react-native";
import { File } from "expo-file-system";
import { ConversationEngine, MemoryIndex, DEFAULT_WELLBEING, type EngineReply } from "@sinian/core";
import { useVault } from "../state/VaultContext";
import { LocalLlm } from "../native/llm";
import { VoiceClone } from "../native/voice";
import { DEFAULT_MODELS, missingModels } from "../native/models";
import { Button, Note, Section, colors } from "../ui";

interface Bubble {
  from: "user" | "ai" | "system";
  text: string;
  tone?: "crisis" | "info";
}

const today = () => new Date().toISOString().slice(0, 10);

export function ChatScreen() {
  const { vault, update } = useVault();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const voice = useRef<VoiceClone>(undefined);
  const scroll = useRef<ScrollView>(null);
  const persona = vault.persona;
  const me = vault.consent.relatives.find((r) => r.id === vault.activeRelativeId);
  const missing = missingModels();

  // Every vault update produces fresh objects (usage ticks every minute), so key
  // the engine on content: rebuilding it would drop the conversation so far.
  const engineKey = JSON.stringify([me?.id, persona, vault.consent, vault.memories.length, vault.region, vault.maxMinutesPerDay]);
  const engine = useMemo(() => {
    if (!persona || !me) return undefined;
    const memory = new MemoryIndex();
    for (const m of vault.memories) memory.add(m);
    return new ConversationEngine({
      persona,
      memory,
      consent: vault.consent,
      relativeId: me.id,
      userName: me.name,
      model: new LocalLlm(DEFAULT_MODELS.chat),
      region: vault.region,
      policy: { ...DEFAULT_WELLBEING, maxMinutesPerDay: vault.maxMinutesPerDay },
      usage: structuredClone(vault.usage),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineKey]);

  // Count open-screen time towards the daily limit, one minute at a time.
  useEffect(() => {
    if (!engine) return;
    const t = setInterval(() => {
      engine.addUsage(1, today());
      update((v) => { v.usage.minutesByDay[today()] = (v.usage.minutesByDay[today()] ?? 0) + 1; });
    }, 60_000);
    return () => clearInterval(t);
  }, [engine, update]);

  useEffect(() => () => { voice.current?.release(); }, []);

  if (!me) return <Section title="请先选择你是谁"><Note>在"设置"里选择正在使用这台手机的家人。</Note></Section>;
  if (!persona || !engine) return <Section title="还没有资料"><Note>请先在"导入资料"中导入聊天记录。</Note></Section>;
  if (missing.length) return <Section title="需要下载模型"><Note>缺少：{missing.join("、")}。在"设置"里下载后即可离线使用。</Note></Section>;

  const photo = vault.assets.find((a) => a.kind === "raw-image");
  const audioRef = vault.assets.find((a) => a.kind === "raw-audio");

  const show = (r: EngineReply) => {
    const out: Bubble[] = [];
    if (r.kind === "reply") {
      if (r.disclosure) out.push({ from: "system", text: r.disclosure, tone: "info" });
      out.push({ from: "ai", text: r.text });
      if (r.checkIn) out.push({ from: "system", text: r.checkIn, tone: "info" });
      if (voiceOn && r.modalities.includes("voice")) voice.current?.speak(r.text).catch(() => {});
    } else if (r.kind === "crisis") out.push({ from: "system", text: r.text, tone: "crisis" });
    else if (r.kind === "limit") out.push({ from: "system", text: r.text, tone: "info" });
    else out.push({ from: "system", text: r.reasons.join("\n"), tone: "info" });
    setBubbles((b) => [...b, ...out]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBubbles((b) => [...b, { from: "user", text }]);
    setBusy(true);
    try {
      show(await engine.respond(text, today()));
    } catch (e) {
      setBubbles((b) => [...b, { from: "system", text: `出错了：${String(e)}`, tone: "info" }]);
    } finally {
      setBusy(false);
      setTimeout(() => scroll.current?.scrollToEnd(), 50);
    }
  };

  const enableVoice = async () => {
    if (!audioRef || !vault.voiceRefText) return;
    setBusy(true);
    try {
      voice.current ??= new VoiceClone(DEFAULT_MODELS.ttsBackbone, DEFAULT_MODELS.ttsCodec);
      await voice.current.setReference(new File(audioRef.location), vault.voiceRefText);
      setVoiceOn(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
        {photo && <Image source={{ uri: photo.location }} style={{ width: 56, height: 56, borderRadius: 28 }} />}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "600" }}>{persona.displayName}</Text>
          {/* Permanent label: this is never presented as the real person. */}
          <Text style={{ fontSize: 12, color: colors.muted }}>AI 模拟 · 根据遗留资料生成 · 可能出错</Text>
        </View>
        {audioRef && vault.voiceRefText && (
          <Button kind="plain" label={voiceOn ? "🔊 声音开" : "🔈 开启声音"} onPress={voiceOn ? () => setVoiceOn(false) : enableVoice} />
        )}
      </View>

      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
        {bubbles.map((b, i) => (
          <View
            key={i}
            style={{
              alignSelf: b.from === "user" ? "flex-end" : b.from === "ai" ? "flex-start" : "center",
              maxWidth: b.from === "system" ? "95%" : "80%",
              backgroundColor: b.from === "user" ? colors.accent : b.tone === "crisis" ? "#fde7e4" : b.from === "ai" ? colors.card : colors.ai,
              borderRadius: 12, padding: 10, marginVertical: 4,
            }}
          >
            <Text style={{ color: b.from === "user" ? "#fff" : colors.ink, fontSize: b.from === "system" ? 13 : 16 }}>{b.text}</Text>
          </View>
        ))}
        {busy && <ActivityIndicator style={{ marginTop: 8 }} />}
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={`和${persona.displayName}说点什么…`}
          multiline
          style={{ flex: 1, backgroundColor: colors.card, borderRadius: 10, padding: 10, fontSize: 16, maxHeight: 120 }}
        />
        <Button label="发送" onPress={send} disabled={busy || !input.trim()} />
      </View>
    </View>
  );
}
