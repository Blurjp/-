import { useState } from "react";
import { Text, View } from "react-native";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import {
  ALL_MODALITIES,
  describeReason,
  evaluateConsent,
  requiredSigners,
  type Jurisdiction,
  type Modality,
  type Relationship,
  type Relative,
} from "@sinian/core";
import { useStrings, useVault } from "../state/VaultContext";
import { wipe } from "../state/vault";
import { Button, Chip, Field, Note, Section, colors } from "../ui";

/** Hash a picked document; the document itself is deleted right away. */
async function sha256OfPickedFile(): Promise<string | undefined> {
  const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (r.canceled || !r.assets[0]) return;
  const f = new File(r.assets[0].uri);
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, await f.bytes());
  f.delete();
  return "sha256:" + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function SignPanel({ relative, northAmerica, onDone }: { relative: Relative; northAmerica: boolean; onDone: () => void }) {
  const { update } = useVault();
  const t = useStrings();
  const [mods, setMods] = useState<Modality[]>(["text", "voice"]);
  const [typed, setTyped] = useState("");
  const [adult, setAdult] = useState(false);
  const [release, setRelease] = useState(false);
  const askRelease = northAmerica && !!relative.personalRepresentative;
  const toggle = (m: Modality) => setMods((x) => (x.includes(m) ? x.filter((y) => y !== m) : [...x, m]));
  const signed = typed.trim() === relative.name && adult;

  const sign = (decision: "grant" | "refuse") => {
    update((v) => {
      v.consent.consents.push({
        relativeId: relative.id,
        decision,
        modalities: decision === "grant" ? mods : [],
        signedAt: new Date().toISOString(),
        ...(askRelease && decision === "grant" ? { biometricRelease: release } : {}),
      });
    });
    onDone();
  };

  return (
    <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderRadius: 8 }}>
      <Note>{t.sign.intro(relative.name)}</Note>
      <Text style={{ marginTop: 8 }}>{t.sign.allow}</Text>
      <View style={{ flexDirection: "row", gap: 8, marginVertical: 6, flexWrap: "wrap" }}>
        {ALL_MODALITIES.map((m) => <Chip key={m} label={t.modality[m]} on={mods.includes(m)} onPress={() => toggle(m)} />)}
      </View>
      {askRelease && (
        <View style={{ marginVertical: 6 }}>
          <Text style={{ fontWeight: "600" }}>{t.sign.biometricTitle}</Text>
          <Note>{t.sign.biometric}</Note>
          <Chip label={t.sign.biometricAgree} on={release} onPress={() => setRelease((x) => !x)} />
        </View>
      )}
      <Field label={t.sign.typeName(relative.name)} value={typed} onChangeText={setTyped} autoCapitalize="words" />
      <Chip label={t.sign.adult} on={adult} onPress={() => setAdult((a) => !a)} />
      <Button label={t.sign.agree} disabled={!signed || !mods.includes("text")} onPress={() => sign("grant")} />
      <Button label={t.sign.decline} kind="plain" disabled={!signed} onPress={() => sign("refuse")} />
    </View>
  );
}

