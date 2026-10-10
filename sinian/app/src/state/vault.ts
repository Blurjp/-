import { Directory, File, Paths } from "expo-file-system";
import {
  deletionPlan,
  type AssetRecord,
  type ConsentCase,
  type MemoryItem,
  type Modality,
  type PersonaProfile,
  type UsageLog,
} from "@sinian/core";

/**
 * Everything about one deceased person lives in one directory on the phone.
 * iOS stores app documents with Data Protection and Android with file-based
 * encryption; see docs/ARCHITECTURE.md for the planned SQLCipher upgrade.
 */
export const VAULT_DIR = new Directory(Paths.document, "vault");
const VAULT_FILE = new File(VAULT_DIR, "vault.json");

export interface Vault {
  consent: ConsentCase;
  persona?: PersonaProfile;
  memories: MemoryItem[];
  assets: AssetRecord[];
  usage: UsageLog;
  /** Relative currently holding the phone. */
  activeRelativeId?: string;
  /** Transcript of the voice reference clip. */
  voiceRefText?: string;
  region: string;
  maxMinutesPerDay: number;
}

export function emptyVault(): Vault {
  return {
    consent: { deceasedName: "", kinListAttested: false, relatives: [], consents: [] },
    memories: [],
    assets: [],
    usage: { minutesByDay: {} },
    region: "CN",
    maxMinutesPerDay: 30,
  };
}

export async function loadVault(): Promise<Vault> {
  if (!VAULT_FILE.exists) return emptyVault();
  return { ...emptyVault(), ...(JSON.parse(await VAULT_FILE.text()) as Vault) };
}

export function saveVault(v: Vault): void {
  if (!VAULT_DIR.exists) VAULT_DIR.create({ intermediates: true });
  VAULT_FILE.write(JSON.stringify(v));
}

/**
 * Copy a picked file into the vault. Call outside state updaters (they may run
 * lazily or twice), then register the returned record so revocation can find it.
 */
export function copyIntoVault(src: File, kind: AssetRecord["kind"]): AssetRecord {
  if (!VAULT_DIR.exists) VAULT_DIR.create({ intermediates: true });
  const dest = new File(VAULT_DIR, `${kind}-${Date.now()}-${src.name}`);
  src.copy(dest);
  return { id: dest.name, kind, location: dest.uri, remote: false };
}

/** Replace any existing asset of the same kind (one voice clip, one photo). */
export function replaceAsset(v: Vault, rec: AssetRecord): void {
  for (const old of v.assets.filter((a) => a.kind === rec.kind && !a.remote)) {
    const f = new File(old.location);
    if (f.exists) f.delete();
  }
  v.assets = [...v.assets.filter((a) => a.kind !== rec.kind), rec];
}

/**
 * Destroy everything derived from the withdrawn modalities. Remote assets
 * (only present if the optional server step was used) are returned so the
 * caller can issue deletion requests; local files are removed here.
 */
export function wipe(v: Vault, withdrawn: Modality[]): { remote: AssetRecord[] } {
  const plan = deletionPlan(v.assets, withdrawn);
  for (const a of plan) {
    if (!a.remote) {
      const f = new File(a.location);
      if (f.exists) f.delete();
    }
  }
  const gone = new Set(plan.map((a) => a.id));
  v.assets = v.assets.filter((a) => !gone.has(a.id));
  if (withdrawn.includes("text")) {
    v.memories = [];
    delete v.persona;
  }
  if (withdrawn.includes("voice")) delete v.voiceRefText;
  return { remote: plan.filter((a) => a.remote) };
}
