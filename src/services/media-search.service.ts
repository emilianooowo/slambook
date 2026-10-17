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
      // Usar endpoint interno del servidor Next.js para evitar bloqueos de CORS en el browser
      const url = `/api/media-search?term=${encodeURIComponent(trimmed)}&type=${type}`;
      const res = await fetch(url, { signal });

      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          this.cache.set(cacheKey, data.results);
          return data.results;
        }
      }

      // Si la API interna no arroja resultados, recurrir a los datos predefinidos
      const fallback = this.getFallbackResults(trimmed, type);
      this.cache.set(cacheKey, fallback);
      return fallback;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return [];
      }
      return this.getFallbackResults(trimmed, type);
    }
  }

  private getFallbackResults(query: string, type: MediaType): MediaItem[] {
    const q = query.toLowerCase();
    const mockDb: Record<MediaType, Array<{ title: string; subtitle: string; imageUrl: string }>> = {
      song: [
        {
          title: 'Starboy',
          subtitle: 'The Weeknd ft. Daft Punk',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
        },
        {
          title: 'De Música Ligera',
          subtitle: 'Soda Stereo',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
        },
        {
          title: 'Bohemian Rhapsody',
          subtitle: 'Queen',
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
        },
        {
          title: 'Ojitos Lindos',
          subtitle: 'Bad Bunny & Bomba Estéreo',
          imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        },
        {
          title: 'La Incondicional',
          subtitle: 'Luis Miguel',
          imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop',
        },
      ],
      artist: [
        {
          title: 'The Weeknd',
          subtitle: 'R&B / Pop',
          imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&h=300&fit=crop&crop=faces',
        },
        {
          title: 'Bad Bunny',
          subtitle: 'Urbano latino',
          imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces',
        },
        {
          title: 'Daft Punk',
          subtitle: 'Electrónica',
          imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop',
        },
        {
          title: 'Taylor Swift',
          subtitle: 'Pop',
          imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
        },
        {
          title: 'Soda Stereo',
          subtitle: 'Rock en español',
          imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&h=300&fit=crop',
        },
      ],
      movie: [
        {
          title: 'Interstellar',
          subtitle: '2014 · Ciencia ficción',
          imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=450&fit=crop',
        },
        {
          title: 'Oppenheimer',
          subtitle: '2023 · Drama / Historia',
          imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=450&fit=crop',
        },
        {
          title: 'Spider-Man: Into the Spider-Verse',
          subtitle: '2018 · Animación',
          imageUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=450&fit=crop',
        },
        {
          title: 'Blade Runner 2049',
          subtitle: '2017 · Ciencia ficción',
          imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=450&fit=crop',
        },
        {
          title: 'Parasite',
          subtitle: '2019 · Drama / Suspense',
          imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop',
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
