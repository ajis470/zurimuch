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
    .join(' · ');

  const inner = (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium text-sm text-gray-900 leading-snug">
        {p.name}
      </span>
      {specs && (
        <span className="text-xs text-gray-400">{specs}</span>
      )}
      {actress.score !== undefined && (
        <span className="inline-block mt-1 text-xs font-medium text-rose-500">
          {(actress.score * 100).toFixed(0)}% 一致
        </span>
      )}
    </div>
  );

  const base =
    'p-3 rounded-2xl border text-left transition-all block w-full';
  const style = selected
    ? `${base} border-rose-400 bg-rose-50 shadow-sm`
    : `${base} border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm`;

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
  const [query, setQuery]                   = useState('');
  const [searchResults, setSearchResults]   = useState<Actress[]>([]);
  const [selected, setSelected]             = useState<Actress | null>(null);
  const [similar, setSimilar]               = useState<Actress[]>([]);
  const [weights, setWeights]               = useState<Weights>({ face: 50, height: 50, cup: 50, bmi: 50 });
  const [searching, setSearching]           = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

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
    setWeights({ ...next });
  };

  const handleSliderCommit = () => {
    if (selected) fetchSimilar(selected, pendingWeights.current);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            zuri<span className="text-rose-500">much</span>
          </h1>
          <p className="text-xs text-gray-400">好みの女優から、似た女優を探す</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* 検索バー */}
        <div className="flex gap-2 mb-6">
          <input
            className="flex-1 px-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
            placeholder="女優名を入力..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="px-5 py-3 bg-rose-500 hover:bg-rose-400 active:bg-rose-600 disabled:opacity-40 text-white rounded-2xl text-sm font-medium transition-colors"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? '…' : '検索'}
          </button>
        </div>

        {/* 検索結果 */}
        {searchResults.length > 0 && (
          <section className="mb-8">
            <p className="text-xs text-gray-400 mb-2 px-1">{searchResults.length}件ヒット</p>
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
          </section>
        )}

        {searchResults.length === 0 && query && !searching && (
          <p className="text-sm text-gray-400 text-center py-6">該当する女優が見つかりませんでした</p>
        )}

        {/* 類似検索エリア */}
        {selected && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-rose-500 rounded-full" />
              <h2 className="text-sm font-semibold text-gray-800">
                「{selected.payload.name}」に似た女優
              </h2>
            </div>

            {/* スライダーパネル */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
              <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
                重み調整
              </p>
              <div className="space-y-3">
                {(Object.keys(SLIDER_LABELS) as (keyof Weights)[]).map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-14 shrink-0">
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
                      className="flex-1 accent-rose-500 cursor-pointer"
                    />
                    <span className="text-xs text-gray-400 w-6 text-right tabular-nums">
                      {weights[key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 類似結果 */}
            {loadingSimilar ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
                <p className="text-xs text-gray-400">検索中...</p>
              </div>
            ) : similar.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {similar.map((a) => (
                  <ActressCard key={a.id} actress={a} href={a.payload.url} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                スペックデータが不足しているため類似検索できません
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
