import { ALL_MODALITIES, type Modality } from "./types";

/**
 * Consent model.
 *
 * Precedence, strongest first:
 *  1. The person's own wishes recorded while alive (advance directive). A refusal
 *     blocks everything, permanently; a grant defines the outer limit of what any
 *     relative can allow.
 *  2. First-tier next of kin (spouse, children, parents — 《民法典》第994条 order).
 *     Every declared first-tier relative must consent; one objection blocks.
 *  3. Only when there is no first-tier relative do second-tier relatives
 *     (siblings, grandparents, grandchildren) decide, with the same unanimity rule.
 *
 * Revocation by anyone whose consent was needed turns the persona off and
 * creates a deletion obligation for every derived model (voice, face, LoRA…).
 */

export type Relationship =
  | "spouse"
  | "child"
  | "parent"
  | "sibling"
  | "grandparent"
  | "grandchild"
  | "other";

const FIRST_TIER: ReadonlySet<Relationship> = new Set(["spouse", "child", "parent"]);
const SECOND_TIER: ReadonlySet<Relationship> = new Set(["sibling", "grandparent", "grandchild"]);

export interface Relative {
  id: string;
  name: string;
  relationship: Relationship;
  /** Identity checked against an ID document or by an existing verified member. */
  verified: boolean;
}

export type ConsentDecision = "grant" | "refuse";

export interface KinConsent {
  relativeId: string;
  decision: ConsentDecision;
  modalities: Modality[];
  /** ISO-8601. */
  signedAt: string;
  /** Set when the relative later withdraws. Withdrawal is final for that record. */
  revokedAt?: string;
}

export interface AdvanceDirective {
  decision: ConsentDecision;
  modalities: Modality[];
  /** Relative ids allowed to talk to the simulation. Empty = any consenting relative. */
  allowedUsers: string[];
  recordedAt: string;
  /** e.g. a signed in-app recording, notarised letter. Stored as a hash. */
  evidenceHash?: string;
}

export interface ConsentCase {
  deceasedName: string;
  /** Hash of the death certificate or equivalent; required before anything is built. */
  deathEvidenceHash?: string;
  /** The applicant attests this list contains every living relative of the decisive tier. */
  kinListAttested: boolean;
  relatives: Relative[];
  consents: KinConsent[];
  directive?: AdvanceDirective;
}

export type ConsentStatus =
  | { state: "active"; modalities: Modality[]; allowedUsers: string[] | "all-consenting" }
  | { state: "pending"; reasons: string[] }
  | { state: "blocked"; reasons: string[] }
  | { state: "revoked"; reasons: string[]; mustDelete: Modality[] };

function intersect(a: readonly Modality[], b: readonly Modality[]): Modality[] {
  return a.filter((m) => b.includes(m));
}

/** Relatives whose consent is required, per the tier rule above. */
export function decisiveRelatives(c: ConsentCase): Relative[] {
  const first = c.relatives.filter((r) => FIRST_TIER.has(r.relationship));
  if (first.length > 0) return first;
  return c.relatives.filter((r) => SECOND_TIER.has(r.relationship));
}

function latestConsent(c: ConsentCase, relativeId: string): KinConsent | undefined {
  let latest: KinConsent | undefined;
  for (const k of c.consents) {
    if (k.relativeId !== relativeId) continue;
    if (!latest || k.signedAt > latest.signedAt) latest = k;
  }
  return latest;
}

export function evaluateConsent(c: ConsentCase): ConsentStatus {
  if (c.directive?.decision === "refuse") {
    return { state: "blocked", reasons: [`${c.deceasedName} 生前明确拒绝被数字化模拟。`] };
  }

  const decisive = decisiveRelatives(c);
  const pending: string[] = [];

  // Revocation by a decisive relative is checked first: it overrides everything
  // else and must trigger deletion even if other paperwork is incomplete.
  const revokers = decisive.filter((r) => latestConsent(c, r.id)?.revokedAt);
  if (revokers.length > 0) {
    return {
      state: "revoked",
      reasons: revokers.map((r) => `${r.name} 已撤回同意。`),
      mustDelete: [...ALL_MODALITIES],
    };
  }

  const refusers = decisive.filter((r) => latestConsent(c, r.id)?.decision === "refuse");
  if (refusers.length > 0) {
    return { state: "blocked", reasons: refusers.map((r) => `${r.name} 不同意。`) };
  }

  if (!c.deathEvidenceHash) pending.push("尚未上传死亡证明。");
  if (!c.kinListAttested) pending.push("申请人尚未声明近亲属名单完整。");

  let modalities: Modality[] = c.directive ? [...c.directive.modalities] : [...ALL_MODALITIES];

  if (decisive.length === 0 && !c.directive) {
    pending.push("没有可作出决定的近亲属，也没有本人生前授权。");
  }

  for (const r of decisive) {
    if (!r.verified) pending.push(`${r.name} 的身份尚未核验。`);
    const k = latestConsent(c, r.id);
    if (!k) {
      pending.push(`等待 ${r.name} 签署同意书。`);
      continue;
    }
    modalities = intersect(modalities, k.modalities);
  }

  if (pending.length > 0) return { state: "pending", reasons: pending };
  if (modalities.length === 0 || !modalities.includes("text")) {
    return { state: "blocked", reasons: ["各方同意的范围没有交集（至少需要文字对话）。"] };
  }

  const allowedUsers =
    c.directive && c.directive.allowedUsers.length > 0 ? [...c.directive.allowedUsers] : "all-consenting";
  return { state: "active", modalities, allowedUsers };
}

/** Whether a given relative may open a chat, and with which modalities. */
export function accessFor(c: ConsentCase, relativeId: string): Modality[] {
  const s = evaluateConsent(c);
  if (s.state !== "active") return [];
  if (s.allowedUsers === "all-consenting") {
    const k = latestConsent(c, relativeId);
    // A non-decisive relative (e.g. a cousin) still needs their own grant on file.
    if (!k || k.decision !== "grant" || k.revokedAt) return [];
    return s.modalities;
  }
  return s.allowedUsers.includes(relativeId) ? s.modalities : [];
}
