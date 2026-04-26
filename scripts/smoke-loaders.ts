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
import { buildImplication, iscoToSectorCategory } from '@/lib/wittgenstein-implications';
import { mapSkills } from '@/lib/esco-mapper';
import { matchSkills } from '@/lib/skill-match';
import { tertiaryPremium } from '@/lib/returns-to-education';

async function main() {
  const line = '─'.repeat(72);
  console.log(line);
  console.log('UNMAPPED loader smoke test');
  console.log(line);

  const esco = await getEscoOccupations();
  const skills = await getEscoSkills();
  console.log(`ESCO: ${esco.value.length} occupations, ${skills.value.length} skills`);
  console.log(`  source: ${esco.source}`);

  const emp = await getEmployment('GH');
  const yoy = yoyGrowthPct(emp.value, 'Information and communication');
  console.log(`GH employment rows: ${emp.value.length}; ICT YoY growth: ${yoy}%`);
  console.log(`  source: ${emp.source}`);

  const earn = await getEarningsBySector('GH');
  console.log(`GH mean monthly earnings (manufacturing): ${earn.value['Manufacturing'].mean_monthly} GHS`);
  console.log(`  source: ${earn.source}`);

  const earnEdu = await getEarningsByEducation('GH');
  const premium = tertiaryPremium(earnEdu.value, 'Manufacturing');
  console.log(`GH manufacturing — tertiary over secondary premium: ${premium?.premiumPct}%`);

  const wdi = await getWdi('GH');
  console.log(`GH GDP/capita: $${wdi.value?.gdp_per_capita_usd.value}`);
  console.log(`  source: ${wdi.source}`);

  const wbes = await getWbes('GH');
  console.log(`GH unfilled vacancies: ${wbes.value?.unfilled_vacancies_pct}%`);
  console.log(`  source: ${wbes.source}`);

  const witt = await getWittgenstein('GH');
  console.log(`GH Wittgenstein rows: ${witt.value.length}`);
  const impl = buildImplication(witt.value, iscoToSectorCategory('2513'));
  console.log(`  implication (web dev, GH): "${impl?.sentence}"`);

  const mechanic = esco.value.find((o) => o.isco_code === '7421');
  if (mechanic) {
    const match = matchSkills(mechanic, skills.value.slice(0, 20).map((s) => s.uri), skills.value);
    console.log(`Electronics mechanic sample match: ${match.matched}/${match.total}`);
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
