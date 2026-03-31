import type { NextRequest } from 'next/server';

const QDRANT_URL = 'http://133.18.180.166:6333';

// スカラー類似度：差が range 以上なら 0、0なら 1
function scalarSim(a: number, b: number, range: number): number {
  return Math.max(0, 1 - Math.abs(a - b) / range);
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const pointId = sp.get('id');
  const wFace   = Number(sp.get('face')   ?? 50);
  const wHeight = Number(sp.get('height') ?? 50);
  const wCup    = Number(sp.get('cup')    ?? 50);
  const wBmi    = Number(sp.get('bmi')    ?? 50);

  if (!pointId) return Response.json({ results: [] });

  // 1. ターゲット女優のベクトル＋payloadを取得
  const pointRes = await fetch(
    `${QDRANT_URL}/collections/faces/points/${pointId}?with_vectors=true`
  );
  const pointData = await pointRes.json();
  const target = pointData.result;
  if (!target?.vector) return Response.json({ results: [] });

  const tp = target.payload as ActressPayload;

  // 2. ベクトル検索（スペックが揃っている女優のみ・候補を500件に拡大）
  const searchRes = await fetch(`${QDRANT_URL}/collections/faces/points/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vector: target.vector,
      filter: {
        must: [
          { key: 'height',  range: { gte: 1 } },
          { key: 'cup',     range: { gte: 1 } },
          { key: 'est_bmi', range: { gte: 1 } },
        ],
        must_not: [{ has_id: [pointId] }],
      },
      limit: 500,
      with_payload: true,
      with_vector: false,
    }),
  });

  const searchData = await searchRes.json();
  const candidates: QdrantScoredPoint[] = searchData.result ?? [];

  // 3. actress_idで重複排除
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    const id = c.payload.actress_id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  // 4. 重み付きスコアで再ランキング
  // nullの軸は分子・分母両方から除外（スコアを不当に下げない）
  const scored = unique.map((c) => {
    const cp = c.payload;

    let totalW = wFace;
    let totalScore = wFace * c.score;

    if (tp.height && cp.height) {
      totalW     += wHeight;
      totalScore += wHeight * scalarSim(tp.height, cp.height, 20);
    }
    if (tp.cup && cp.cup) {
      totalW     += wCup;
      totalScore += wCup * scalarSim(tp.cup, cp.cup, 3);
    }
    if (tp.est_bmi && cp.est_bmi) {
      totalW     += wBmi;
      totalScore += wBmi * scalarSim(tp.est_bmi, cp.est_bmi, 5);
    }

    const score = totalW > 0 ? totalScore / totalW : c.score;
    return { ...c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return Response.json({ results: scored.slice(0, 20) });
}

type ActressPayload = {
  name: string;
  actress_id: string;
  height: number | null;
  cup: number | null;
  est_bmi: number | null;
  url: string;
  image_url: string | null;
};

type QdrantScoredPoint = {
  id: string;
  score: number;
  payload: ActressPayload;
};
