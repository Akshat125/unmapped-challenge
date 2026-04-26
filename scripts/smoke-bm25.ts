/**
 * BM25 + Claude skill-mapping smoke test.
 * Run: npm run smoke:bm25
 *
 * Requires ANTHROPIC_API_KEY in the environment to exercise the Claude path.
 * Falls back to keyword-mock if the key is absent (still tests the pipeline).
 */
import { mapSkills } from '@/lib/esco-mapper';
import { getEscoSkills, getEscoOccupations } from '@/lib/data-loaders/esco';

const LINE = '─'.repeat(72);

interface Case {
  name: string;
  input: Parameters<typeof mapSkills>[0];
  expectOccupationLabels?: string[]; // occupation preferred_labels to look for
}

const CASES: Case[] = [
  {
    name: 'Phone repair technician (Amara)',
    input: {
      workText: 'I repair smartphones and replace broken screens and batteries',
      toolsText: 'soldering iron, multimeter, screwdrivers',
      languages: ['en', 'tw'],
    },
    expectOccupationLabels: ['electronics', 'repair', 'ICT'],
  },
  {
    name: 'Junior web developer',
    input: {
      workText: 'I build websites for small businesses in my town',
      toolsText: 'HTML, CSS, JavaScript, VS Code, git',
      aspirationsText: 'I want to become a full-stack developer',
      education: 'technical college diploma',
    },
    expectOccupationLabels: ['web developer', 'software'],
  },
  {
    name: 'Restaurant cook',
    input: {
      workText: 'I prepare food in a chop bar — cooking rice, stews and grilled meat',
      toolsText: 'kitchen knives, gas stove, hygiene checklist',
      languages: ['en'],
    },
    expectOccupationLabels: ['cook', 'food'],
  },
  {
    name: 'Smallholder farmer',
    input: {
      workText: 'I plant maize and cassava on my farm and sell at the market',
      toolsText: 'hoe, irrigation pipes, seeds',
      aspirationsText: 'want to learn better irrigation techniques',
    },
    expectOccupationLabels: ['farm', 'crop', 'agri'],
  },
  {
    name: 'Mixed profile — driver + shop assistant',
    input: {
      workText: 'I drive a trotro and also help at my uncle shop selling goods to customers',
      toolsText: 'cash register, phone for mobile money',
      languages: ['en', 'tw'],
    },
    expectOccupationLabels: ['driver', 'sales', 'shop'],
  },
];

async function main() {
  const usingClaude = !!process.env.ANTHROPIC_API_KEY;
  console.log(LINE);
  console.log(`UNMAPPED — BM25${usingClaude ? ' + Claude' : ' mock'} skill-mapping smoke test`);
  console.log(LINE);

  const { value: allOccupations } = await getEscoOccupations();
  const { value: allSkills } = await getEscoSkills();
  const skillLabelByUri = new Map(allSkills.map((s) => [s.uri, s.label]));
  const occByCode = new Map(allOccupations.map((o) => [o.isco_code, o]));

  let passed = 0;
  let failed = 0;

  for (const tc of CASES) {
    console.log(`\nCase: ${tc.name}`);
    const result = await mapSkills(tc.input);

    const ok = result.status !== 'upstream_error' && result.esco_skills.length > 0;
    console.log(`  status:     ${result.status}`);
    console.log(`  confidence: ${result.confidence.toFixed(2)}`);
    console.log(`  skills (${result.esco_skills.length}):`);
    for (const uri of result.esco_skills.slice(0, 8)) {
      const label = skillLabelByUri.get(uri) ?? uri;
      const expl = result.explanations.find((e) => e.skill_uri === uri);
      console.log(`    • ${label}  [${expl?.source_field ?? '?'}] "${expl?.evidence ?? ''}"`);
    }
    if (result.esco_skills.length > 8) {
      console.log(`    … +${result.esco_skills.length - 8} more`);
    }

    const matchedOccupations = result.isco_occupations
      .map((code) => occByCode.get(code)?.preferred_label ?? code)
      .slice(0, 5);
    console.log(`  occupations (${result.isco_occupations.length} total, top 5):`);
    for (const label of matchedOccupations) {
      console.log(`    • ${label}`);
    }

    if (tc.expectOccupationLabels) {
      const allLabels = result.isco_occupations
        .map((code) => (occByCode.get(code)?.preferred_label ?? '').toLowerCase())
        .join(' ');
      const hit = tc.expectOccupationLabels.some((kw) => allLabels.includes(kw.toLowerCase()));
      console.log(`  expect "${tc.expectOccupationLabels.join(' | ')}": ${hit ? '✓ found' : '✗ not found'}`);
      if (!hit) failed++;
      else passed++;
    }

    if (!ok) {
      console.log(`  ✗ FAIL: status=${result.status}, skills=${result.esco_skills.length}`);
      failed++;
    } else if (!tc.expectOccupationLabels) {
      passed++;
    }

    if (result.message) console.log(`  message: ${result.message}`);
  }

  console.log(`\n${LINE}`);
  console.log(`Results: ${passed} passed, ${failed} failed (${CASES.length} total)`);
  console.log(LINE);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('smoke:bm25 failed:', err);
  process.exit(1);
});
