import { MediaItem, MediaType } from '@/types/slambook.types';
import { sanitizeSearchQuery } from '@/lib/security';

class MediaSearchService {
  private cache = new Map<string, MediaItem[]>();

  async search(query: string, type: MediaType, signal?: AbortSignal): Promise<MediaItem[]> {
    const trimmed = sanitizeSearchQuery(query);
    if (!trimmed || trimmed.length < 2) {
      return [];
    }

    const cacheKey = `${type}:${trimmed.toLowerCase()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      let results: MediaItem[] = [];

      if (type === 'movie') {
        results = await this.searchMovies(trimmed, signal);
      } else if (type === 'artist') {
        results = await this.searchArtists(trimmed, signal);
      } else {
        results = await this.searchSongs(trimmed, signal);
      }

      if (results.length === 0) {
        results = this.getFallbackResults(trimmed, type);
      }

      this.cache.set(cacheKey, results);
      return results;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return [];
      }
      console.warn('MediaSearch error, using fallback:', err);
      return this.getFallbackResults(trimmed, type);
    }
  }

  private async searchSongs(query: string, signal?: AbortSignal): Promise<MediaItem[]> {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&media=music&entity=song&limit=10&country=MX`;

    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Songs fetch status ${res.status}`);
    const data = await res.json();

    return (data.results || []).map((item: any) => {
      const hdImage = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : undefined;

      return {
        id: String(item.trackId || item.collectionId || Math.random()),
        title: item.trackName || 'Sin título',
        subtitle: item.artistName || 'Artista desconocido',
        type: 'song' as MediaType,
        imageUrl: hdImage,
      };
    });
  }

  private async searchArtists(query: string, signal?: AbortSignal): Promise<MediaItem[]> {
    // Para artistas, buscar albums en iTunes permite obtener el arte/fotografía oficial del artista
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&media=music&entity=album&limit=15&country=MX`;

    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Artists fetch status ${res.status}`);
    const data = await res.json();

    const seenArtists = new Set<string>();
    const results: MediaItem[] = [];

    for (const item of data.results || []) {
      const artistName = (item.artistName || '').trim();
      const lower = artistName.toLowerCase();
      if (!artistName || seenArtists.has(lower)) continue;

      seenArtists.add(lower);
      const hdImage = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : undefined;

      results.push({
        id: String(item.artistId || item.collectionId || Math.random()),
        title: artistName,
        subtitle: item.primaryGenreName || 'Música',
        type: 'artist' as MediaType,
        imageUrl: hdImage,
      });

      if (results.length >= 8) break;
    }

    return results;
  }

  private async searchMovies(query: string, signal?: AbortSignal): Promise<MediaItem[]> {
    // Intento 1: Catálogo regional México
    let url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&media=movie&entity=movie&limit=10&country=MX`;

    let res = await fetch(url, { signal });
    let data = res.ok ? await res.json() : { results: [] };

    // Intento 2: Si no hay resultados, catálogo global US
    if (!data.results || data.results.length === 0) {
      url = `https://itunes.apple.com/search?term=${encodeURIComponent(
        query
      )}&media=movie&entity=movie&limit=10&country=US`;
      res = await fetch(url, { signal });
      if (res.ok) {
        data = await res.json();
      }
    }

    return (data.results || []).map((item: any) => {
      const year = item.releaseDate ? item.releaseDate.substring(0, 4) : '';
      const hdImage = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : undefined;

      return {
        id: String(item.trackId || Math.random()),
        title: item.trackName || 'Sin título',
        subtitle: year ? `${year} · Película` : 'Película',
        type: 'movie' as MediaType,
        imageUrl: hdImage,
      };
    });
  }

