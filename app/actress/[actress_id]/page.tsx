import { notFound } from 'next/navigation';
import Link from 'next/link';
import SimilarSection from './SimilarSection';

const QDRANT_URL = 'http://133.18.180.166:6333';
const CUP = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

const toHttps = (url: string | null) =>
  url ? url.replace(/^http:\/\//, 'https://') : null;

export const revalidate = 86400; // 24時間ISR

// ---- 型 ----------------------------------------------------------------

type TopTitle = {
  title: string;
  url: string;
  year: string;
};

type ActressPayload = {
  name: string;
  actress_id: string;
  height: number | null;
  cup: number | null;
  est_bmi: number | null;
  url: string;
  image_url: string | null;
  top_titles?: TopTitle[];
};

type QdrantPoint = {
  id: string;
  vector: number[];
  payload: ActressPayload;
};

type ScoredPoint = {
  id: string;
  score: number;
  payload: ActressPayload;
};

// ---- Qdrant ヘルパー ---------------------------------------------------

async function fetchActressByDmmId(actress_id: string): Promise<QdrantPoint | null> {
  const res = await fetch(`${QDRANT_URL}/collections/faces/points/scroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filter: { must: [{ key: 'actress_id', match: { value: actress_id } }] },
      limit: 1,
      with_payload: true,
      with_vector: true,
    }),
    next: { revalidate: 86400 },
  });
  const data = await res.json();
  return data.result?.points?.[0] ?? null;
}

async function fetchSimilar(pointId: string, actressId: string, vector: number[]): Promise<ScoredPoint[]> {
  const res = await fetch(`${QDRANT_URL}/collections/faces/points/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vector,
      filter: {
        must: [
          { key: 'height',  range: { gte: 1 } },
          { key: 'cup',     range: { gte: 1 } },
          { key: 'est_bmi', range: { gte: 1 } },
        ],
        must_not: [
          { has_id: [pointId] },
          { key: 'actress_id', match: { value: actressId } },
          { key: 'should_exclude', match: { value: true } },
        ],
      },
      limit: 20,
      with_payload: true,
      with_vector: false,
    }),
    next: { revalidate: 86400 },
  });
  const data = await res.json();

  // actress_idで重複排除
  const seen = new Set<string>();
  const results: ScoredPoint[] = (data.result ?? []).filter((p: ScoredPoint) => {
    const id = p.payload.actress_id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  // トップ結果を100%に正規化
  const maxScore = results[0]?.score ?? 1;
  return results.map(p => ({ ...p, score: p.score / maxScore }));
}

// ---- Metadata ----------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ actress_id: string }>;
}) {
  const { actress_id } = await params;
  const point = await fetchActressByDmmId(actress_id);
  if (!point) return { title: 'zurimuch' };

  const p = point.payload;
  const specs = [
    p.height ? `${p.height}cm` : null,
    p.cup    ? `${CUP[p.cup]}カップ` : null,
  ]
    .filter(Boolean)
    .join('・');

  return {
    title: { absolute: `${p.name}に似てるAV女優を直感スライダーでマッチング｜オカズマッチ` },
    description: `${p.name}が好きならこの子も好きなはず！直感操作で顔・身長・カップ・肉付き等の重要ポイントを貴方好みに配分してマッチ可能！今夜のオカズ探しに最適！`,
    alternates: {
      canonical: `https://zurimuch.com/actress/${actress_id}`,
    },
  };
}

// ---- Description generator --------------------------------------------

