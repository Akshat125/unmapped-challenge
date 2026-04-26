'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// Local iPhone-style SMS simulator. POSTs each user message to
// /api/sms/incoming in the same form-encoded shape Africa's Talking uses,
// so the exact same webhook handles both real and simulated traffic.
//
// This page exists for two reasons:
// 1. The AT sandbox simulator is occasionally unavailable (503s).
// 2. Judges without an AT account can run the flow end-to-end.
//
// When AT_API_KEY is set, the webhook also attempts to push messages
// through AT itself. For this local simulator we skip that and display
// the replies inline, which is what the /api/sms/local route does.

type Bubble = { role: 'user' | 'sms'; text: string; at: number };

const DEMO_PHONE = '+233700000001';

export default function SmsDemoPage() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bubbles.length === 0) {
      // Auto-start: simulate the user texting "hi"
      void send('hi', { skipUserBubble: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [bubbles]);

  async function send(text: string, opts?: { skipUserBubble?: boolean }) {
    if (!text.trim()) return;
    setBusy(true);
    if (!opts?.skipUserBubble) {
      setBubbles((b) => [...b, { role: 'user', text, at: Date.now() }]);
    }
    try {
      const res = await fetch('/api/sms/local', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ from: DEMO_PHONE, text }),
      });
      const body = (await res.json()) as { replies: string[] };
      for (const reply of body.replies) {
        await delay(600);
        setBubbles((b) => [...b, { role: 'sms', text: reply, at: Date.now() }]);
      }
    } catch (e) {
      setBubbles((b) => [
        ...b,
        { role: 'sms', text: `(error: ${String(e)})`, at: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = input;
    setInput('');
    void send(t);
  }

  function restart() {
    setBubbles([]);
    void send('RESTART', { skipUserBubble: false });
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col px-4 py-8">
      <header className="mb-4 text-center">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          UNMAPPED — SMS channel
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-wb-navy">
          Text-only skill intake
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Same skill mapping and job match pipeline as the web app, over SMS.
          Simulator for users without reliable internet.{' '}
          <Link href="/" className="underline">
            Back to home
          </Link>
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl border-4 border-neutral-800 bg-neutral-900 shadow-xl">
        {/* Phone status bar */}
        <div className="flex items-center justify-between bg-neutral-900 px-4 py-2 text-[10px] text-white">
          <span>9:41</span>
          <span className="tracking-widest">UNMAPPED</span>
          <span>•••</span>
        </div>
        {/* Thread header */}
        <div className="border-b border-neutral-300 bg-neutral-100 px-4 py-3 text-center">
          <div className="text-xs text-neutral-500">To</div>
          <div className="text-sm font-semibold text-neutral-800">
            UNMAPPED +233 30 SANDBOX
          </div>
        </div>
        <div
          ref={scrollRef}
          className="h-[520px] space-y-2 overflow-y-auto bg-white px-3 py-4"
        >
          {bubbles.map((b, i) => (
            <Bubble key={i} bubble={b} />
          ))}
          {busy && <TypingIndicator />}
        </div>
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 border-t border-neutral-300 bg-neutral-100 p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a reply…"
            className="flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm focus:outline-none"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-full bg-wb-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-neutral-600">
        <button
          onClick={restart}
          className="rounded border border-neutral-300 bg-white px-3 py-1"
        >
          Restart thread
        </button>
        <span>
          Demo phone: <code>{DEMO_PHONE}</code>
        </span>
      </div>

      <footer className="mt-6 rounded border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
        <strong>How this is real:</strong> each message here POSTs to{' '}
        <code>/api/sms/local</code>, which runs the same state machine and
        skills-mapping pipeline as the production webhook at{' '}
        <code>/api/sms/incoming</code>. Swap the endpoint for Africa&apos;s
        Talking&apos;s shortcode to go live.
      </footer>
    </main>
  );
}

function Bubble({ bubble }: { bubble: Bubble }) {
  if (bubble.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-blue-500 px-3 py-2 text-sm text-white shadow">
          {bubble.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-neutral-200 px-3 py-2 text-sm text-neutral-900 shadow">
        {bubble.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-neutral-200 px-3 py-2">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" />
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
