import { useState } from "react";
import { Alert, View } from "react-native";
import { ALL_MODALITIES, CRISIS_RESOURCES } from "@sinian/core";
import { useStrings, useVault } from "../state/VaultContext";
import { emptyVault, wipe, VAULT_DIR } from "../state/vault";
import { DEFAULT_MODELS, downloadModel, missingModels } from "../native/models";
import { Button, Chip, Field, Note, Section } from "../ui";

export function SettingsScreen() {
  const { vault, update } = useVault();
  const t = useStrings();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState<string>();
  const missing = missingModels();

  const deleteAll = () =>
    Alert.alert(t.settings.deleteTitle, t.settings.deleteBody, [
      { text: t.settings.cancel, style: "cancel" },
      {
        text: t.settings.confirmDelete,
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
      <Section title={t.settings.who}>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {vault.consent.relatives.map((r) => (
            <Chip key={r.id} label={r.name} on={vault.activeRelativeId === r.id} onPress={() => update((v) => { v.activeRelativeId = r.id; })} />
          ))}
        </View>
        <Note>{t.settings.whoNote}</Note>
      </Section>

      <Section title={t.settings.wellbeing}>
        <Field
          label={t.settings.minutes}
          keyboardType="number-pad"
          value={String(vault.maxMinutesPerDay)}
          onChangeText={(x) => update((v) => { v.maxMinutesPerDay = Math.min(120, Math.max(5, Number(x) || 30)); })}
        />
        <Note>{t.settings.region}</Note>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {Object.keys(CRISIS_RESOURCES).map((r) => <Chip key={r} label={r} on={vault.region === r} onPress={() => update((v) => { v.region = r; })} />)}
        </View>
        <Note>{t.settings.language}</Note>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Chip label="English" on={vault.lang === "en"} onPress={() => update((v) => { v.lang = "en"; })} />
          <Chip label="中文" on={vault.lang === "zh"} onPress={() => update((v) => { v.lang = "zh"; })} />
        </View>
      </Section>

      <Section title={t.settings.models}>
        {missing.length === 0 ? (
          <Note>{t.settings.modelsReady}</Note>
        ) : (
          missing.map((name) => (
            <View key={name}>
              <Field label={t.settings.url(name)} autoCapitalize="none" value={urls[name] ?? ""} onChangeText={(x) => setUrls((u) => ({ ...u, [name]: x }))} />
              <Button
                kind="plain"
                label={downloading === name ? t.settings.downloading : t.settings.download(name)}
                disabled={!urls[name] || !!downloading}
                onPress={async () => {
                  setDownloading(name);
                  try { await downloadModel(urls[name]!, name); } finally { setDownloading(undefined); }
                }}
              />
            </View>
          ))
        )}
        <Note>{t.settings.modelsNote(Object.values(DEFAULT_MODELS).join(", "))}</Note>
      </Section>

      <Section title={t.settings.farewell}>
        <Note>
          {t.settings.farewellNote}
        </Note>
        <Button kind="danger" label={t.settings.deleteAll} onPress={deleteAll} />
        <Note>{t.settings.safety(vault.crisisReferrals)}</Note>
      </Section>
    </View>
  );
}