export function ConsentScreen() {
  const { vault, update } = useVault();
  const t = useStrings();
  const c = vault.consent;
  const jurisdiction: Jurisdiction = c.jurisdiction ?? "US";
  const northAmerica = jurisdiction !== "CN";
  const status = evaluateConsent(c);
  const required = new Set(requiredSigners(c).map((r) => r.id));
  const [name, setName] = useState("");
  const [rel, setRel] = useState<Relationship>("child");
  const [signing, setSigning] = useState<string>();
  const modList = (ms: Modality[]) => ms.map((m) => t.modality[m]).join(", ");

  const latest = (id: string) =>
    [...c.consents].filter((k) => k.relativeId === id).sort((a, b) => b.signedAt.localeCompare(a.signedAt))[0];

  const editRelative = (id: string, fn: (r: Relative) => void) =>
    update((v) => {
      const r = v.consent.relatives.find((x) => x.id === id);
      if (r) fn(r);
    });

  const revoke = (id: string) =>
    update((v) => {
      const k = [...v.consent.consents].filter((x) => x.relativeId === id).sort((a, b) => b.signedAt.localeCompare(a.signedAt))[0];
      if (k) k.revokedAt = new Date().toISOString();
      const s = evaluateConsent(v.consent);
      if (s.state === "revoked") wipe(v, s.mustDelete);
    });

  return (
    <View>
      <Section title={t.consent.status}>
        <Text style={{ fontSize: 16, color: status.state === "active" ? "green" : colors.ink }}>{t.consent.states[status.state]}</Text>
        {"reasons" in status && status.reasons.map((r, i) => <Note key={i}>• {describeReason(r, vault.lang)}</Note>)}
        {status.state === "active" && (
          <>
            <Note>{t.consent.allowed(modList(status.modalities))}</Note>
            {status.notes.map((r, i) => <Note key={i}>• {describeReason(r, vault.lang)}</Note>)}
          </>
        )}
      </Section>

      <Section title={t.consent.jurisdiction}>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {(["US", "CA", "CN"] as const).map((j) => (
            <Chip key={j} label={t.consent.jurisdictions[j]} on={jurisdiction === j} onPress={() => update((v) => { v.consent.jurisdiction = j; })} />
          ))}
        </View>
      </Section>

      <Section title={t.consent.person}>
        <Field label={t.consent.fullName} value={c.deceasedName} onChangeText={(x) => update((v) => { v.consent.deceasedName = x; })} />
        <Button
          kind="plain"
          label={c.deathEvidenceHash ? t.consent.deathCertDone : t.consent.deathCert}
          onPress={async () => {
            const h = await sha256OfPickedFile();
            if (h) update((v) => { v.consent.deathEvidenceHash = h; });
          }}
        />
        <Note>{t.consent.directiveNote(c.deceasedName)}</Note>
      </Section>

      <Section title={t.consent.family}>
        {c.relatives.map((r) => {
          const k = latest(r.id);
          return (
            <View key={r.id} style={{ paddingVertical: 8, borderBottomWidth: 0.5, borderColor: "#ddd" }}>
              <Text style={{ fontSize: 16 }}>
                {r.name} ({t.relationship[r.relationship]}){r.personalRepresentative ? ` · ${t.consent.executor}` : ""}
                {required.has(r.id) ? "" : t.consent.notRequired}
              </Text>
              <Note>
                {r.verified ? t.consent.verified : t.consent.unverified} ·{" "}
                {!k ? t.consent.unsigned : k.revokedAt ? t.consent.withdrawn : k.decision === "grant" ? t.consent.agreed(modList(k.modalities)) : t.consent.declined}
              </Note>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {northAmerica && (
                  <Chip
                    label={t.consent.markExecutor}
                    on={!!r.personalRepresentative}
                    onPress={() => editRelative(r.id, (x) => { x.personalRepresentative = !x.personalRepresentative; })}
                  />
                )}
                {northAmerica && r.personalRepresentative && (
                  <Button
                    kind="plain"
                    label={r.authorityEvidenceHash ? t.consent.lettersDone : t.consent.lettersUpload}
                    onPress={async () => {
                      const h = await sha256OfPickedFile();
                      if (h) editRelative(r.id, (x) => { x.authorityEvidenceHash = h; });
                    }}
                  />
                )}
                {!r.verified && <Button kind="plain" label={t.consent.verifyId} onPress={() => editRelative(r.id, (x) => { x.verified = true; })} />}
                {(!k || k.revokedAt) && <Button kind="plain" label={t.consent.sign} onPress={() => setSigning(r.id)} />}
                {k && !k.revokedAt && k.decision === "grant" && <Button kind="danger" label={t.consent.withdraw} onPress={() => revoke(r.id)} />}
              </View>
              {signing === r.id && <SignPanel relative={r} northAmerica={northAmerica} onDone={() => setSigning(undefined)} />}
            </View>
          );
        })}
        <Field label={t.consent.addName} value={name} onChangeText={setName} autoCapitalize="words" />
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {(Object.keys(t.relationship) as Relationship[]).map((k) => <Chip key={k} label={t.relationship[k]} on={rel === k} onPress={() => setRel(k)} />)}
        </View>
        <Button
          label={t.consent.add}
          disabled={!name.trim()}
          onPress={() => {
            update((v) => { v.consent.relatives.push({ id: Crypto.randomUUID(), name: name.trim(), relationship: rel, verified: false }); });
            setName("");
          }}
        />
        <Button
          kind={c.kinListAttested ? "plain" : "primary"}
          label={c.kinListAttested ? t.consent.attested : t.consent.attest}
          onPress={() => update((v) => { v.consent.kinListAttested = !v.consent.kinListAttested; })}
        />
        <Note>{t.consent.rule}</Note>
      </Section>
    </View>
  );
}
