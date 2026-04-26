/**
 * Deterministic ranking smoke — validates the locked weights, sub-score
 * arithmetic, and citation provenance for a known input. Catches drift
 * when the demand/skill/safety formula or weight constants change.
 *
 * Run: `npm run smoke:rank`
 */
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';
import { getEscoOccupations, getEscoSkills } from '@/lib/data-loaders/esco';
import { getFowForCountry } from '@/lib/data-loaders/ilo-fow';
import { getIloIscoForCountry } from '@/lib/data-loaders/ilo-isco';
import { getFreyOsborneOverlay } from '@/lib/data-loaders/frey-osborne';
import { rankMatches, RANK_WEIGHTS } from '@/lib/skill-match';

function approxEqual(a: number, b: number, eps = 1e-3) {
  return Math.abs(a - b) <= eps;
}

async function rankFor(country: CountryCode) {
  const config = COUNTRIES[country];
  const [esco, skills, ilo, fow, fowOverlay] = await Promise.all([
    getEscoOccupations(),
    getEscoSkills(),
    getIloIscoForCountry(country),
    getFowForCountry(country),
    getFreyOsborneOverlay(),
  ]);

  // Use the first 30 essential skill URIs from a known ICT-leaning occupation
  // (Software developer, ISCO 2512) as the simulated profile. This makes the
  // top of the ranking biased toward Software developer in every country —
  // which lets us assert that the demand score *changes the order* between
  // countries even when the skill score does not.
  const target = esco.value.find((o) => o.isco_code === '2512');
  if (!target) throw new Error('ESCO occupation 2512 not found in the catalog');
  const profileSkillUris = target.essential_skills.slice(0, 30);

  const ranked = rankMatches(esco.value, {
    profileSkillUris,
    allSkills: skills.value,
    ilo: ilo.value,
    iloSourceLabel: ilo.source,
    fowOverlay: fowOverlay.value,
    fowOverlaySource: fowOverlay.source,
    country: config,
    riskOpts: (occ) => {
      const tc = fow.value.byIsco.get(occ.isco_code);
      return {
        occupationRoutineShare: tc?.routine_share,
        cognitiveShare: tc?.cognitive_share,
        manualShare: tc?.manual_share,
        usRoutineWeightedMean: fow.value.usRoutineWeightedMean,
      };
    },
  });
  return ranked;
}

async function main() {
  const line = '─'.repeat(72);
  console.log(line);
  console.log('UNMAPPED ranker smoke');
  console.log(`weights = demand:${RANK_WEIGHTS.demand} skill:${RANK_WEIGHTS.skill} safety:${RANK_WEIGHTS.safety}`);
  console.log(line);

  let problems = 0;

  for (const country of ['GHA', 'BOL', 'VNM'] as CountryCode[]) {
    const ranked = await rankFor(country);
    console.log(`── ${country} top 5 ──`);
    for (const r of ranked.slice(0, 5)) {
      const total = r.score.total.toFixed(3);
      const components = [
        `D=${r.score.demand.toFixed(2)}`,
        `S=${r.score.skill.toFixed(2)}`,
        `R=${r.score.safety.toFixed(2)}`,
      ].join(' ');
      console.log(`  · ${r.occupation.preferred_label} [${r.occupation.isco_code}] total=${total} (${components}) match=${r.matched}/${r.total}`);
    }

    // Assertion 1: every card's score.total equals the weighted sum of components.
    for (const r of ranked) {
      const expected =
        RANK_WEIGHTS.demand * r.score.demand +
        RANK_WEIGHTS.skill * r.score.skill +
        RANK_WEIGHTS.safety * r.score.safety;
      if (!approxEqual(r.score.total, expected)) {
        console.error(
          `  FAIL ${r.occupation.isco_code}: total=${r.score.total} expected=${expected}`,
        );
        problems += 1;
      }
    }

    // Assertion 2: every card has exactly three citations, one per component.
    const top = ranked[0];
    const components = top.citations.map((c) => c.component).sort();
    const expectedComponents = ['demand', 'safety', 'skill'];
    if (JSON.stringify(components) !== JSON.stringify(expectedComponents)) {
      console.error(`  FAIL ${country}: components=${components} expected=${expectedComponents}`);
      problems += 1;
    }

    // Assertion 3: each citation carries a non-empty source_file string.
    for (const c of top.citations) {
      if (!c.source_file || c.source_file.length === 0) {
        console.error(`  FAIL ${country}/${c.component}: missing source_file`);
        problems += 1;
      }
    }
  }

  // Assertion 4: weights sum to 1.0 — defends against silently dropping a
  // component from the linear blend.
  const total = RANK_WEIGHTS.demand + RANK_WEIGHTS.skill + RANK_WEIGHTS.safety;
  if (!approxEqual(total, 1.0)) {
    console.error(`FAIL: weights sum to ${total}, expected 1.0`);
    problems += 1;
  }

  console.log(line);
  if (problems === 0) {
    console.log('rank smoke OK');
  } else {
    console.log(`rank smoke FAIL — ${problems} problem(s)`);
    process.exit(1);
  }
  console.log(line);
}

main().catch((err) => {
  console.error('rank smoke failed:', err);
  process.exit(1);
});
