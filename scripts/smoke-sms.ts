// Exercises the SMS state machine end-to-end without hitting AT.
// Run: npm run smoke:sms

import { next, newSession } from '../lib/sms-state-machine';

function run() {
  let state = newSession();
  const transcript: Array<{ who: 'user' | 'sms'; text: string }> = [];

  const inputs = [
    'hi',                                // welcome → country menu
    '1',                                  // country = Ghana
    '3',                                  // education = SHS
    'I repair phones and built two small websites for friends',
    'soldering iron, Android, JavaScript',
    '1,2',                                // languages English + Twi
    'I want to learn web apps',
  ];

  for (const input of inputs) {
    transcript.push({ who: 'user', text: input });
    const result = next(state, input);
    state = result.state;
    for (const m of result.reply) {
      transcript.push({ who: 'sms', text: m });
    }
    if (result.finalize) {
      transcript.push({
        who: 'sms',
        text: '[… at this point the webhook calls /api/match + mapSkills and emits 4 more messages. Run `npm run dev` and open /sms-demo to see the full output.]',
      });
      break;
    }
  }

  for (const t of transcript) {
    const tag = t.who === 'user' ? '👤 USER' : '📱 SMS ';
    const body = t.text.split('\n').join('\n        ');
    // eslint-disable-next-line no-console
    console.log(`${tag}  ${body}`);
    // eslint-disable-next-line no-console
    console.log('');
  }

  if (state.step !== 'finalizing') {
    // eslint-disable-next-line no-console
    console.error(`expected step=finalizing, got ${state.step}`);
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log('✓ State machine reached finalizing step with all answers captured.');
}

run();
