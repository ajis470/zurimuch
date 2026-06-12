'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

const CUP = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];

const toHttps = (url: string | null) =>
  url ? url.replace(/^http:\/\//, 'https://') : null;

type ScoredPoint = {
  id: string;
  score: number;
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

type Weights = { face: number; height: number; cup: number; bmi: number };

const SLIDER_LABELS: Record<keyof Weights, string> = {
  face: '顔タイプ',
  height: '身長',
  cup: 'カップ',
  bmi: '肉付き',
};

function FaceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SimilarCard({ actress }: { actress: ScoredPoint }) {
  const p = actress.payload;
  const specs = [
    p.height ? `${p.height}cm` : null,
    p.cup ? `${CUP[p.cup]}カップ` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-3 flex flex-col gap-2 hover:shadow-sm transition-shadow">
      {/* 顔アイコン（DMM）＋名前・スペック */}
      <div className="flex items-start gap-2.5">
        <Link
          href={`/actress/${p.actress_id}`}
          className="shrink-0 w-10 h-10 rounded-full bg-gray-100 hover:opacity-80 overflow-hidden flex items-center justify-center transition-opacity"
        >
          {p.image_url ? (
            <img
              src={toHttps(p.image_url)!}
              alt={p.name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span className="text-gray-400 hover:text-rose-500 transition-colors">
              <FaceIcon />
            </span>
          )}
        </Link>
        <div className="min-w-0">
          <div className="font-medium text-sm text-gray-900 leading-snug truncate">
            {p.name}
          </div>
          {specs && (
            <div className="text-xs text-gray-400 mt-0.5">{specs}</div>
          )}
          <div className="text-xs font-medium text-rose-400 mt-0.5">
            一致率：{(actress.score * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* DMMリンク */}
      <a
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-bold rounded-xl py-2 flex items-center justify-center gap-1 transition-colors"
      >
        この女優の作品を探す
        <span aria-hidden>→</span>
      </a>
    </div>
  );
}

export default function SimilarSection({
  pointId,
  initialSimilar,
}: {
  pointId: string;
  initialSimilar: ScoredPoint[];
}) {
  const [similar, setSimilar] = useState<ScoredPoint[]>(initialSimilar);
  const [weights, setWeights] = useState<Weights>({ face: 50, height: 50, cup: 50, bmi: 50 });
  const [loading, setLoading] = useState(false);
  const pendingWeights = useRef<Weights>(weights);

  const fetchSimilar = useCallback(async (w: Weights) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        id:     pointId,
        face:   String(w.face),
        height: String(w.height),
        cup:    String(w.cup),
        bmi:    String(w.bmi),
      });
      const res = await fetch(`/api/similar?${params}`);
      const data = await res.json();
      setSimilar(data.results ?? []);
    } catch {
      // 通信失敗時は直前の結果を維持
    } finally {
      setLoading(false);
    }
  }, [pointId]);

  const handleSliderChange = (key: keyof Weights, value: number) => {
    const next = { ...pendingWeights.current, [key]: value };
    pendingWeights.current = next;
    setWeights({ ...next });
  };

  const handleSliderCommit = () => {
    fetchSimilar(pendingWeights.current);
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-rose-500 rounded-full" />
        <h2 className="text-sm font-semibold text-gray-800">スライダーで自分の好みを調整</h2>
      </div>

      {/* スライダーパネル */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
        <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
          重み調整
        </p>
        <div className="space-y-3">
          <div className="flex items-center pl-[3.75rem] pr-[1.75rem] mb-2">
            <div className="relative flex-1 h-5 rounded-full bg-gradient-to-r from-rose-100 to-rose-500 flex items-center justify-between px-2">
              <span className="text-xs font-bold text-rose-400">← 軽視</span>
              <span className="text-xs font-bold text-white drop-shadow-sm">重視 →</span>
            </div>
          </div>
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
                onKeyUp={handleSliderCommit}
                className="flex-1 cursor-pointer"
                style={{ '--fill': `${weights[key]}%` } as React.CSSProperties}
              />
              <span className="text-xs text-gray-400 w-6 text-right tabular-nums">
                {weights[key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 類似結果 */}
      {loading ? (
        <div className="py-12 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-xs text-gray-400">検索中...</p>
        </div>
      ) : similar.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {similar.map((a) => (
            <SimilarCard key={a.id} actress={a} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-8">
          類似女優が見つかりませんでした
        </p>
      )}
    </section>
  );
}
