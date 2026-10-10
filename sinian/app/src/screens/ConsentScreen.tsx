import { useState } from "react";
import { Text, View } from "react-native";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import {
  ALL_MODALITIES,
  decisiveRelatives,
  evaluateConsent,
  type Modality,
  type Relationship,
  type Relative,
} from "@sinian/core";
import { useVault } from "../state/VaultContext";
import { wipe } from "../state/vault";
import { Button, Chip, Field, Note, Section, colors } from "../ui";

const REL_LABEL: Record<Relationship, string> = {
  spouse: "配偶", child: "子女", parent: "父母", sibling: "兄弟姐妹",
  grandparent: "祖父母/外祖父母", grandchild: "孙子女/外孙子女", other: "其他",
};
export const MOD_LABEL: Record<Modality, string> = { text: "文字", voice: "声音", image: "照片", video: "视频" };

async function sha256OfPickedFile(): Promise<string | undefined> {
  const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (r.canceled || !r.assets[0]) return;
  const f = new File(r.assets[0].uri);
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, await f.bytes());
  f.delete(); // only the hash is kept; the certificate itself never stays on disk
  return "sha256:" + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function SignPanel({ relative, onDone }: { relative: Relative; onDone: () => void }) {
  const { update } = useVault();
  const [mods, setMods] = useState<Modality[]>(["text", "voice"]);
  const [typed, setTyped] = useState("");
  const [adult, setAdult] = useState(false);
  const toggle = (m: Modality) => setMods((x) => (x.includes(m) ? x.filter((y) => y !== m) : [...x, m]));
  const sign = (decision: "grant" | "refuse") => {
    update((v) => {
      v.consent.consents.push({
        relativeId: relative.id,
        decision,
        modalities: decision === "grant" ? mods : [],
        signedAt: new Date().toISOString(),
      });
    });
    onDone();
  };
  return (
    <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.bg, borderRadius: 8 }}>
      <Note>请 {relative.name} 本人阅读并操作。同意后可随时撤回，撤回会立即删除所有生成的模型和资料。</Note>
      <Text style={{ marginTop: 8 }}>允许使用：</Text>
      <View style={{ flexDirection: "row", gap: 8, marginVertical: 6, flexWrap: "wrap" }}>
        {ALL_MODALITIES.map((m) => <Chip key={m} label={MOD_LABEL[m]} on={mods.includes(m)} onPress={() => toggle(m)} />)}
      </View>
      <Field label={`输入你的全名"${relative.name}"作为签名`} value={typed} onChangeText={setTyped} />
      <Chip label="我已年满 18 周岁" on={adult} onPress={() => setAdult((a) => !a)} />
      <Button label="我同意" disabled={typed.trim() !== relative.name || !mods.includes("text") || !adult} onPress={() => sign("grant")} />
      <Button label="我不同意" kind="plain" disabled={typed.trim() !== relative.name} onPress={() => sign("refuse")} />
    </View>
  );
}

export function ConsentScreen() {
  const { vault, update } = useVault();
  const c = vault.consent;
  const status = evaluateConsent(c);
  const decisive = new Set(decisiveRelatives(c).map((r) => r.id));
  const [name, setName] = useState("");
  const [rel, setRel] = useState<Relationship>("child");
  const [signing, setSigning] = useState<string>();

  const latest = (id: string) =>
    [...c.consents].filter((k) => k.relativeId === id).sort((a, b) => b.signedAt.localeCompare(a.signedAt))[0];

  const revoke = (id: string) =>
    update((v) => {
      const k = [...v.consent.consents].filter((x) => x.relativeId === id).sort((a, b) => b.signedAt.localeCompare(a.signedAt))[0];
      if (k) k.revokedAt = new Date().toISOString();
      const s = evaluateConsent(v.consent);
      if (s.state === "revoked") wipe(v, s.mustDelete);
    });

  return (
    <View>
      <Section title="当前状态">
        <Text style={{ fontSize: 16, color: status.state === "active" ? "green" : colors.ink }}>
          {{ active: "✅ 已获全部授权", pending: "⏳ 等待中", blocked: "⛔ 不能创建", revoked: "🗑 已撤回并删除" }[status.state]}
        </Text>
        {"reasons" in status && status.reasons.map((r) => <Note key={r}>· {r}</Note>)}
        {status.state === "active" && <Note>允许：{status.modalities.map((m) => MOD_LABEL[m]).join("、")}</Note>}
      </Section>

      <Section title="逝者">
        <Field label="姓名" value={c.deceasedName} onChangeText={(t) => update((v) => { v.consent.deceasedName = t; })} />
        <Button
          kind="plain"
          label={c.deathEvidenceHash ? "✓ 已记录死亡证明（仅保存指纹）" : "上传死亡证明 / 火化证明"}
          onPress={async () => {
            const h = await sha256OfPickedFile();
            if (h) update((v) => { v.consent.deathEvidenceHash = h; });
          }}
        />
        <Note>如果{c.deceasedName || "逝者"}生前留下过"可以/不可以被数字化"的意愿，以本人意愿为准（本人拒绝时任何人都无法开启）。</Note>
      </Section>

      <Section title="近亲属（每一位都需要本人签署）">
        {c.relatives.map((r) => {
          const k = latest(r.id);
          return (
            <View key={r.id} style={{ paddingVertical: 8, borderBottomWidth: 0.5, borderColor: "#ddd" }}>
              <Text style={{ fontSize: 16 }}>
                {r.name}（{REL_LABEL[r.relationship]}）{decisive.has(r.id) ? "" : " · 非必需"}
              </Text>
              <Note>
                {r.verified ? "身份已核验" : "身份未核验"} ·{" "}
                {!k ? "未签署" : k.revokedAt ? "已撤回" : k.decision === "grant" ? `同意：${k.modalities.map((m) => MOD_LABEL[m]).join("、")}` : "不同意"}
              </Note>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {!r.verified && (
                  <Button kind="plain" label="已当面核对身份证件" onPress={() => update((v) => {
                    const x = v.consent.relatives.find((y) => y.id === r.id);
                    if (x) x.verified = true;
                  })} />
                )}
                {(!k || k.revokedAt) && <Button kind="plain" label="签署" onPress={() => setSigning(r.id)} />}
                {k && !k.revokedAt && k.decision === "grant" && <Button kind="danger" label="撤回同意" onPress={() => revoke(r.id)} />}
              </View>
              {signing === r.id && <SignPanel relative={r} onDone={() => setSigning(undefined)} />}
            </View>
          );
        })}
        <Field label="添加亲属姓名" value={name} onChangeText={setName} />
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {(Object.keys(REL_LABEL) as Relationship[]).map((k) => <Chip key={k} label={REL_LABEL[k]} on={rel === k} onPress={() => setRel(k)} />)}
        </View>
        <Button
          label="添加"
          disabled={!name.trim()}
          onPress={() => {
            update((v) => { v.consent.relatives.push({ id: Crypto.randomUUID(), name: name.trim(), relationship: rel, verified: false }); });
            setName("");
          }}
        />
        <Button
          kind={c.kinListAttested ? "plain" : "primary"}
          label={c.kinListAttested ? "✓ 已声明名单完整" : "我声明：以上包含了所有在世的配偶、子女、父母"}
          onPress={() => update((v) => { v.consent.kinListAttested = !v.consent.kinListAttested; })}
        />
        <Note>按《民法典》第994条的顺序：有配偶、子女、父母时须他们全部同意；都不在世时由兄弟姐妹、祖父母、孙子女全部同意。任何一人反对即不能创建。</Note>
      </Section>
    </View>
  );
}
