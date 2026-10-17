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
      // 1. Películas: Búsqueda prioritaria en México, fallback a internacional
      let url = `https://itunes.apple.com/search?term=${encodeURIComponent(
        term
      )}&media=movie&entity=movie&limit=10&country=MX`;

      let res = await fetch(url, { next: { revalidate: 3600 } });
      let data = res.ok ? await res.json() : { results: [] };

      if (!data.results || data.results.length === 0) {
        url = `https://itunes.apple.com/search?term=${encodeURIComponent(
          term
        )}&media=movie&entity=movie&limit=10&country=US`;
        res = await fetch(url, { next: { revalidate: 3600 } });
        if (res.ok) data = await res.json();
      }

      results = (data.results || []).map((item: any) => {
        const year = item.releaseDate ? item.releaseDate.substring(0, 4) : '';
        const poster = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb', '600x600bb')
          : undefined;

        return {
          id: String(item.trackId || Math.random()),
          title: item.trackName || 'Sin título',
          subtitle: year ? `${year} · Película` : 'Película',
          type: 'movie',
          imageUrl: poster,
        };
      });
    } else if (type === 'artist') {
      // 2. Artistas: Buscar álbumes del artista para obtener el arte/fotografía oficial nítida
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
        term
      )}&media=music&entity=album&limit=15&country=MX`;

      const res = await fetch(url, { next: { revalidate: 3600 } });
      const data = res.ok ? await res.json() : { results: [] };

      const seen = new Set<string>();
      for (const item of data.results || []) {
        const artistName = (item.artistName || '').trim();
        const lower = artistName.toLowerCase();
        if (!artistName || seen.has(lower)) continue;
        seen.add(lower);

        const img = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb', '600x600bb')
          : undefined;

        results.push({
          id: String(item.artistId || item.collectionId || Math.random()),
          title: artistName,
          subtitle: item.primaryGenreName || 'Música',
          type: 'artist',
          imageUrl: img,
        });

        if (results.length >= 8) break;
      }
    } else {
      // 3. Canciones
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
        term
      )}&media=music&entity=song&limit=10&country=MX`;

      const res = await fetch(url, { next: { revalidate: 3600 } });
      const data = res.ok ? await res.json() : { results: [] };

      results = (data.results || []).map((item: any) => {
        const cover = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb', '600x600bb')
          : undefined;

        return {
          id: String(item.trackId || item.collectionId || Math.random()),
          title: item.trackName || 'Sin título',
          subtitle: item.artistName || 'Artista desconocido',
          type: 'song',
          imageUrl: cover,
        };
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('API /api/media-search error:', error);
    return NextResponse.json({ results: [] });
  }
}
