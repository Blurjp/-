import { useState } from "react";
import { Alert, View } from "react-native";
import { ALL_MODALITIES, CRISIS_RESOURCES } from "@sinian/core";
import { useVault } from "../state/VaultContext";
import { emptyVault, wipe, VAULT_DIR } from "../state/vault";
import { DEFAULT_MODELS, downloadModel, missingModels } from "../native/models";
import { Button, Chip, Field, Note, Section } from "../ui";

export function SettingsScreen() {
  const { vault, update } = useVault();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState<string>();
  const missing = missingModels();

  const deleteAll = () =>
    Alert.alert("删除全部资料", "所有聊天记录、声音、照片、回忆和生成的模型都会被永久删除，不能恢复。", [
      { text: "取消", style: "cancel" },
      {
        text: "永久删除",
        style: "destructive",
        onPress: () =>
          update((v) => {
            wipe(v, [...ALL_MODALITIES]);
            if (VAULT_DIR.exists) VAULT_DIR.delete();
            Object.assign(v, emptyVault());
          }),
      },
    ]);

  return (
    <View>
      <Section title="现在是谁在使用">
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {vault.consent.relatives.map((r) => (
            <Chip key={r.id} label={r.name} on={vault.activeRelativeId === r.id} onPress={() => update((v) => { v.activeRelativeId = r.id; })} />
          ))}
        </View>
        <Note>只有自己签署了同意书的家人才能开启对话。</Note>
      </Section>

      <Section title="健康使用">
        <Field
          label="每天最多聊几分钟（5–120）"
          keyboardType="number-pad"
          value={String(vault.maxMinutesPerDay)}
          onChangeText={(t) => update((v) => { v.maxMinutesPerDay = Math.min(120, Math.max(5, Number(t) || 30)); })}
        />
        <Note>危机求助热线所在地区：</Note>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {Object.keys(CRISIS_RESOURCES).map((r) => <Chip key={r} label={r} on={vault.region === r} onPress={() => update((v) => { v.region = r; })} />)}
        </View>
      </Section>

      <Section title="离线模型">
        {missing.length === 0 ? (
          <Note>全部模型已就绪，可以完全离线使用。</Note>
        ) : (
          missing.map((name) => (
            <View key={name}>
              <Field label={`${name} 的下载地址`} autoCapitalize="none" value={urls[name] ?? ""} onChangeText={(t) => setUrls((u) => ({ ...u, [name]: t }))} />
              <Button
                kind="plain"
                label={downloading === name ? "下载中…" : `下载 ${name}`}
                disabled={!urls[name] || !!downloading}
                onPress={async () => {
                  setDownloading(name);
                  try { await downloadModel(urls[name]!, name); } finally { setDownloading(undefined); }
                }}
              />
            </View>
          ))
        )}
        <Note>推荐模型见 docs/ARCHITECTURE.md。文件名：{Object.values(DEFAULT_MODELS).join("、")}。建议在 Wi-Fi 下下载。</Note>
      </Section>

      <Section title="告别与删除">
        <Note>
          当你觉得准备好了，可以和 TA 好好告别，然后删除。很多家庭会在周年或某个节日做这件事。删除后所有资料与模型都会从这台手机上消失。
        </Note>
        <Button kind="danger" label="永久删除全部资料" onPress={deleteAll} />
      </Section>
    </View>
  );
}
