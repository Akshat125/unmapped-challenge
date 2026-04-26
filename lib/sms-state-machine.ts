// Pure state machine for the SMS intake flow. No I/O. Given a session and an
// incoming text, returns the updated session plus the reply messages to send.
//
// This is provider-agnostic (Africa's Talking, Twilio, local simulator all
// hit the same machine). The only provider-specific code lives in
// app/api/sms/incoming/route.ts.

import { COUNTRIES, type CountryCode } from './config/countries';

export type SessionStep =
  | 'welcome'
  | 'country'
  | 'education'
  | 'work'
  | 'tools'
  | 'languages'
  | 'aspirations'
  | 'finalizing'
  | 'done';

export interface SessionAnswers {
  country?: CountryCode;
  education?: string;
  workText?: string;
  toolsText?: string;
  languages?: string[];
  aspirationsText?: string;
}

export interface SessionState {
  step: SessionStep;
  answers: SessionAnswers;
  startedAt: number;
  // After finalization we cache the last match result so replies like "1"
  // (for job details) can be served without re-running the pipeline.
  lastProfileUrl?: string;
}

export interface StepResult {
  state: SessionState;
  // Multi-message reply — AT and Twilio both require a separate REST call
  // per message, so we return an array rather than one string.
  reply: string[];
  // Signal to the webhook that it should now call the skill-map pipeline.
  // The webhook passes the resulting match data to `finalize()` below.
  finalize?: boolean;
}

export function newSession(): SessionState {
  return { step: 'welcome', answers: {}, startedAt: Date.now() };
}

// ──── Helpers ─────────────────────────────────────────────────────────────

function trimOrNull(s: string): string | undefined {
  const t = s.trim();
  return t.length > 0 ? t : undefined;
}

function isSkip(s: string): boolean {
  return /^skip$/i.test(s.trim());
}

function renderCountryMenu(): string {
  return (
    'Welcome to UNMAPPED — your skills passport.\n' +
    'Which country are you in?\n' +
    '1 = Ghana\n' +
    '2 = Bangladesh\n' +
    'Reply with 1 or 2.'
  );
}

function renderEducationMenu(country: CountryCode): string {
  const levels = COUNTRIES[country].educationLevels;
  const lines = levels.map((l, i) => `${i + 1} = ${l.label}`).join('\n');
  return (
    `Highest school level you finished?\n${lines}\n` +
    `Reply with a number (or "skip").`
  );
}

function renderLanguageMenu(country: CountryCode): string {
  const langs = COUNTRIES[country].languages;
  const lines = langs.map((l, i) => `${i + 1} = ${l.label}`).join('\n');
  return (
    `Languages you speak? (multi-select)\n${lines}\n` +
    `Reply with numbers separated by commas, e.g. "1,3". Or "skip".`
  );
}

