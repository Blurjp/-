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
import { useStrings, useVault } from "../state/VaultContext";
import { copyIntoVault, replaceAsset } from "../state/vault";
import { Button, Chip, Field, Note, Section } from "../ui";

async function pick(type: string): Promise<File | undefined> {
  const r = await DocumentPicker.getDocumentAsync({ type, copyToCacheDirectory: true });
  return r.canceled || !r.assets[0] ? undefined : new File(r.assets[0].uri);
}

export function ImportScreen() {
  const { vault, update } = useVault();
  const t = useStrings();
  const status = evaluateConsent(vault.consent);
  const [chat, setChat] = useState<{ messages: ChatMessage[]; file: File }>();
  const [story, setStory] = useState("");

  if (status.state !== "active") {
    return (
      <Section title={t.import.locked}>
        <Note>{t.import.lockedNote}</Note>
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
      <Section title={t.import.chats}>
        <Note>{t.import.chatsNote}</Note>
        <Button
          kind="plain"
          label={t.import.pick}
          onPress={async () => {
            // JSON, XML, CSV and TXT exports all come through here; the parser sniffs the format.
            const f = await pick("*/*");
            if (f) setChat({ messages: parseChatExport(await f.text()), file: f });
          }}
        />
        {chat && (
          <>
            <Note>{t.import.whichOne(chat.messages.length, vault.consent.deceasedName)}</Note>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {senders(chat.messages).slice(0, 8).map((s) => <Chip key={s} label={s} on={false} onPress={() => choose(s)} />)}
            </View>
          </>
        )}
        {p && (
          <Note>{t.import.learned(p.style.messageCount, p.style.avgChars, p.style.catchphrases.slice(0, 5).join(", "))}</Note>
        )}
      </Section>

      {p && (
        <Section title={t.import.about}>
          <Field label={t.import.displayName} value={p.displayName} onChangeText={(x) => update((v) => { v.persona!.displayName = x; })} />
          <Field label={t.import.addressesYou} value={p.addressesUserAs ?? ""} onChangeText={(x) => update((v) => { v.persona!.addressesUserAs = x || undefined; })} />
          <Field label={t.import.bio} multiline value={p.bio} onChangeText={(x) => update((v) => { v.persona!.bio = x; })} />
          <Field
            label={t.import.avoid}
            value={p.avoidTopics.join(", ")}
            onChangeText={(x) => update((v) => { v.persona!.avoidTopics = x.split(/[、,，]/).map((y) => y.trim()).filter(Boolean); })}
          />
        </Section>
      )}

      <Section title={t.import.memories}>
        <Note>{t.import.memoriesNote(vault.memories.filter((m) => m.kind !== "chat").length)}</Note>
        <Field label={t.import.memoryField} multiline value={story} onChangeText={setStory} placeholder={t.import.memoryPlaceholder} />
        <Button
          label={t.import.saveMemory}
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
        <Section title={t.import.voice}>
          <Note>{t.import.voiceNote}</Note>
          <Field label={t.import.voiceText} value={vault.voiceRefText ?? ""} onChangeText={(x) => update((v) => { v.voiceRefText = x; })} />
          <Button
            kind="plain"
            label={vault.assets.some((a) => a.kind === "raw-audio") ? t.import.voicePicked : t.import.voicePick}
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
        <Section title={t.import.photo}>
          <Button
            kind="plain"
            label={vault.assets.some((a) => a.kind === "raw-image") ? t.import.photoPicked : t.import.photoPick}
            onPress={async () => {
              const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
              const uri = r.canceled ? undefined : r.assets[0]?.uri;
              if (!uri) return;
              const rec = copyIntoVault(new File(uri), "raw-image");
              update((v) => replaceAsset(v, rec));
            }}
          />
          <Note>{t.import.photoNote}</Note>
        </Section>
      )}

      {!allowed.includes("voice") && !allowed.includes("image") && (
        <Text style={{ textAlign: "center", marginTop: 8 }}>{t.import.textOnly}</Text>
      )}
    </View>
  );
}
