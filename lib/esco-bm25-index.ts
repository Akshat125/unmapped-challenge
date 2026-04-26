// Shared BM25 index over all ESCO skills — module-level singleton so it is
// built once per process and reused by both the youth mapper and JD mapper.
import { getEscoSkills } from '@/lib/data-loaders/esco';
import { BM25Index } from '@/lib/bm25';

let _promise: Promise<{ index: BM25Index; labelByUri: Map<string, string> }> | null = null;

export function getEscoIndex() {
  if (!_promise) {
    _promise = getEscoSkills()
      .then(({ value: skills }) => {
        const docs = skills.map((s) => ({
          id: s.uri,
          text: `${s.label} ${(s.alt_labels ?? []).join(' ')} ${s.description ?? ''}`.trim(),
        }));
        return {
          index: new BM25Index(docs),
          labelByUri: new Map(skills.map((s) => [s.uri, s.label])),
        };
      })
      .catch((err) => {
        _promise = null; // allow retry on next request
        throw err;
      });
  }
  return _promise;
}