function parseMenuChoice(body: string, options: number): number | null {
  const m = body.trim().match(/^(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= options ? n : null;
}

function parseMultiChoice(body: string, options: number): number[] | null {
  const parts = body.trim().split(/[,\s]+/);
  const nums: number[] = [];
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (!Number.isFinite(n) || n < 1 || n > options) return null;
    if (!nums.includes(n)) nums.push(n);
  }
  return nums.length > 0 ? nums : null;
}

// ──── Main transition ─────────────────────────────────────────────────────

export function next(state: SessionState, incoming: string): StepResult {
  const body = incoming.trim();

  // Global keywords take precedence at any step
  if (/^restart$/i.test(body)) {
    const fresh = newSession();
    return {
      state: { ...fresh, step: 'country' },
      reply: [renderCountryMenu()],
    };
  }
  if (/^help$/i.test(body)) {
    return {
      state,
      reply: [
        'UNMAPPED SMS help:\n' +
          'Reply RESTART to begin again.\n' +
          'Reply STOP to end.\n' +
          'Reply SKIP to pass a question.',
      ],
    };
  }
  if (/^stop$/i.test(body) || /^end$/i.test(body)) {
    return {
      state: { ...newSession(), step: 'done' },
      reply: ['You are unsubscribed. Reply START any time to begin again.'],
    };
  }

  switch (state.step) {
    case 'welcome':
    case 'done': {
      // First inbound or post-completion text: start the flow
      return {
        state: { ...state, step: 'country' },
        reply: [renderCountryMenu()],
      };
    }

    case 'country': {
      const choice = parseMenuChoice(body, 2);
      if (!choice) {
        return {
          state,
          reply: [
            'Please reply 1 for Ghana or 2 for Bangladesh.',
          ],
        };
      }
      const country: CountryCode = choice === 1 ? 'GH' : 'BD';
      return {
        state: {
          ...state,
          step: 'education',
          answers: { ...state.answers, country },
        },
        reply: [renderEducationMenu(country)],
      };
    }

    case 'education': {
      const country = state.answers.country!;
      const levels = COUNTRIES[country].educationLevels;
      let educationId: string | undefined;
      if (isSkip(body)) {
        educationId = undefined;
      } else {
        const choice = parseMenuChoice(body, levels.length);
        if (!choice) {
          return {
            state,
            reply: [
              `Reply with 1–${levels.length}, or "skip".`,
            ],
          };
        }
        educationId = levels[choice - 1].id;
      }
      return {
        state: {
          ...state,
          step: 'work',
          answers: { ...state.answers, education: educationId },
        },
        reply: [
          'What paid or unpaid work have you done? ' +
            'Write a short sentence (e.g. "I repair phones and built 2 small websites"). ' +
            'Or "skip".',
        ],
      };
    }

    case 'work': {
      const workText = isSkip(body) ? undefined : trimOrNull(body);
      return {
        state: {
          ...state,
          step: 'tools',
          answers: { ...state.answers, workText },
        },
        reply: [
          'Tools, machines or software you have used? ' +
            '(e.g. "soldering iron, Android, JavaScript"). ' +
            'Or "skip".',
        ],
      };
    }

    case 'tools': {
      const toolsText = isSkip(body) ? undefined : trimOrNull(body);
      const country = state.answers.country!;
      return {
        state: {
          ...state,
          step: 'languages',
          answers: { ...state.answers, toolsText },
        },
        reply: [renderLanguageMenu(country)],
      };
    }

    case 'languages': {
      const country = state.answers.country!;
      const langs = COUNTRIES[country].languages;
      let selected: string[] | undefined;
      if (isSkip(body)) {
        selected = undefined;
      } else {
        const choices = parseMultiChoice(body, langs.length);
        if (!choices) {
          return {
            state,
            reply: [
              `Reply with language numbers separated by commas (1–${langs.length}), or "skip".`,
            ],
          };
        }
        selected = choices.map((i) => langs[i - 1].code);
      }
      return {
        state: {
          ...state,
          step: 'aspirations',
          answers: { ...state.answers, languages: selected },
        },
        reply: [
          'Last one — what do you want to learn or do next? ' +
            '(e.g. "build web apps"). Or "skip".',
        ],
      };
    }

    case 'aspirations': {
      const aspirationsText = isSkip(body) ? undefined : trimOrNull(body);
      return {
        state: {
          ...state,
          step: 'finalizing',
          answers: { ...state.answers, aspirationsText },
        },
        reply: ['Reading your answers… hold on, mapping your skills now.'],
        finalize: true,
      };
    }

    case 'finalizing': {
      // Shouldn't happen in practice (webhook calls finalize() immediately),
      // but guard against the user sending another message mid-flight.
      return {
        state,
        reply: ['Still mapping your skills — one moment.'],
      };
    }

    default: {
      return {
        state: { ...newSession(), step: 'country' },
        reply: [renderCountryMenu()],
      };
    }
  }
}
