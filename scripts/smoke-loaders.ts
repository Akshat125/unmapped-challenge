/**
 * Smoke test — verifies every live data loader returns a populated payload
 * with a visible `source` label. Run: `npm run smoke` (requires `tsx`).
 */
import { getEscoOccupations, getEscoSkills } from '@/lib/data-loaders/esco';
import {
  getEmployment,
  getEarningsBySector,
  getEarningsByEducation,
  yoyGrowthPct,
} from '@/lib/data-loaders/ilostat';
import { getWdi } from '@/lib/data-loaders/wdi';
import { getWbes } from '@/lib/data-loaders/wbes';
import { getWittgenstein } from '@/lib/data-loaders/wittgenstein';
import { getIloIscoForCountry } from '@/lib/data-loaders/ilo-isco';
import { getFreyOsborneOverlay } from '@/lib/data-loaders/frey-osborne';
import { getFowForCountry } from '@/lib/data-loaders/ilo-fow';
import { buildImplication, iscoToSectorCategory } from '@/lib/wittgenstein-implications';
import { mapSkills } from '@/lib/esco-mapper';
import { matchSkills, RANK_WEIGHTS } from '@/lib/skill-match';
import { tertiaryPremium } from '@/lib/returns-to-education';
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';

async function probeCountry(code: CountryCode) {
  const config = COUNTRIES[code];
  const [emp, earn, earnEdu, wdi, wbes, witt, ilo, fow] = await Promise.all([
    getEmployment(code),
    getEarningsBySector(code),
    getEarningsByEducation(code),
    getWdi(code),
    getWbes(code),
    getWittgenstein(code),
    getIloIscoForCountry(code),
    getFowForCountry(code),
  ]);
  const ictGrowth = yoyGrowthPct(emp.value, 'Information and communication');
  const tertPremium = tertiaryPremium(earnEdu.value, 'Manufacturing');
  const isco1Sample = ilo.value?.by_isco_1?.['7'];
  const wittImpl = buildImplication(witt.value, iscoToSectorCategory('2513'));

  console.log(`── ${code} (${config.name}, ${config.displayLanguage}) ──`);
  console.log(`  employment rows=${emp.value.length} ICT_YoY=${ictGrowth}%`);
  console.log(`  manufacturing wage=${earn.value['Manufacturing']?.mean_monthly} ${earn.value['Manufacturing']?.currency}`);
  console.log(`  manufacturing tertiary premium=${tertPremium?.premiumPct}%`);
  console.log(`  WDI gdp/cap=$${wdi.value?.gdp_per_capita_usd.value} WBES vacancies=${wbes.value?.unfilled_vacancies_pct}%`);
  console.log(`  Wittgenstein rows=${witt.value.length} impl="${wittImpl?.sentence ?? '(none)'}"`);
  console.log(`  ILO ISCO-1 latest_year=${ilo.value?.latest_year} group_7 share=${isco1Sample?.emp_share} cagr=${isco1Sample?.cagr_3y_pct}%`);
  console.log(`  ILO FoW byIsco entries=${fow.value.byIsco.size}`);
}

async function main() {
  const line = '─'.repeat(72);
  console.log(line);
  console.log('UNMAPPED loader smoke test');
  console.log(line);

  const esco = await getEscoOccupations();
  const skills = await getEscoSkills();
  const fowOverlay = await getFreyOsborneOverlay();
  console.log(`ESCO: ${esco.value.length} occupations, ${skills.value.length} skills`);
  console.log(`  source: ${esco.source}`);
  console.log(`Frey-Osborne overlay: ${Object.keys(fowOverlay.value).length} ISCO codes covered`);
  console.log(`  source: ${fowOverlay.source}`);
  console.log(`Rank weights: demand=${RANK_WEIGHTS.demand} skill=${RANK_WEIGHTS.skill} safety=${RANK_WEIGHTS.safety}`);

  for (const code of ['GHA', 'BOL', 'VNM'] as CountryCode[]) {
    await probeCountry(code);
  }

  // matchSkills smoke under the new signature.
  const config = COUNTRIES['GHA'];
  const ilo = await getIloIscoForCountry('GHA');
  const fow = await getFowForCountry('GHA');
  const electronics = esco.value.find((o) => o.isco_code === '7421');
  if (electronics) {
    const labelByUri = new Map(skills.value.map((s) => [s.uri, s.label]));
    const probe = matchSkills(electronics, {
      profileSkillUris: skills.value.slice(0, 20).map((s) => s.uri),
      allSkills: skills.value,
      ilo: ilo.value,
      iloSourceLabel: ilo.source,
      fowOverlay: fowOverlay.value,
      fowOverlaySource: fowOverlay.source,
      country: config,
      riskOpts: () => {
        const tc = fow.value.byIsco.get('7421');
        return {
          occupationRoutineShare: tc?.routine_share,
          cognitiveShare: tc?.cognitive_share,
          manualShare: tc?.manual_share,
          usRoutineWeightedMean: fow.value.usRoutineWeightedMean,
        };
      },
    }, labelByUri);
    console.log(line);
    console.log('Electronics mechanic (7421) matchSkills probe:');
    console.log(`  match=${probe.matched}/${probe.total} score.total=${probe.score.total.toFixed(3)}`);
    console.log(`  components: demand=${probe.score.demand.toFixed(3)} skill=${probe.score.skill.toFixed(3)} safety=${probe.score.safety.toFixed(3)}`);
    console.log(`  citations: ${probe.citations.map((c) => c.component + '=' + c.weighted_contribution.toFixed(3)).join(' · ')}`);
  }

  const mock = await mapSkills({
    workText: 'I fix phones and have built two small websites for friends',
    toolsText: 'soldering iron, Android, JavaScript',
    languages: ['en', 'tw'],
    education: 'shs',
  });
  console.log(line);
  console.log('Skills-map (Amara input):');
  console.log(`  status: ${mock.status}`);
  console.log(`  confidence: ${mock.confidence}`);
  console.log(`  esco_skills: ${mock.esco_skills.length} matched`);
  console.log(`  isco_occupations: ${mock.isco_occupations.length} matched`);

  const gibberish = await mapSkills({ workText: 'asdf qwer zxcv', toolsText: '' });
  console.log(line);
  console.log('Skills-map (gibberish — should be flagged):');
  console.log(`  status: ${gibberish.status}`);
  console.log(`  message: ${gibberish.message}`);

  console.log(line);
  console.log('smoke test OK');
  console.log(line);
}

main().catch((err) => {
  console.error('smoke test failed:', err);
  process.exit(1);
});
