'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const CUP = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

const toHttps = (url: string | null) =>
  url ? url.replace(/^http:\/\//, 'https://') : null;

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

function ActressCard({ actress }: { actress: Actress }) {
  const p = actress.payload;
  const specs = [
    p.height ? `${p.height}cm` : null,
    p.cup    ? `${CUP[p.cup]}カップ` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={`/actress/${p.actress_id}`}
      className="p-3 rounded-2xl border border-gray-200 bg-white hover:border-rose-300 hover:shadow-sm transition-all block"
    >
      <div className="flex items-start gap-2.5">
        <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          {p.image_url ? (
            <img
              src={toHttps(p.image_url)!}
              alt={p.name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gray-300" aria-hidden>
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex flex-col gap-0.5">
          <span className="font-medium text-sm text-gray-900 leading-snug truncate">{p.name}</span>
          {specs && <span className="text-xs text-gray-400">{specs}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [query, setQuery]               = useState('');
  const [searchResults, setSearchResults] = useState<Actress[]>([]);
  const [randomActresses, setRandomActresses] = useState<Actress[]>([]);
  const [searching, setSearching]       = useState(false);
  const [loadingRandom, setLoadingRandom] = useState(false);

  const fetchRandom = useCallback(() => {
    setLoadingRandom(true);
    fetch(`/api/random?t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => { setRandomActresses(d.results ?? []); setLoadingRandom(false); });
  }, []);

  useEffect(() => { fetchRandom(); }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    setSearchResults(data.results ?? []);
    setSearching(false);
  }, [query]);

  const displayList = searchResults.length > 0 ? searchResults : randomActresses;
  const isSearchMode = searchResults.length > 0;

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

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* サイト説明 */}
        <p className="text-base text-gray-600 mb-3">直感操作と重視ポイント（顔・身長・カップ・肉付き）でAV女優をAIがマッチング</p>

        {/* 検索バー */}
        <div className="flex gap-2 mb-6">
          <input
            className="flex-1 px-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
            placeholder="女優名で絞り込む..."
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

        {/* 女優一覧 */}
        {displayList.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-rose-500 rounded-full" />
              <h2 className="text-sm font-semibold text-gray-800">
                {isSearchMode ? `${searchResults.length}件ヒット` : '直感的に顔から選ぶ'}
              </h2>
              {isSearchMode ? (
                <button
                  onClick={() => { setSearchResults([]); setQuery(''); }}
                  className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← 戻る
                </button>
              ) : (
                <button
                  onClick={fetchRandom}
                  disabled={loadingRandom}
                  className="ml-auto text-xs text-rose-500 hover:text-rose-400 disabled:opacity-40 border border-rose-300 rounded-full px-3 py-1 transition-colors"
                >
                  {loadingRandom ? '読み込み中...' : '↻ 表示女優を更新'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {displayList.map((a) => (
                <ActressCard key={a.id} actress={a} />
              ))}
            </div>
          </section>
        )}

        {searchResults.length === 0 && query && !searching && (
          <p className="text-sm text-gray-400 text-center py-6">該当する女優が見つかりませんでした</p>
        )}
      </div>
    </div>
  );
}
