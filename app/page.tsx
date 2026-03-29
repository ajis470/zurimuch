'use client';

import { useState, useCallback, useRef } from 'react';

const CUP = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

type Actress = {
  id: string;
  score?: number;
  payload: {
    name: string;
    actress_id: string;
    height: number | null;
    cup: number | null;
    est_bmi: number | null;
    url: string;
  };
};

type Weights = { face: number; height: number; cup: number; bmi: number };

const SLIDER_LABELS: Record<keyof Weights, string> = {
  face: '顔タイプ',
  height: '身長',
  cup: 'カップ',
  bmi: 'スタイル',
};

function ActressCard({
  actress,
  onClick,
  selected,
  href,
}: {
  actress: Actress;
  onClick?: () => void;
  selected?: boolean;
  href?: string;
}) {
  const p = actress.payload;
  const specs = [
    p.height ? `${p.height}cm` : null,
    p.cup ? `${CUP[p.cup]}カップ` : null,
  ]
    .filter(Boolean)
    .join(' / ');

  const inner = (
    <>
      <div className="font-medium text-sm leading-snug">{p.name}</div>
      {specs && <div className="text-xs text-gray-400 mt-0.5">{specs}</div>}
      {actress.score !== undefined && (
        <div className="text-xs text-pink-400 mt-0.5">
          {(actress.score * 100).toFixed(0)}%
        </div>
      )}
    </>
  );

  const base =
    'p-3 rounded-xl border text-left transition-colors block w-full';
  const style = selected
    ? `${base} border-pink-500 bg-pink-950/40`
    : `${base} border-gray-700 bg-gray-800 hover:border-gray-500`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={style}>
        {inner}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={style}>
      {inner}
    </button>
  );
}

export default function Home() {
  const [query, setQuery]             = useState('');
  const [searchResults, setSearchResults] = useState<Actress[]>([]);
  const [selected, setSelected]       = useState<Actress | null>(null);
  const [similar, setSimilar]         = useState<Actress[]>([]);
  const [weights, setWeights]         = useState<Weights>({ face: 50, height: 50, cup: 50, bmi: 50 });
  const [searching, setSearching]     = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // スライダーをドラッグ中の一時値（再検索はmouseup時のみ）
  const pendingWeights = useRef<Weights>(weights);

  const fetchSimilar = useCallback(async (actress: Actress, w: Weights) => {
    setLoadingSimilar(true);
    const params = new URLSearchParams({
      id:     actress.id,
      face:   String(w.face),
      height: String(w.height),
      cup:    String(w.cup),
      bmi:    String(w.bmi),
    });
    const res = await fetch(`/api/similar?${params}`);
    const data = await res.json();
    setSimilar(data.results ?? []);
    setLoadingSimilar(false);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSelected(null);
    setSimilar([]);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    setSearchResults(data.results ?? []);
    setSearching(false);
  }, [query]);

  const handleSelect = useCallback(
    (actress: Actress) => {
      setSelected(actress);
      fetchSimilar(actress, weights);
    },
    [weights, fetchSimilar]
  );

  const handleSliderChange = (key: keyof Weights, value: number) => {
    const next = { ...pendingWeights.current, [key]: value };
    pendingWeights.current = next;
    setWeights({ ...next }); // 見た目だけ即時更新
  };

  const handleSliderCommit = () => {
    if (selected) fetchSimilar(selected, pendingWeights.current);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* ヘッダー */}
        <h1 className="text-3xl font-bold text-center mb-2 tracking-tight">
          zurimuch
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          好みの女優を選んで、似た女優を探す
        </p>

        {/* 検索バー */}
        <div className="flex gap-2 mb-6">
          <input
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
            placeholder="女優名を入力..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? '...' : '検索'}
          </button>
        </div>

        {/* 検索結果 */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-gray-500 mb-2">{searchResults.length}件</p>
            <div className="grid grid-cols-2 gap-2">
              {searchResults.map((a) => (
                <ActressCard
                  key={a.id}
                  actress={a}
                  onClick={() => handleSelect(a)}
                  selected={selected?.id === a.id}
                />
              ))}
            </div>
          </div>
        )}

        {searchResults.length === 0 && query && !searching && (
          <p className="text-gray-500 text-sm text-center mb-8">該当なし</p>
        )}

        {/* 類似検索エリア */}
        {selected && (
          <div>
            <h2 className="text-base font-semibold mb-4">
              「{selected.payload.name}」に似た女優
            </h2>

            {/* スライダー */}
            <div className="bg-gray-800/60 rounded-xl p-4 mb-4 space-y-3">
              <p className="text-xs text-gray-400 mb-1">重み調整</p>
              {(Object.keys(SLIDER_LABELS) as (keyof Weights)[]).map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs w-16 text-gray-400 shrink-0">
                    {SLIDER_LABELS[key]}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={weights[key]}
                    onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                    onMouseUp={handleSliderCommit}
                    onTouchEnd={handleSliderCommit}
                    className="flex-1 accent-pink-500 cursor-pointer"
                  />
                  <span className="text-xs w-6 text-right text-gray-500">
                    {weights[key]}
                  </span>
                </div>
              ))}
            </div>

            {/* 類似結果 */}
            {loadingSimilar ? (
              <p className="text-gray-500 text-sm text-center py-8">検索中...</p>
            ) : similar.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {similar.map((a) => (
                  <ActressCard key={a.id} actress={a} href={a.payload.url} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">
                この女優のスペックデータが不足しているため類似検索できません
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
