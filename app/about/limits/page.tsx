import Link from 'next/link';

export const metadata = {
  title: 'Honest limits · UNMAPPED',
  description: 'What UNMAPPED explicitly does not do, and where our data breaks.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-2 space-y-2 text-sm text-neutral-800">{children}</div>
    </section>
  );
}

export default function LimitsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-xs text-neutral-500 underline">
        ← UNMAPPED
      </Link>
      <h1 className="mt-1 text-3xl font-semibold">Honest limits</h1>
      <p className="mt-2 text-sm text-neutral-700">
        UNMAPPED is a bridge, not a replacement for systemic education reform
        or live job-matching. This page states what we deliberately do not do,
        where the data frays, and how to tell the difference.
      </p>

      <Section title="The Credential Gap — what a bridge actually is">
        <p>
          UNMAPPED helps a young person surface real skills into formal
          taxonomy so the labor market can see them. It does not replace
          school systems, rebuild vocational pipelines, or make up for
          under-investment in teachers. When someone leaves the app with a
          signed skill profile, they still live in the same labor market they
          walked in with.
        </p>
        <p>
          A confident claim for the pitch: UNMAPPED closes the
          <em> signaling </em>gap in under ten minutes. A dishonest claim: that
          it closes the <em>credentialing</em> gap. It does not.
        </p>
      </Section>

      <Section title="What the tool does not do">
        <ul className="list-disc space-y-1 pl-6">
          <li>
            It does <strong>not</strong> connect to live job vacancies.
            Opportunities are aggregate sector data from ILOSTAT, not the
            specific employers hiring this week.
          </li>
          <li>
            It does <strong>not</strong> provide career counseling. The
            resilience-gap suggestions are template-generated adjacencies, not
            a human coach.
          </li>
          <li>
            It does <strong>not</strong> issue formal credentials. A navigator
            signature proves "Kofi at GIZ Accra observed this on March 12," not
            "the government of Ghana accredits this skill."
          </li>
          <li>
            It does <strong>not</strong> hide or infer protected attributes.
            What Amara writes is what goes into the profile; what she skips
            stays blank.
          </li>
        </ul>
      </Section>

      <Section title="Where the data frays">
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Two countries are demo-grade: <strong>Ghana</strong> and{' '}
            <strong>Bangladesh</strong>. Vietnam, Kenya, Brazil ship as stub
            configs to prove the localization protocol.
          </li>
          <li>
            Seed data in <code>public/data/*.json</code> is
            realistic-order-of-magnitude. Every envelope carries a{' '}
            <code>source</code> string that flags it as seed until live
            fetchers land. Freshness varies — <strong>World Bank GLD
            baselines are pinned at 2025</strong>, ILOSTAT wage + employment
            subsets cover 2020–2024.
          </li>
          <li>
            The O*NET SOC-to-ISCO-08 crosswalk loses ~15% of occupations on a
            full fetch. The prototype's curated subset joins at 100%;
            production will see and log the ~15% drop in{' '}
            <code>public/data/crosswalk_misses.json</code>.
          </li>
        </ul>
      </Section>

      <Section title="Statistical honesty">
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Skill match</strong> is ESCO <code>essentialSkills</code>{' '}
            overlap (N of M). Not a semantic similarity model. A candidate
            missing a named skill really is missing it — no embedding hides
            that.
          </li>
          <li>
            <strong>Returns to education</strong> is a wage ratio across
            education levels within the same sector. Not a controlled
            regression. Confounded by self-selection and sector composition.
          </li>
          <li>
            <strong>LMIC risk calibration</strong> is a defensible heuristic,
            not a validated econometric model. The formula, inputs, and data
            source are surfaced in the tooltip on every opportunity card.
          </li>
          <li>
            <strong>Skill Divergence Index</strong> and <strong>ROI on
            Training</strong> are pure functions that operate on the same
            seed data. Treat the absolute numbers as illustrative; the
            ranking and sensitivity to input changes are the load-bearing
            claims.
          </li>
        </ul>
      </Section>

      <Section title="Prototype vs production">
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Navigator signatures</strong> are SHA-256 over a canonical
            string. Auditable and deterministic in the prototype. Production
            adds a real PKI (navigator's signing key, rotation, and a public
            verifier).
          </li>
          <li>
            <strong>Share links</strong> encode the full profile in a base64
            URL fragment. Production replaces this with a server-signed,
            short-lived token.
          </li>
          <li>
            <strong>Config persistence</strong> (white-label uploader) returns
            a real validation report but does not persist server-side.
            Production wires this to authenticated storage.
          </li>
          <li>
            <strong>API keys</strong> shown on the ecosystem page are
            localStorage tenants for demo realism. Production is an IAM
            integration with OAuth 2.0 and per-tenant rate limiting.
          </li>
        </ul>
      </Section>

      <Section title="Failure behaviour">
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Skills mapper returns a <em>flagged_low_confidence</em> result
            when the retry pass still rejects &gt;50% of codes. The UI shows
            a re-prompt; nothing auto-fills.
          </li>
          <li>
            Signature verification on a tampered profile marks the candidate
            red in the employer UI. A tampered signature is not silently
            accepted.
          </li>
          <li>
            When offline, the youth flow reads from localStorage. A red{' '}
            <em>Data is N days old</em> badge is surfaced when the cache is
            stale.
          </li>
        </ul>
      </Section>

      <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-500">
        Questions about a specific claim?{' '}
        <Link href="/integrate" className="underline">
          /integrate
        </Link>{' '}
        documents the API contract these limits refer to.
      </footer>
    </main>
  );
}
