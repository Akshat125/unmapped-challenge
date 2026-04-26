/**
 * Smoke test the API route handlers in isolation. Does NOT require Next's
 * dev server — imports each handler directly and feeds it a synthetic
 * Request. Covers:
 *   POST /api/skills-map  — §7.1.2 failure shape
 *   POST /api/match       — Amara's top matches + GH → BD country switch
 *   GET  /api/skills-catalog — ESCO/ISCO catalog exposed to the client
 */
import { POST as mapPOST } from '@/app/api/skills-map/route';
import { POST as matchPOST } from '@/app/api/match/route';
import { GET as catalogGET } from '@/app/api/skills-catalog/route';
import { GET as aggregateGET } from '@/app/api/policymaker/aggregate/route';
import { POST as validateConfigPOST } from '@/app/api/policymaker/validate-config/route';
import { POST as mapJdPOST } from '@/app/api/map-job-description/route';

async function post(handler: (req: Request) => Promise<Response>, url: string, body: unknown) {
  const req = new Request(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
  const res = await handler(req);
  return { status: res.status, body: await res.json() };
}

async function main() {
  console.log('── /api/skills-map happy path (Amara) ──');
  const amara = await post(mapPOST, 'http://local/api/skills-map', {
    workText: 'I fix phones and built two small websites for friends',
    toolsText: 'soldering iron, Android, JavaScript',
    languages: ['en', 'tw'],
    education: 'shs',
  });
  console.log(`  status=${amara.status} confidence=${amara.body.confidence}`);
  console.log(`  esco_skills=[${amara.body.esco_skills.join(', ')}]`);
  const amaraSkills: string[] = amara.body.esco_skills;

  console.log('── /api/skills-map gibberish (flagged) ──');
  const gib = await post(mapPOST, 'http://local/api/skills-map', {
    workText: 'asdf qwer zxcv',
    toolsText: '',
  });
  console.log(`  status=${gib.status} map.status=${gib.body.status}`);

  console.log('── /api/skills-map malformed body (400) ──');
  const badReq = new Request('http://local/api/skills-map', {
    method: 'POST',
    body: 'not json',
    headers: { 'content-type': 'application/json' },
  });
  const badRes = await mapPOST(badReq);
  console.log(`  status=${badRes.status}`);

  console.log('── /api/skills-catalog GET ──');
  const catRes = await catalogGET();
  const cat = await catRes.json();
  console.log(`  status=${catRes.status} skills=${cat.skills.length} occupations=${cat.occupations.length}`);

  for (const country of ['GHA', 'BOL', 'VNM']) {
    console.log(`── /api/match ${country} with Amara skills ──`);
    const res = await post(matchPOST, 'http://local/api/match', {
      country,
      profileSkillUris: amaraSkills,
    });
    console.log(`  status=${res.status} cards=${res.body.cards.length}`);
    console.log(`  weights=${JSON.stringify(res.body.weights)}`);
    for (const card of res.body.cards.slice(0, 3)) {
      const wage = card.signals.wage
        ? `${card.signals.wage.mean_monthly} ${card.signals.wage.currency}`
        : '—';
      const growth = card.signals.growth.yoy_pct != null ? `${card.signals.growth.yoy_pct}%` : '—';
      const premium = card.signals.premium ? `+${card.signals.premium.premium_pct}%` : '—';
      const long = Math.round(card.risk.breakdown.long_term_risk * 100);
      const near = Math.round(card.risk.breakdown.near_term_displacement_risk * 100);
      const score = card.score
        ? `score=${card.score.total.toFixed(2)} (D=${card.score.components.demand.toFixed(2)} S=${card.score.components.skill.toFixed(2)} R=${card.score.components.safety.toFixed(2)})`
        : 'score=?';
      const refs = card.references?.length ?? 0;
      console.log(
        `  · ${card.preferred_label} [${card.isco_code}] ` +
          `match=${card.match.matched}/${card.match.total} ` +
          `wage=${wage} growth=${growth} premium=${premium} ` +
          `risk=${long}%/${near}% ` +
          `${score} refs=${refs}`,
      );
    }
  }

  console.log('── /api/match empty profile (3 cards, zero-match fallback) ──');
  const empty = await post(matchPOST, 'http://local/api/match', {
    country: 'GHA',
    profileSkillUris: [],
  });
  console.log(`  status=${empty.status} cards=${empty.body.cards.length}`);

  console.log('── /api/policymaker/aggregate?country=GHA ──');
  const aggRes = await aggregateGET(
    new Request('http://local/api/policymaker/aggregate?country=GHA'),
  );
  const agg = await aggRes.json();
  const topRisk = [...agg.occupation_risks].sort(
    (a, b) => b.near_term_risk - a.near_term_risk,
  )[0];
  console.log(
    `  status=${aggRes.status} sectors=${agg.sectors.length} occupations=${agg.occupation_risks.length} top_risk=${topRisk.preferred_label}@${Math.round(topRisk.near_term_risk * 100)}% complexity=${topRisk.skill_complexity_score.toFixed(2)}`,
  );
  console.log(
    `  wdi.gdp=${agg.wdi?.gdp_per_capita_usd.value} wbes.vacancies=${agg.wbes?.unfilled_vacancies_pct}%`,
  );
  const kpi = agg.kpis;
  console.log(
    `  KPI divergence=${kpi.skill_divergence.index.toFixed(2)} hotspot=${kpi.automation_hotspots[0]?.sector}@${kpi.automation_hotspots[0]?.routine_density.toFixed(2)} top_roi=${kpi.roi_on_training[0]?.sector}@+${kpi.roi_on_training[0]?.roi_per_skill_point.toFixed(0)}%/pt`,
  );

  console.log('── /api/policymaker/validate-config (valid GHA config) ──');
  const valid = await post(validateConfigPOST, 'http://local/api/policymaker/validate-config', {
    code: 'GHA',
    name: 'Ghana',
    locale: 'en',
    currencyLabel: 'GHS',
    opportunityEmphasis: 'self_employment_gig',
    broadbandPenetration: 68,
    routineTaskShare: 0.48,
    educationLevels: [
      { id: 'shs', label: 'SHS' },
      { id: 'tertiary', label: 'Tertiary' },
    ],
    languages: [{ code: 'en', label: 'English' }],
    trainingProviders: ['NVTI'],
  });
  console.log(`  status=${valid.status} ok=${valid.body.ok} issues=${valid.body.issues.length}`);

  console.log('── /api/map-job-description (employer JD) ──');
  const jd = await post(mapJdPOST, 'http://local/api/map-job-description', {
    text: 'Looking for a mobile phone repair technician to replace screens and batteries, diagnose faults, and manage spare parts inventory.',
  });
  console.log(
    `  status=${jd.status} top_isco=${jd.body.isco_top_occupation} skills=${jd.body.esco_skills.length} highlights=${jd.body.highlights.length}`,
  );
  for (const h of jd.body.highlights.slice(0, 4)) {
    console.log(`  · "${h.matched_text}" → ${h.skill_uri}`);
  }

  console.log('── /api/policymaker/validate-config (bad config — out-of-range) ──');
  const bad = await post(validateConfigPOST, 'http://local/api/policymaker/validate-config', {
    code: 'XX',
    name: 'Nowhere',
    locale: 'xx',
    currencyLabel: 'XXX',
    opportunityEmphasis: 'invalid_value',
    broadbandPenetration: 250,
    routineTaskShare: 99,
    educationLevels: [],
    languages: [],
  });
  console.log(`  status=${bad.status} ok=${bad.body.ok} issues=${bad.body.issues.length}`);
  for (const i of bad.body.issues.slice(0, 5)) {
    console.log(`  · ${i.severity} ${i.path}: ${i.message}`);
  }
}

main().catch((err) => {
  console.error('api smoke failed:', err);
  process.exit(1);
});
