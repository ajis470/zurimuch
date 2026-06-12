import Link from 'next/link';
import HomeClient from './HomeClient';

const QDRANT_URL = 'http://133.18.180.166:6333';

export const revalidate = 3600; // 1時間ごとに再生成（表示女優も入れ替わる）

type Actress = {
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

// スペックあり女優500件から12件をサーバー側で抽選（内部リンクをHTMLに含めるSEO対策）
async function fetchInitialActresses(): Promise<Actress[]> {
  try {
    const res = await fetch(`${QDRANT_URL}/collections/faces/points/scroll`, {
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
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const points: Actress[] = data.result?.points ?? [];

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
    return unique.slice(0, 12);
  } catch {
    // Qdrant障害時は空で返す（クライアント側の更新ボタンで復帰可能）
    return [];
  }
}

export default async function Home() {
  const initialActresses = await fetchInitialActresses();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="text-white">オ</span><span className="inline-block -rotate-12 text-rose-500">カ</span><span className="text-white">ズ</span><span className="text-rose-500">マ</span><span className="text-white">ッ</span><span className="text-rose-500">チ</span>
          </h1>
        </div>
      </header>

      <HomeClient initialActresses={initialActresses} />

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
