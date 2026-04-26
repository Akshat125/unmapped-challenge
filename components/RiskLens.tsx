'use client';

import { useState } from 'react';
import type { OpportunityCard } from '@/app/api/match/route';
import { useT } from '@/lib/i18n';
import { Card } from './ui/Card';
import { SourceLabel } from './ui/SourceLabel';

export function RiskLens({
  risk,
  countryCode,
}: {
  risk: OpportunityCard['risk'];
  countryCode: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const long = Math.round(risk.breakdown.long_term_risk * 100);
  const near = Math.round(risk.breakdown.near_term_displacement_risk * 100);
  const nearKey = countryCode === 'BD' ? 'opportunities.risk_near_term_bd' : 'opportunities.risk_near_term_gh';

  return (
    <Card className="mt-8">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-wb-ink/70">
          {t('opportunities.risk_heading')}
        </h3>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-wb-ink/60 underline focus:outline-none focus:ring-2 focus:ring-wb-blue rounded"
          aria-expanded={open}
        >
          {open ? '×' : 'ⓘ'}
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 divide-x divide-wb-line">
        <div>
          <div className="text-xs text-wb-ink/60">{t('opportunities.risk_long_term')}</div>
          <div className="text-2xl font-bold text-wb-ink">{long}%</div>
          <SourceLabel>{risk.source_long}</SourceLabel>
        </div>
        <div className="pl-3">
          <div className="text-xs text-wb-ink/60">{t(nearKey)}</div>
          <div className="text-2xl font-bold text-ys-amber">{near}%</div>
          <SourceLabel>{risk.source_near}</SourceLabel>
        </div>
      </div>
      {open && (
        <div className="mt-4 rounded bg-wb-sand p-3 text-sm">
          <p className="font-medium">{t('opportunities.risk_tooltip_heading')}</p>
          <pre className="mt-2 overflow-x-auto text-xs font-mono">
{t('opportunities.risk_tooltip_formula')}
          </pre>
          <ul className="mt-2 list-disc pl-5 text-xs">
            <li>
              frey_osborne_raw = {risk.breakdown.inputs.frey_osborne_raw.toFixed(2)}
            </li>
            <li>
              infrastructure_factor = 0.3 + 0.7 × (
              {risk.breakdown.inputs.mobile_broadband_penetration} / 100) ={' '}
              {risk.breakdown.infrastructure_factor.toFixed(2)}
            </li>
            <li>
              task_composition_factor ={' '}
              {risk.breakdown.inputs.ilo_routine_task_share} /{' '}
              {risk.breakdown.inputs.us_routine_task_share} ={' '}
              {risk.breakdown.task_composition_factor.toFixed(2)}{' '}
              <em className="text-wb-ink/60">
                (source:{' '}
                {risk.breakdown.inputs.routine_share_source ===
                'ilo_fow_per_occupation'
                  ? 'ILO Future of Work, per-occupation'
                  : 'country-level constant'}
                )
              </em>
            </li>
          </ul>
          <p className="mt-2 text-xs italic text-wb-ink/70">
            {t('opportunities.risk_tooltip_framing')}
          </p>
        </div>
      )}
    </Card>
  );
}