  private getFallbackResults(query: string, type: MediaType): MediaItem[] {
    const q = query.toLowerCase();
    const mockDb: Record<MediaType, Array<{ title: string; subtitle: string; imageUrl: string }>> = {
      song: [
        {
          title: 'Starboy',
          subtitle: 'The Weeknd ft. Daft Punk',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/19/27/bf19273c-cbe4-8f49-556b-67a845a7ad86/16UMGIM86064.rgb.jpg/600x600bb.jpg',
        },
        {
          title: 'De Música Ligera',
          subtitle: 'Soda Stereo',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/44/21/df/4421df65-e9f0-252c-c466-9c4c798031d6/886445582379.jpg/600x600bb.jpg',
        },
        {
          title: 'Bohemian Rhapsody',
          subtitle: 'Queen',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3d/8c/59/3d8c593d-d421-4fa3-5e92-6a7f1a30f3a6/00602547202773.rgb.jpg/600x600bb.jpg',
        },
        {
          title: 'Ojitos Lindos',
          subtitle: 'Bad Bunny & Bomba Estéreo',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3e/70/4e/3e704e90-c24c-9f6b-735a-8b8a68b57112/196626945068.jpg/600x600bb.jpg',
        },
        {
          title: 'La Incondicional',
          subtitle: 'Luis Miguel',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/cb/20/33/cb2033bc-1f55-6b66-e886-4f7f6a735c02/090317379569.jpg/600x600bb.jpg',
        },
      ],
      artist: [
        {
          title: 'The Weeknd',
          subtitle: 'R&B / Pop',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/19/27/bf19273c-cbe4-8f49-556b-67a845a7ad86/16UMGIM86064.rgb.jpg/600x600bb.jpg',
        },
        {
          title: 'Bad Bunny',
          subtitle: 'Urbano latino',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3e/70/4e/3e704e90-c24c-9f6b-735a-8b8a68b57112/196626945068.jpg/600x600bb.jpg',
        },
        {
          title: 'Daft Punk',
          subtitle: 'Electrónica',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/64/98/9c/64989c72-c07a-24ce-55c3-11dc82ffcf19/886443927080.jpg/600x600bb.jpg',
        },
        {
          title: 'Taylor Swift',
          subtitle: 'Pop',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/09/b3/ef/09b3ef50-ec25-ee86-077d-78ebc6e24694/22UMGIM97187.rgb.jpg/600x600bb.jpg',
        },
        {
          title: 'Luis Miguel',
          subtitle: 'Balada / Pop',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/cb/20/33/cb2033bc-1f55-6b66-e886-4f7f6a735c02/090317379569.jpg/600x600bb.jpg',
        },
      ],
      movie: [
        {
          title: 'Interstellar',
          subtitle: '2014 · Ciencia ficción',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/ee/11/fb/ee11fb14-5f50-fa0c-5264-a690e0b3c20c/pr_source.lsr/600x600bb.jpg',
        },
        {
          title: 'Oppenheimer',
          subtitle: '2023 · Drama / Historia',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/55/b2/89/55b28956-613b-28f0-1c00-60b6ae208be7/Universal_Oppenheimer_AppleTV_EST_KeyArt_4000x3000.jpg/600x600bb.jpg',
        },
        {
          title: 'Spider-Man: Into the Spider-Verse',
          subtitle: '2018 · Animación',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Video123/v4/f2/a7/60/f2a7604a-dc6d-3135-e150-f131a4773820/pr_source.jpg/600x600bb.jpg',
        },
        {
          title: 'Blade Runner 2049',
          subtitle: '2017 · Ciencia ficción',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Video118/v4/3d/c1/34/3dc134dc-7b1f-e3c3-333e-4869c9ff4c2b/pr_source.lsr/600x600bb.jpg',
        },
        {
          title: 'El Viaje de Chihiro',
          subtitle: '2001 · Animación / Fantasía',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/05/65/59/056559d2-7c39-38b8-07e1-b4f0b240578d/SpiritedAway_KeyArt_iTunes_2000x3000.jpg/600x600bb.jpg',
        },
        {
          title: 'Parasite',
          subtitle: '2019 · Suspense / Drama',
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Video123/v4/36/53/7d/36537dbf-5db7-0136-1262-1cf7bbd22223/pr_source.jpg/600x600bb.jpg',
        },
      ],
    };

    const pool = mockDb[type] || [];
    const matched = pool.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    );

    if (matched.length > 0) {
      return matched.map((item, idx) => ({
        id: `fallback-${type}-${idx}`,
        title: item.title,
        subtitle: item.subtitle,
        type,
        imageUrl: item.imageUrl,
      }));
    }

    return [
      {
        id: `custom-${Date.now()}`,
        title: query,
        subtitle: type === 'song' ? 'Canción' : type === 'artist' ? 'Artista' : 'Película',
        type,
        imageUrl: pool[0]?.imageUrl,
      },
    ];
  }
}

export const mediaSearchService = new MediaSearchService();
