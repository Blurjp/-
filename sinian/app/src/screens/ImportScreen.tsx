import { useState } from "react";
import { Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import {
  buildStyleProfile,
  chatToMemories,
  evaluateConsent,
  isMostlyChinese,
  parseChatExport,
  senders,
  type ChatMessage,
} from "@sinian/core";
import { useVault } from "../state/VaultContext";
import { copyIntoVault, replaceAsset } from "../state/vault";
import { Button, Chip, Field, Note, Section } from "../ui";

async function pick(type: string): Promise<File | undefined> {
  const r = await DocumentPicker.getDocumentAsync({ type, copyToCacheDirectory: true });
  return r.canceled || !r.assets[0] ? undefined : new File(r.assets[0].uri);
}

export function ImportScreen() {
  const { vault, update } = useVault();
  const status = evaluateConsent(vault.consent);
  const [chat, setChat] = useState<{ messages: ChatMessage[]; file: File }>();
  const [story, setStory] = useState("");

  if (status.state !== "active") {
    return (
      <Section title="还不能导入资料">
        <Note>需要先在"家人同意"中完成全部授权。在那之前，App 不会读取任何资料。</Note>
      </Section>
    );
  }
  const allowed = status.modalities;
  const p = vault.persona;
  const me = vault.consent.relatives.find((r) => r.id === vault.activeRelativeId);

  const choose = (self: string) => {
    if (!chat) return;
    const style = buildStyleProfile(chat.messages, self);
    const zh = isMostlyChinese(chat.messages.slice(0, 200).map((m) => m.text).join(""));
    const rec = copyIntoVault(chat.file, "raw-chat");
    chat.file.delete();
    update((v) => {
      replaceAsset(v, rec);
      v.memories = [...v.memories.filter((m) => m.kind !== "chat"), ...chatToMemories(chat.messages)];
      v.persona = {
        displayName: v.persona?.displayName ?? self,
        fullName: v.consent.deceasedName,
        bio: v.persona?.bio ?? "",
        addressesUserAs: v.persona?.addressesUserAs,
        avoidTopics: v.persona?.avoidTopics ?? [],
        language: zh ? "zh" : "en",
        style,
      };
    });
    setChat(undefined);
  };

  return (
    <View>
      <Section title="1. 聊天记录">
        <Note>支持微信（PC 备份工具导出的 txt）和 WhatsApp"导出聊天"。只在本机解析，不会上传。</Note>
        <Button
          kind="plain"
          label="选择聊天记录文件"
          onPress={async () => {
            const f = await pick("text/*");
            if (f) setChat({ messages: parseChatExport(await f.text()), file: f });
          }}
        />
        {chat && (
          <>
            <Note>共 {chat.messages.length} 条消息。哪一位是 {vault.consent.deceasedName}？</Note>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {senders(chat.messages).slice(0, 8).map((s) => <Chip key={s} label={s} on={false} onPress={() => choose(s)} />)}
            </View>
          </>
        )}
        {p && (
          <Note>
            已学习 {p.style.messageCount} 条消息 · 平均 {p.style.avgChars} 字 · 口头禅：{p.style.catchphrases.slice(0, 5).join("、") || "—"}
          </Note>
        )}
      </Section>

      {p && (
        <Section title="2. 关于 TA">
          <Field label="App 里怎么称呼 TA（如：妈妈）" value={p.displayName} onChangeText={(t) => update((v) => { v.persona!.displayName = t; })} />
          <Field label="TA 平时怎么叫你" value={p.addressesUserAs ?? ""} onChangeText={(t) => update((v) => { v.persona!.addressesUserAs = t || undefined; })} />
          <Field label="简介：性格、职业、爱好、重要的人" multiline value={p.bio} onChangeText={(t) => update((v) => { v.persona!.bio = t; })} />
          <Field
            label="不希望 TA 主动提起的话题（用顿号分隔）"
            value={p.avoidTopics.join("、")}
            onChangeText={(t) => update((v) => { v.persona!.avoidTopics = t.split(/[、,，]/).map((x) => x.trim()).filter(Boolean); })}
          />
        </Section>
      )}

      <Section title="3. 回忆">
        <Note>写下具体的往事。TA 只会提起这里和聊天记录里真实存在的事，不会编造。已有 {vault.memories.filter((m) => m.kind !== "chat").length} 条。</Note>
        <Field label="一段回忆" multiline value={story} onChangeText={setStory} placeholder="1998 年夏天全家去北戴河，妈妈第一次看到海……" />
        <Button
          label="保存这段回忆"
          disabled={!story.trim()}
          onPress={() => {
            update((v) => {
              v.memories.push({ id: `story-${Date.now()}`, kind: "story", text: story.trim(), contributedBy: me?.name });
            });
            setStory("");
          }}
        />
      </Section>

      {allowed.includes("voice") && (
        <Section title="4. 声音">
          <Note>选一段 10–30 秒、只有 TA 一个人说话、没有背景音乐的录音（16-bit WAV），并写下这段话的原文。</Note>
          <Field label="录音里说的话" value={vault.voiceRefText ?? ""} onChangeText={(t) => update((v) => { v.voiceRefText = t; })} />
          <Button
            kind="plain"
            label={vault.assets.some((a) => a.kind === "raw-audio") ? "✓ 已选择录音（点此更换）" : "选择录音"}
            onPress={async () => {
              const f = await pick("audio/wav");
              if (!f) return;
              const rec = copyIntoVault(f, "raw-audio");
              f.delete();
              update((v) => replaceAsset(v, rec));
            }}
          />
        </Section>
      )}

      {allowed.includes("image") && (
        <Section title="5. 照片">
          <Button
            kind="plain"
            label={vault.assets.some((a) => a.kind === "raw-image") ? "✓ 已选择照片（点此更换）" : "选择一张正脸照片"}
            onPress={async () => {
              const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
              const uri = r.canceled ? undefined : r.assets[0]?.uri;
              if (!uri) return;
              const rec = copyIntoVault(new File(uri), "raw-image");
              update((v) => replaceAsset(v, rec));
            }}
          />
          <Note>照片会显示在对话页，并始终带有"AI 模拟"标识。会动的说话头像在路线图第二阶段（见 docs/ARCHITECTURE.md）。</Note>
        </Section>
      )}

      {!allowed.includes("voice") && !allowed.includes("image") && (
        <Text style={{ textAlign: "center", marginTop: 8 }}>家人只同意了文字对话。</Text>
      )}
    </View>
  );
}
