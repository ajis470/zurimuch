import type { MetadataRoute } from 'next';

const QDRANT_URL = 'http://133.18.180.166:6333';
const BASE_URL = 'https://zurimuch.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // スペックあり女優を全件取得
  let nextOffset: string | null = null;
  const seen = new Set<string>();

  do {
    const body: Record<string, unknown> = {
      filter: {
        must: [
          { key: 'height',  range: { gte: 1 } },
          { key: 'cup',     range: { gte: 1 } },
          { key: 'est_bmi', range: { gte: 1 } },
        ],
      },
      limit: 250,
      with_payload: true,
      with_vector: false,
    };
    if (nextOffset) body.offset = nextOffset;

    const res = await fetch(`${QDRANT_URL}/collections/faces/points/scroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      next: { revalidate: 86400 },
    });

    const data = await res.json();
    const points = data.result?.points ?? [];
    nextOffset = data.result?.next_page_offset ?? null;

    for (const p of points) {
      const actress_id = p.payload?.actress_id;
      if (!actress_id || seen.has(actress_id)) continue;
      seen.add(actress_id);
      urls.push({
        url: `${BASE_URL}/actress/${actress_id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  } while (nextOffset);

  return urls;
}