function generateActressDescription(p: ActressPayload, similar: ScoredPoint[]): string {
  const heightAdj = p.height !== null
    ? p.height < 150 ? '超小柄な'
    : p.height < 155 ? '小柄な'
    : p.height < 163 ? '標準的な'
    : p.height < 170 ? 'すらりとした'
    : '高身長の'
    : null;

  const heightLabel = p.height !== null
    ? p.height < 155 ? '低身長'
    : p.height < 163 ? '標準身長'
    : '高身長'
    : null;

  const bmiLabel = p.est_bmi !== null
    ? p.est_bmi < 18 ? 'スレンダー'
    : p.est_bmi < 20 ? 'スリム'
    : p.est_bmi < 22.5 ? 'スタイル抜群'
    : p.est_bmi < 25 ? 'グラマラス'
    : 'むちむち'
    : null;

  const cupStr = p.cup ? `${CUP[p.cup]}カップ` : null;

  const s1Parts: string[] = [];
  if (heightAdj && p.height) s1Parts.push(`${p.height}cmの${heightAdj}体型`);
  if (cupStr) s1Parts.push(`${cupStr}という魅力`);

  let s1: string;
  if (s1Parts.length === 2) {
    s1 = `${p.name}は${s1Parts[0]}に${s1Parts[1]}を持つ女優です。`;
  } else if (s1Parts.length === 1) {
    s1 = `${p.name}は${s1Parts[0]}を持つ女優です。`;
  } else {
    s1 = `${p.name}の類似女優をAIがマッチングします。`;
  }

  const topNames = similar.slice(0, 2).map(s => s.payload.name);
  let s2 = '';
  if (topNames.length >= 2) {
    const tagParts = [heightLabel, bmiLabel].filter(Boolean);
    const tagStr = tagParts.length > 0 ? `「${tagParts.join('×')}」` : '';
    const sameStr = tagStr ? `同じ${tagStr}系の特徴を持つ` : '';
    s2 = `オカズマッチでは${sameStr}${topNames[0]}や${topNames[1]}とのマッチング率が高くなっています。`;
  }

  return s1 + s2;
}

// ---- Page --------------------------------------------------------------

export default async function ActressPage({
  params,
}: {
  params: Promise<{ actress_id: string }>;
}) {
  const { actress_id } = await params;
  const point = await fetchActressByDmmId(actress_id);
  if (!point) notFound();

  const p = point.payload;
  const initialSimilar = await fetchSimilar(point.id, p.actress_id, point.vector);
  const description = generateActressDescription(p, initialSimilar);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    description,
    url: `https://zurimuch.com/actress/${p.actress_id}`,
    ...(p.height && {
      height: { '@type': 'QuantitativeValue', value: p.height, unitCode: 'CMT' },
    }),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            オカズ<span className="text-rose-500">マッチ</span>
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 女優情報カード */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            {/* 顔写真 */}
            <div className="shrink-0 w-16 h-16 rounded-full overflow-hidden bg-gray-100">
              {p.image_url ? (
                <img
                  src={toHttps(p.image_url)!}
                  alt={p.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{p.name}</h1>
              <h2 className="text-xs text-gray-400 mt-0.5">{p.name}に似てるAV女優をスライダーでマッチング</h2>
              {/* スペックバッジ */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {p.height && <SpecBadge label="身長" value={`${p.height}cm`} />}
                {p.cup     ? <SpecBadge label="カップ" value={`${CUP[p.cup]}カップ`} /> : null}
                {p.est_bmi && <SpecBadge label="想定BMI" value={p.est_bmi.toFixed(1)} />}
              </div>
            </div>
          </div>

          {/* 説明文 */}
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            {description}
          </p>

          {/* DMMリンク */}
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-sm font-medium rounded-xl transition-colors"
          >
            DMMで作品を見る
            <span className="text-xs opacity-75">↗</span>
          </a>

          {/* 代表作 */}
          {p.top_titles && p.top_titles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 mb-2">代表作</p>
              <ul className="space-y-1.5">
                {p.top_titles.map((work, i) => (
                  <li key={i}>
                    <a
                      href={work.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-1 min-w-0"
                    >
                      <span className="truncate">{work.title}{work.year ? `（${work.year}）` : ''}</span>
                      <span className="shrink-0 opacity-60">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 類似女優セクション（クライアントコンポーネント） */}
        <SimilarSection pointId={point.id} initialSimilar={initialSimilar} />
      </div>
      <footer className="text-center py-6">
        <p className="text-xs text-gray-300">
          Powered by <a href="https://affiliate.dmm.com/api/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400 transition-colors">FANZA Webサービス</a>
          　｜
          <Link href="/privacy" className="underline hover:text-gray-400 transition-colors">プライバシーポリシー</Link>
        </p>
      </footer>
    </div>
  );
}

function SpecBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-medium text-gray-700">{value}</span>
    </div>
  );
}
