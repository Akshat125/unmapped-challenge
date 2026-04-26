// Recompute navigator-verification signatures to detect tampering. Runs
// entirely client-side; the employer doesn't trust the profile they received
// — they verify it against the deterministic SHA-256 recipe.
import { signVerification, type ProfileV1, type ProfileVerification } from '@/lib/profile-schema';

export interface SignatureCheckResult {
  total: number;
  passed: number;
  failed: Array<{ skill_code: string; reason: string }>;
}

export async function verifyProfileSignatures(profile: ProfileV1): Promise<SignatureCheckResult> {
  const failed: SignatureCheckResult['failed'] = [];
  let passed = 0;
  for (const v of profile.verifications) {
    const expected = await signVerification({
      navigator_id: v.navigator_id,
      skill_code: v.skill_code,
      method: v.method,
      date: v.date,
      note: v.note,
    });
    if (expected === v.signature) passed += 1;
    else failed.push({ skill_code: v.skill_code, reason: 'signature_mismatch' });
  }
  return { total: profile.verifications.length, passed, failed };
}

export function summarizeFailed(failed: SignatureCheckResult['failed']): string[] {
  return failed.map((f) => f.skill_code);
}
