import { NextResponse } from 'next/server';
import { sanitizeSearchQuery } from '@/lib/security';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawTerm = searchParams.get('term') || '';
  const type = searchParams.get('type') || 'song';

  const term = sanitizeSearchQuery(rawTerm);
  if (!term || term.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    let results: any[] = [];

    if (type === 'movie') {
      // 1. Películas: Cinemeta API abierta (catálogo oficial IMDb / Amazon Posters)
      const url = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(term)}.json`;
      const res = await fetch(url, { next: { revalidate: 3600 } });

      if (res.ok) {
        const data = await res.json();
        results = (data.metas || []).slice(0, 8).map((item: any) => ({
          id: item.id || String(Math.random()),
          title: item.name || 'Sin título',
          subtitle: item.releaseInfo ? `${item.releaseInfo} · Película` : 'Película',
          type: 'movie',
          imageUrl: item.poster || undefined,
        }));
      }
    } else if (type === 'artist') {
      // 2. Artistas: Deezer API oficial (Fotografías reales de estudio del artista)
      const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(term)}&limit=8`;
      const res = await fetch(url, { next: { revalidate: 3600 } });

      if (res.ok) {
        const data = await res.json();
        results = (data.data || []).map((item: any) => ({
          id: String(item.id),
          title: item.name,
          subtitle: 'Artista',
          type: 'artist',
          imageUrl: item.picture_big || item.picture_medium || undefined,
        }));
      }
    } else {
      // 3. Canciones: Deezer API oficial (Carátulas oficiales de sencillos y álbumes)
      const url = `https://api.deezer.com/search?q=${encodeURIComponent(term)}&limit=8`;
      const res = await fetch(url, { next: { revalidate: 3600 } });

      if (res.ok) {
        const data = await res.json();
        results = (data.data || []).map((item: any) => ({
          id: String(item.id),
          title: item.title,
          subtitle: item.artist?.name || 'Artista',
          type: 'song',
          imageUrl: item.album?.cover_big || item.album?.cover_medium || item.artist?.picture_big || undefined,
        }));
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('API /api/media-search error:', error);
    return NextResponse.json({ results: [] });
  }
}
