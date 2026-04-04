export const dynamic = 'force-dynamic';

const QDRANT_URL = 'http://133.18.180.166:6333';

export async function GET() {
  // スペックあり女優を500件取得してからランダムで12件抽出
  const scrollRes = await fetch(`${QDRANT_URL}/collections/faces/points/scroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filter: {
        must: [
          { key: 'height',  range: { gte: 1 } },
          { key: 'cup',     range: { gte: 1 } },
          { key: 'est_bmi', range: { gte: 1 } },
        ],
      },
      limit: 500,
      with_payload: true,
      with_vector: false,
    }),
  });

  const scrollData = await scrollRes.json();
  const points: { id: string; payload: { actress_id: string } }[] = scrollData.result?.points ?? [];

  // actress_id重複排除
  const seen = new Set<string>();
  const unique = points.filter((p) => {
    if (seen.has(p.payload.actress_id)) return false;
    seen.add(p.payload.actress_id);
    return true;
  });

  // Fisher-Yatesシャッフルして先頭12件
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }

  return Response.json({ results: unique.slice(0, 12) });
}
