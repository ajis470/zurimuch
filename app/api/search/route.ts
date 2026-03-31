import type { NextRequest } from 'next/server';

const QDRANT_URL = 'http://133.18.180.166:6333';

type QdrantPoint = {
  id: string;
  payload: {
    name: string;
    actress_id: string;
    height: number | null;
    cup: number | null;
    est_bmi: number | null;
    url: string;
    image_url: string | null;
  };
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  if (!q.trim()) return Response.json({ results: [] });

  // Qdrantのテキストインデックスは日本語の部分一致が不安定なため
  // 全件スキャン＋JS側でname.includes()による部分一致を使用
  const allPoints: QdrantPoint[] = [];
  let offset: string | undefined = undefined;

  while (true) {
    const body: Record<string, unknown> = {
      limit: 1000,
      with_payload: { include: ['name', 'actress_id', 'height', 'cup', 'est_bmi', 'url', 'image_url'] },
      with_vector: false,
    };
    if (offset) body.offset = offset;

    const res = await fetch(`${QDRANT_URL}/collections/faces/points/scroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const points: QdrantPoint[] = data.result?.points ?? [];
    const next: string | null = data.result?.next_page_offset ?? null;

    allPoints.push(...points);

    if (!next) break;
    offset = next;
  }

  // 部分一致フィルタ＋actress_idで重複排除
  const seen = new Set<string>();
  const results: QdrantPoint[] = [];

  for (const p of allPoints) {
    if (!p.payload.name.includes(q)) continue;
    const id = p.payload.actress_id;
    if (seen.has(id)) continue;
    seen.add(id);
    results.push(p);
    if (results.length >= 20) break;
  }

  return Response.json({ results });
}
