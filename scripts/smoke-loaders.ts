/**
 * Smoke test — verifies every data loader returns a populated payload with
 * a visible `source` label. Run: `npm run smoke` (requires `tsx`).
 */
import { getEscoOccupations, getEscoSkills } from '@/lib/data-loaders/esco';
import { getOnetTasks } from '@/lib/data-loaders/onet';
import { getIsco } from '@/lib/data-loaders/isco';
import {
  getEmployment,
  getEarningsBySector,
  getEarningsByEducation,
  yoyGrowthPct,
} from '@/lib/data-loaders/ilostat';
import { getWdi } from '@/lib/data-loaders/wdi';
import { getWbes } from '@/lib/data-loaders/wbes';
import { getWittgenstein } from '@/lib/data-loaders/wittgenstein';
import { getFreyOsborne } from '@/lib/data-loaders/frey-osborne';
import { getJoinedOccupations } from '@/lib/data-loaders/joined';
import { calibrateRisk } from '@/lib/risk-calibration';
import { COUNTRIES } from '@/lib/config/countries';
import { tertiaryPremium } from '@/lib/returns-to-education';
import { matchSkills } from '@/lib/skill-match';
import { buildImplication, iscoToSectorCategory } from '@/lib/wittgenstein-implications';
import { mapSkills } from '@/lib/esco-mapper';

async function main() {
  const line = '─'.repeat(72);
  console.log(line);
  console.log('UNMAPPED loader smoke test');
  console.log(line);

  const esco = await getEscoOccupations();
  const skills = await getEscoSkills();
  console.log(`ESCO: ${esco.value.length} occupations, ${skills.value.length} skills`);
  console.log(`  source: ${esco.source}`);

  const isco = await getIsco();
  console.log(`ISCO-08: ${isco.value.length} unit groups`);
  console.log(`  source: ${isco.source}`);

  const onet = await getOnetTasks();
  console.log(`O*NET: ${onet.value.length} SOC entries`);
  console.log(`  source: ${onet.source}`);

  const joined = await getJoinedOccupations();
  console.log(`Joined occupations: ${joined.value.length}`);
  console.log(`  source: ${joined.source}`);

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
  console.log(`  rule used: ${impl?.rule}`);

  const fo = await getFreyOsborne();
  console.log(`Frey-Osborne entries: ${Object.keys(fo.value).length}`);
  const foRaw = fo.value['15-1254.00'];
  const risk = calibrateRisk(foRaw, COUNTRIES.GH);
  console.log(
    `Web dev risk in GH: long-term ${Math.round(risk.long_term_risk * 100)}% / ` +
      `near-term ${Math.round(risk.near_term_displacement_risk * 100)}% ` +
      `(infra ${risk.infrastructure_factor.toFixed(2)}, ` +
      `task ${risk.task_composition_factor.toFixed(2)})`,
  );

  const match = matchSkills(
    esco.value.find((o) => o.isco_code === '7421')!,
    ['S1.1.1', 'S1.1.2', 'S1.1.4', 'S1.1.5'], // Amara's profile: repairs phones, solders
    skills.value,
  );
  console.log(
    `Electronics mechanic match for Amara: ${match.matched} of ${match.total} ` +
      `(missing: ${match.missingLabels.join(', ')})`,
  );

  const mock = await mapSkills({
    workText: 'I fix phones and have built two small websites for friends',
    toolsText: 'soldering iron, Android, JavaScript',
    languages: ['en', 'tw'],
    education: 'shs',
  });
  console.log(line);
  console.log('Skills-map mock (Amara input):');
  console.log(`  status: ${mock.status}`);
  console.log(`  confidence: ${mock.confidence}`);
  console.log(`  esco_skills: [${mock.esco_skills.join(', ')}]`);
  console.log(`  isco_occupations: [${mock.isco_occupations.slice(0, 6).join(', ')}${mock.isco_occupations.length > 6 ? ', …' : ''}]`);

  const gibberish = await mapSkills({ workText: 'asdf qwer zxcv', toolsText: '' });
  console.log(line);
  console.log('Skills-map mock (gibberish input — should be flagged):');
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
