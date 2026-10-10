import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TextInput, View } from "react-native";
import { File } from "expo-file-system";
import { ConversationEngine, MemoryIndex, DEFAULT_WELLBEING, describeReason, localDay, type EngineReply } from "@sinian/core";
import { useStrings, useVault } from "../state/VaultContext";
import { LocalLlm } from "../native/llm";
import { VoiceClone } from "../native/voice";
import { DEFAULT_MODELS, missingModels } from "../native/models";
import { Button, Note, Section, colors } from "../ui";

interface Bubble {
  from: "user" | "ai" | "system";
  text: string;
  tone?: "crisis" | "info";
}

const today = () => localDay(new Date());

export function ChatScreen() {
  const { vault, update } = useVault();
  const t = useStrings();
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
  const engineKey = JSON.stringify([me?.id, persona, vault.consent, vault.memories.length, vault.region, vault.maxMinutesPerDay, vault.lang]);
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
      uiLang: vault.lang,
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

  if (!me) return <Section title={t.chat.whoFirst}><Note>{t.chat.whoFirstNote}</Note></Section>;
  if (!persona || !engine) return <Section title={t.chat.noData}><Note>{t.chat.noDataNote}</Note></Section>;
  if (missing.length) return <Section title={t.chat.needModels}><Note>{t.chat.needModelsNote(missing.join(", "))}</Note></Section>;

  const photo = vault.assets.find((a) => a.kind === "raw-image");
  const audioRef = vault.assets.find((a) => a.kind === "raw-audio");

  const show = (r: EngineReply) => {
    const out: Bubble[] = [];
    if (r.kind === "reply") {
      if (r.disclosure) out.push({ from: "system", text: r.disclosure, tone: "info" });
      out.push({ from: "ai", text: r.text });
      if (r.checkIn) out.push({ from: "system", text: r.checkIn, tone: "info" });
      if (voiceOn && r.modalities.includes("voice")) voice.current?.speak(r.text).catch(() => {});
    } else if (r.kind === "crisis") {
      out.push({ from: "system", text: r.text, tone: "crisis" });
      update((v) => { v.crisisReferrals += 1; });
    }
    else if (r.kind === "limit") out.push({ from: "system", text: r.text, tone: "info" });
    else out.push({ from: "system", text: r.reasons.map((x) => describeReason(x, vault.lang)).join("\n"), tone: "info" });
    setBubbles((b) => [...b, ...out]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBubbles((b) => [...b, { from: "user", text }]);
    setBusy(true);
    try {
      show(await engine.respond(text, new Date()));
    } catch (e) {
      setBubbles((b) => [...b, { from: "system", text: t.chat.error(String(e)), tone: "info" }]);
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
          <Text style={{ fontSize: 12, color: colors.muted }}>{t.chat.label}</Text>
        </View>
        {audioRef && vault.voiceRefText && (
          <Button kind="plain" label={voiceOn ? t.chat.voiceOn : t.chat.voiceOff} onPress={voiceOn ? () => setVoiceOn(false) : enableVoice} />
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
          placeholder={t.chat.placeholder(persona.displayName)}
          multiline
          style={{ flex: 1, backgroundColor: colors.card, borderRadius: 10, padding: 10, fontSize: 16, maxHeight: 120 }}
        />
        <Button label={t.chat.send} onPress={send} disabled={busy || !input.trim()} />
      </View>
    </View>
  );
}
