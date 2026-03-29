import type { NextRequest } from 'next/server';

const QDRANT_URL = 'http://133.18.180.166:6333';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  if (!q.trim()) return Response.json({ results: [] });

  const res = await fetch(`${QDRANT_URL}/collections/faces/points/scroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filter: {
        must: [{ key: 'name', match: { text: q } }],
      },
      limit: 50,
      with_payload: true,
      with_vector: false,
    }),
  });

  const data = await res.json();
  const points: QdrantPoint[] = data.result?.points ?? [];

  // actress_idで重複排除
  const seen = new Set<string>();
  const results = points.filter((p) => {
    const id = p.payload.actress_id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return Response.json({ results });
}

type QdrantPoint = {
  id: string;
  payload: {
    name: string;
    actress_id: string;
    height: number | null;
    cup: number | null;
    est_bmi: number | null;
    url: string;
  };
};
