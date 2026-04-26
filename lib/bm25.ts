// Generic BM25 index. No dependencies.
// Standard OKAPI BM25 parameters — k1=1.5, b=0.75.

const K1 = 1.5;
const B = 0.75;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export interface BM25Doc {
  id: string;   // skill URI
  text: string; // label (+ description when available)
}

export interface BM25Hit {
  id: string;
  score: number;
}

export class BM25Index {
  private readonly docs: BM25Doc[];
  private readonly tokenized: string[][];
  private readonly idf: Map<string, number>;
  private readonly avgdl: number;

  constructor(docs: BM25Doc[]) {
    this.docs = docs;
    this.tokenized = docs.map((d) => tokenize(d.text));
    this.avgdl =
      this.tokenized.reduce((sum, t) => sum + t.length, 0) /
      Math.max(1, docs.length);
    this.idf = this.buildIdf();
  }

  private buildIdf(): Map<string, number> {
    const N = this.docs.length;
    const df = new Map<string, number>();
    for (const tokens of this.tokenized) {
      for (const t of new Set(tokens)) {
        df.set(t, (df.get(t) ?? 0) + 1);
      }
    }
    const idf = new Map<string, number>();
    for (const [term, freq] of df) {
      idf.set(term, Math.log((N - freq + 0.5) / (freq + 0.5) + 1));
    }
    return idf;
  }

  query(queryText: string, topK = 60): BM25Hit[] {
    const qTokens = tokenize(queryText);
    if (qTokens.length === 0) return [];

    const scored = this.tokenized.map((docTokens, i) => {
      const tf = new Map<string, number>();
      for (const t of docTokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      const dl = docTokens.length;

      let score = 0;
      for (const t of qTokens) {
        const idf = this.idf.get(t) ?? 0;
        if (idf === 0) continue;
        const f = tf.get(t) ?? 0;
        score += (idf * (f * (K1 + 1))) / (f + K1 * (1 - B + (B * dl) / this.avgdl));
      }
      return { id: this.docs[i].id, score };
    });

    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}
