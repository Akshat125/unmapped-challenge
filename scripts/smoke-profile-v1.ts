/**
 * Smoke test: build a v1 profile, sign a verification, encode it to a share
 * token, decode, verify signatures, and exercise the validator. Exercises
 * the full portability loop between youth → navigator → employer.
 */
import {
  uuid,
  signVerification,
  validateProfileV1,
  PROFILE_SCHEMA_VERSION,
  JSONLD_CONTEXT,
  type ProfileV1,
} from '@/lib/profile-schema';
import { encodeShareToken, decodeShareToken } from '@/lib/share-token';
import { verifyProfileSignatures } from '@/lib/verify-signatures';
import { buildYouthProfileV1 } from '@/lib/profile-v1-builder';
import { getEscoSkills, getEscoOccupations } from '@/lib/data-loaders/esco';

async function main() {
  console.log('── build youth profile v1 ──');
  const skills = (await getEscoSkills()).value;
  const occupations = (await getEscoOccupations()).value;
  const youth = buildYouthProfileV1(
    {
      country: 'GHA',
      answers: {
        education: 'shs',
        workText: 'I fix phones and have built two small websites for friends',
        toolsText: 'soldering iron, Android, JavaScript',
        languages: ['en', 'tw'],
      },
      mapping: {
        status: 'ok',
        esco_skills: ['S1.1.4', 'S1.1.2', 'S1.2.1'],
        isco_occupations: ['7421', '2513'],
        confidence: 0.88,
        gaps_inferred: [],
        rejected_codes: [],
        explanations: [],
      },
    },
    { catalogSkills: skills, catalogOccupations: occupations, risks: [] },
  );
  console.log(
    `  schema=${youth.schema} signals=${youth.signals.length} id=${youth.core.id.slice(0, 8)}…`,
  );

  console.log('── sign two verifications + attach ──');
  const navId = uuid();
  const nowA = new Date().toISOString();
  const sigA = await signVerification({
    navigator_id: navId,
    skill_code: 'S1.1.4',
    method: 'observation',
    date: nowA,
    note: 'watched candidate disassemble + reassemble a Samsung A14',
  });
  const nowB = new Date().toISOString();
  const sigB = await signVerification({
    navigator_id: navId,
    skill_code: 'S1.2.1',
    method: 'test',
    date: nowB,
  });
  const enriched: ProfileV1 = {
    ...youth,
    verifications: [
      {
        navigator_id: navId,
        navigator_name: 'Kofi — GIZ Accra',
        skill_code: 'S1.1.4',
        method: 'observation',
        date: nowA,
        signature: sigA,
        note: 'watched candidate disassemble + reassemble a Samsung A14',
      },
      {
        navigator_id: navId,
        navigator_name: 'Kofi — GIZ Accra',
        skill_code: 'S1.2.1',
        method: 'test',
        date: nowB,
        signature: sigB,
      },
    ],
  };

  console.log('── validate ──');
  const validation = validateProfileV1(enriched);
  console.log(
    `  ok=${validation.ok} issues=${validation.issues.length} context=${enriched['@context'] === JSONLD_CONTEXT}`,
  );

  console.log('── encode → share token → decode ──');
  const { token, size, truncated } = encodeShareToken(enriched);
  console.log(`  token_size=${size} truncated=${truncated}`);
  const decoded = decodeShareToken(token);
  console.log(
    `  roundtrip_ok=${!!decoded && decoded.core.id === enriched.core.id} schema_match=${decoded?.schema === PROFILE_SCHEMA_VERSION}`,
  );

  console.log('── verify signatures (employer POV) ──');
  const sigCheck = await verifyProfileSignatures(decoded!);
  console.log(
    `  total=${sigCheck.total} passed=${sigCheck.passed} failed=${sigCheck.failed.length}`,
  );

  console.log('── tamper + re-verify ──');
  const tampered: ProfileV1 = {
    ...decoded!,
    verifications: decoded!.verifications.map((v, i) =>
      i === 0 ? { ...v, method: 'peer_vouch' } : v,
    ),
  };
  const tamperedCheck = await verifyProfileSignatures(tampered);
  console.log(
    `  total=${tamperedCheck.total} passed=${tamperedCheck.passed} failed=${tamperedCheck.failed.length} (expect 1 failure)`,
  );

  console.log('── invalid schema (v0-style) fails validator ──');
  const bad = validateProfileV1({ schema: 'unmapped.profile/v0', core: {} });
  console.log(`  ok=${bad.ok} errors=${bad.issues.filter((i) => i.severity === 'error').length}`);
}

main().catch((err) => {
  console.error('profile-v1 smoke failed:', err);
  process.exit(1);
});
