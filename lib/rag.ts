import fs from 'fs';
import path from 'path';

type Chunk = {
  id: string;
  text: string;
  meta: { source: string; section?: string; startLine: number; endLine: number };
  embedding?: number[];
};

const ROOT = process.cwd();
const INFO_PATH = path.join(ROOT, 'docs', 'info.txt');
const INDEX_PATH = path.join(ROOT, 'data', 'info.index.json');

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function splitIntoChunks(text: string, opts?: { maxTokens?: number; overlap?: number }) {
  // Approximate tokens ~ 4 chars
  const maxTokens = opts?.maxTokens ?? 700;
  const overlap = opts?.overlap ?? 80;
  const approxChars = maxTokens * 4;
  const approxOverlap = overlap * 4;
  const lines = text.split(/\r?\n/);

  const chunks: { text: string; startLine: number; endLine: number }[] = [];
  let buf: string[] = [];
  let startLine = 1;
  let charCount = 0;

  const flush = (endLine: number) => {
    if (!buf.length) return;
    chunks.push({ text: buf.join('\n'), startLine, endLine });
    // overlap lines into next chunk
    const overlapText = buf.join('\n');
    const keepChars = Math.min(approxOverlap, overlapText.length);
    const keep = overlapText.slice(-keepChars).split(/\r?\n/);
    buf = keep;
    startLine = endLine - keep.length + 1;
    charCount = buf.join('\n').length;
  };

  lines.forEach((line, i) => {
    if (charCount + line.length + 1 > approxChars) {
      flush(i);
    }
    buf.push(line);
    charCount += line.length + 1;
    if (i === lines.length - 1) flush(i + 1);
  });

  return chunks;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback: simple TF vector using top terms for rough scoring
    return texts.map(t => {
      // Use a simpler regex for compatibility with older JS targets (no Unicode property escapes)
      // Includes latin letters/numbers, Hiragana/Katakana, and CJK Unified Ideographs
      const tokens = t
        .toLowerCase()
        .match(/[a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g) || [];
      const counts: Record<string, number> = {};
      tokens.forEach(tok => (counts[tok] = (counts[tok] || 0) + 1));
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 256)
        .map(([_, c]) => c);
      return top.concat(Array(Math.max(0, 256 - top.length)).fill(0));
    });
  }

  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
  });
  if (!resp.ok) throw new Error(`Embeddings API error ${resp.status}`);
  const json = await resp.json();
  return json.data.map((d: any) => d.embedding as number[]);
}

export async function buildInfoIndex() {
  const raw = fs.readFileSync(INFO_PATH, 'utf8');
  const chunksRaw = splitIntoChunks(raw, { maxTokens: 700, overlap: 100 });
  const texts = chunksRaw.map(c => c.text);
  const embeddings = await embedBatch(texts);
  const chunks: Chunk[] = chunksRaw.map((c, i) => ({
    id: `info_${i}`,
    text: c.text,
    meta: { source: 'docs/info.txt', startLine: c.startLine, endLine: c.endLine },
    embedding: embeddings[i],
  }));
  ensureDir(INDEX_PATH);
  fs.writeFileSync(INDEX_PATH, JSON.stringify({ model: 'text-embedding-3-small', chunks }, null, 2), 'utf8');
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

export async function retrieveInfo(query: string, k = 5) {
  if (!fs.existsSync(INDEX_PATH)) {
    await buildInfoIndex();
  }
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')) as { chunks: Chunk[] };
  const [qEmbed] = await embedBatch([query]);
  const scored = index.chunks.map(ch => ({ ch, score: ch.embedding ? cosine(qEmbed, ch.embedding) : 0 }));
  // MMR-lite: pick diverse top results
  scored.sort((a, b) => b.score - a.score);
  const picked: typeof scored = [];
  const penalty = 0.3;
  for (const cand of scored) {
    if (picked.length >= k) break;
    const diversity = picked.length
      ? Math.max(
          ...picked.map(p => (p.ch.embedding && cand.ch.embedding ? cosine(p.ch.embedding, cand.ch.embedding) : 0))
        )
      : 0;
    const mmr = cand.score - penalty * diversity;
    picked.push({ ...cand, score: mmr });
  }
  picked.sort((a, b) => b.score - a.score);
  return picked.map(p => ({ text: p.ch.text, meta: p.ch.meta, score: p.score }));
}

export function truncateTokens(text: string, maxTokens = 800) {
  const approx = maxTokens * 4;
  if (text.length <= approx) return text;
  return text.slice(0, approx);
}


