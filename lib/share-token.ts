// Share-token encoder. Prototype: base64url(JSON). Production would sign and
// expire; spec §3 (Group 1) calls for a temporary read-only URL or QR. The
// /share/[token] route reads the payload back on the client without a round
// trip — safe for demo, but the UI explicitly flags the prototype scope.
//
// We cap the payload at ~6KB so modern QR scanners read cleanly on a phone
// camera (QR level M at ~4KB is comfortable; 6KB fits version ~30).

import type { ProfileV1 } from '@/lib/profile-schema';

const MAX_PAYLOAD = 6000;

function toBase64Url(s: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(s, 'utf8').toString('base64url');
  }
  const b64 = btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 2 ? '==' : padded.length % 4 === 3 ? '=' : '';
  if (typeof window === 'undefined') {
    return Buffer.from(padded + pad, 'base64').toString('utf8');
  }
  return decodeURIComponent(escape(atob(padded + pad)));
}

export function encodeShareToken(profile: ProfileV1): { token: string; size: number; truncated: boolean } {
  // Trim to the employer-relevant surface — omit long free-text fields that
  // balloon the QR. The full JSON is still available via the download button.
  const trimmed: ProfileV1 = {
    ...profile,
    subject: {
      ...profile.subject,
      self_report: {
        work_text: profile.subject.self_report.work_text?.slice(0, 280),
        tools_text: profile.subject.self_report.tools_text?.slice(0, 280),
        aspirations_text: profile.subject.self_report.aspirations_text?.slice(0, 280),
      },
    },
  };
  const json = JSON.stringify(trimmed);
  const token = toBase64Url(json);
  return {
    token,
    size: token.length,
    truncated: token.length > MAX_PAYLOAD,
  };
}

export function decodeShareToken(token: string): ProfileV1 | null {
  try {
    const json = fromBase64Url(token);
    return JSON.parse(json) as ProfileV1;
  } catch {
    return null;
  }
}
