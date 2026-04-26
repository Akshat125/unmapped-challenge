/**
 * Targeted smoke test for:
 *   1. resilienceGaps — token-overlap adjacency (called in navigator page, not via API)
 *   2. mapJobDescription — BM25 JD mapper (POST /api/map-job-description)
 *
 * Run: npx tsx scripts/smoke-resilience-jd.ts
 */
import { mapSkills } from '@/lib/esco-mapper';
import { getEscoSkills, getEscoOccupations } from '@/lib/data-loaders/esco';
import { resilienceGaps } from '@/lib/resilience';
import { mapJobDescription } from '@/lib/jd-mapper';

const LINE = '─'.repeat(72);

async function testResilience() {
  console.log('\n' + LINE);
  console.log('resilience.ts — token-overlap coaching suggestions');
  console.log(LINE);

  const { value: allSkills } = await getEscoSkills();

  // Use the BM25 mapper to get real URIs for a phone-repair profile.
  const result = await mapSkills({
    workText: 'I repair smartphones and replace broken screens and batteries',
    toolsText: 'soldering iron, multimeter, screwdrivers',
  });

  console.log(`Profile skill URIs (${result.esco_skills.length}):`);
  const skillLabelByUri = new Map(allSkills.map((s) => [s.uri, s.label]));
  for (const uri of result.esco_skills.slice(0, 5)) {
    console.log(`  • ${skillLabelByUri.get(uri) ?? uri}`);
  }

  const suggestions = resilienceGaps(result.esco_skills, allSkills);

  console.log(`\nCoaching suggestions (${suggestions.length}):`);
  let pass = true;
  for (const s of suggestions) {
    const fromLabel = skillLabelByUri.get(s.from_skill_uri) ?? s.from_skill_uri;
    const toLabel = skillLabelByUri.get(s.suggestion_uri) ?? s.suggestion_uri;
    const knownUri = allSkills.some((sk) => sk.uri === s.suggestion_uri);
    if (!knownUri) {
      console.log(`  ✗ FAIL: suggestion_uri ${s.suggestion_uri} not in ESCO corpus`);
      pass = false;
    } else {
      console.log(`  ${fromLabel} → ${toLabel}`);
      console.log(`    reason: "${s.reason}"`);
    }
  }

  if (suggestions.length === 0) {
    console.log('  ✗ FAIL: no suggestions returned (expected > 0 for a real profile)');
    pass = false;
  }

  const urisAreValid = suggestions.every((s) => allSkills.some((sk) => sk.uri === s.suggestion_uri));
  console.log(`\n  URIs all valid: ${urisAreValid ? '✓' : '✗'}`);
  console.log(`  Suggestions returned: ${suggestions.length} (expect 1–6)`);

  return pass && suggestions.length > 0 && urisAreValid;
}

async function testJdMapper() {
  console.log('\n' + LINE);
  console.log('jd-mapper.ts — BM25 job description mapping');
  console.log(LINE);

  const cases = [
    {
      name: 'Phone repair + stock management',
      text: 'Looking for a mobile phone repair technician with experience replacing screens and managing spare parts inventory.',
      expectSkillCount: 5,
    },
    {
      name: 'Restaurant cook / food prep',
      text: 'We need an experienced cook to prepare meals, manage food hygiene standards, and operate kitchen equipment.',
      expectSkillCount: 5,
    },
    {
      name: 'Junior web developer',
      text: 'Seeking a web developer to build and maintain websites using HTML, CSS, JavaScript and React.',
      expectSkillCount: 5,
    },
    {
      name: 'Empty JD (edge case)',
      text: '',
      expectSkillCount: 0,
    },
  ];

  const { value: allSkills } = await getEscoSkills();
  const validUris = new Set(allSkills.map((s) => s.uri));

  let allPass = true;

  for (const tc of cases) {
    console.log(`\nCase: ${tc.name}`);
    const result = await mapJobDescription(tc.text);

    const urisValid = result.esco_skills.every((uri) => validUris.has(uri));
    const countOk = result.esco_skills.length >= tc.expectSkillCount;

    console.log(`  skills: ${result.esco_skills.length}  highlights: ${result.highlights.length}  top_isco: ${result.isco_top_occupation ?? '(none)'}`);
    console.log(`  confidence: ${result.confidence.toFixed(2)}`);
    console.log(`  URIs valid: ${urisValid ? '✓' : '✗'}`);
    console.log(`  skill count ≥ ${tc.expectSkillCount}: ${countOk ? '✓' : '✗'}`);

    for (const expl of result.explanations.slice(0, 4)) {
      console.log(`    • ${expl.evidence}`);
    }
    if (result.highlights.length > 0) {
      console.log(`    highlights: ${result.highlights.map(h => `"${h.matched_text}"`).slice(0, 3).join(', ')}`);
    }

    if (!urisValid || !countOk) allPass = false;
  }

  return allPass;
}

async function main() {
  console.log(LINE);
  console.log('UNMAPPED — resilience + jd-mapper targeted smoke test');
  console.log(LINE);

  const resOk = await testResilience();
  const jdOk = await testJdMapper();

  console.log('\n' + LINE);
  console.log(`resilience.ts: ${resOk ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`jd-mapper.ts:  ${jdOk ? '✓ PASS' : '✗ FAIL'}`);
  console.log(LINE);

  if (!resOk || !jdOk) process.exit(1);
}

main().catch((err) => {
  console.error('smoke failed:', err);
  process.exit(1);
});
