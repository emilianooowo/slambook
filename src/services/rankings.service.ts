import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  AuthUser,
  DailySubmission,
  DailyVoteInput,
  FacultyRankings,
  RankingItem,
  Timeframe,
} from '@/types/slambook.types';

const MOCK_SUBMISSIONS_KEY = 'slambook_mock_submissions_v2';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateDaysAgoString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

class RankingsService {
  isMockMode(): boolean {
    return !isSupabaseConfigured();
  }

  private initMockDataIfNeeded(): DailySubmission[] {
    if (typeof window === 'undefined') return [];

    const existing = localStorage.getItem(MOCK_SUBMISSIONS_KEY);
    if (existing) {
      try {
        return JSON.parse(existing);
      } catch {
        // En caso de error, regeneramos
      }
    }

    const today = getTodayDateString();
    const twoDaysAgo = getDateDaysAgoString(2);
    const fourDaysAgo = getDateDaysAgoString(4);
    const tenDaysAgo = getDateDaysAgoString(10);
    const twentyDaysAgo = getDateDaysAgoString(20);

    const initialMock: DailySubmission[] = [
      // INGENIERÍA
      {
        id: 'sub-ing-1',
        campus_slug: 'unach-tuxtla',
        faculty_id: 'ingenieria',
        user_id: 'user-unach-10',
        user_email: 'carlos.m@unach.mx',
        song: 'Starboy (The Weeknd)',
        song_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/19/27/bf19273c-cbe4-8f49-556b-67a845a7ad86/16UMGIM86064.rgb.jpg/600x600bb.jpg',
        artist: 'The Weeknd',
        artist_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/19/27/bf19273c-cbe4-8f49-556b-67a845a7ad86/16UMGIM86064.rgb.jpg/600x600bb.jpg',
        movie: 'Interstellar',
        movie_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/ee/11/fb/ee11fb14-5f50-fa0c-5264-a690e0b3c20c/pr_source.lsr/600x600bb.jpg',
        submission_date: today,
        created_at: new Date().toISOString(),
      },
      {
        id: 'sub-ing-2',
        campus_slug: 'unach-tuxtla',
        faculty_id: 'ingenieria',
        user_id: 'user-unach-11',
        user_email: 'valeria.r@unach.mx',
        song: 'Starboy (The Weeknd)',
        song_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/19/27/bf19273c-cbe4-8f49-556b-67a845a7ad86/16UMGIM86064.rgb.jpg/600x600bb.jpg',
        artist: 'Daft Punk',
        artist_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/64/98/9c/64989c72-c07a-24ce-55c3-11dc82ffcf19/886443927080.jpg/600x600bb.jpg',
        movie: 'Oppenheimer',
        movie_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/55/b2/89/55b28956-613b-28f0-1c00-60b6ae208be7/Universal_Oppenheimer_AppleTV_EST_KeyArt_4000x3000.jpg/600x600bb.jpg',
        submission_date: today,
        created_at: new Date().toISOString(),
      },
      {
        id: 'sub-ing-3',
        campus_slug: 'unach-tuxtla',
        faculty_id: 'ingenieria',
        user_id: 'user-unach-12',
        user_email: 'jorge.g@unach.mx',
        song: 'De Música Ligera (Soda Stereo)',
        song_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/44/21/df/4421df65-e9f0-252c-c466-9c4c798031d6/886445582379.jpg/600x600bb.jpg',
        artist: 'Soda Stereo',
        artist_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/44/21/df/4421df65-e9f0-252c-c466-9c4c798031d6/886445582379.jpg/600x600bb.jpg',
        movie: 'Blade Runner 2049',
        movie_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Video118/v4/3d/c1/34/3dc134dc-7b1f-e3c3-333e-4869c9ff4c2b/pr_source.lsr/600x600bb.jpg',
        submission_date: today,
        created_at: new Date().toISOString(),
      },
      {
        id: 'sub-ing-4',
        campus_slug: 'unach-tuxtla',
        faculty_id: 'ingenieria',
        user_id: 'user-unach-13',
        user_email: 'ana.l@unach.mx',
        song: 'Starboy (The Weeknd)',
        song_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/19/27/bf19273c-cbe4-8f49-556b-67a845a7ad86/16UMGIM86064.rgb.jpg/600x600bb.jpg',
        artist: 'Daft Punk',
        artist_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/64/98/9c/64989c72-c07a-24ce-55c3-11dc82ffcf19/886443927080.jpg/600x600bb.jpg',
        movie: 'Interstellar',
        movie_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/ee/11/fb/ee11fb14-5f50-fa0c-5264-a690e0b3c20c/pr_source.lsr/600x600bb.jpg',
        submission_date: twoDaysAgo,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'sub-ing-5',
        campus_slug: 'unach-tuxtla',
        faculty_id: 'ingenieria',
        user_id: 'user-unach-14',
        user_email: 'roberto.s@unach.mx',
        song: 'Bohemian Rhapsody (Queen)',
        song_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3d/8c/59/3d8c593d-d421-4fa3-5e92-6a7f1a30f3a6/00602547202773.rgb.jpg/600x600bb.jpg',
        artist: 'Queen',
        artist_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3d/8c/59/3d8c593d-d421-4fa3-5e92-6a7f1a30f3a6/00602547202773.rgb.jpg/600x600bb.jpg',
        movie: 'Spider-Man: Into the Spider-Verse',
        movie_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Video123/v4/f2/a7/60/f2a7604a-dc6d-3135-e150-f131a4773820/pr_source.jpg/600x600bb.jpg',
        submission_date: fourDaysAgo,
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },

      // ARQUITECTURA
      {
        id: 'sub-arq-1',
        campus_slug: 'unach-tuxtla',
        faculty_id: 'arquitectura',
        user_id: 'user-arq-1',
        user_email: 'elena.arq@unach.mx',
        song: 'Ojitos Lindos (Bad Bunny)',
        song_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3e/70/4e/3e704e90-c24c-9f6b-735a-8b8a68b57112/196626945068.jpg/600x600bb.jpg',
        artist: 'Bad Bunny',
        artist_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3e/70/4e/3e704e90-c24c-9f6b-735a-8b8a68b57112/196626945068.jpg/600x600bb.jpg',
        movie: 'Parasite',
        movie_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Video123/v4/36/53/7d/36537dbf-5db7-0136-1262-1cf7bbd22223/pr_source.jpg/600x600bb.jpg',
        submission_date: today,
        created_at: new Date().toISOString(),
      },

      // CONTADURÍA (FCA)
      {
        id: 'sub-fca-1',
        campus_slug: 'unach-tuxtla',
        faculty_id: 'contaduria',
        user_id: 'user-fca-1',
        user_email: 'fernando.fca@unach.mx',
        song: 'La Incondicional (Luis Miguel)',
        song_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/cb/20/33/cb2033bc-1f55-6b66-e886-4f7f6a735c02/090317379569.jpg/600x600bb.jpg',
        artist: 'Luis Miguel',
        artist_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/cb/20/33/cb2033bc-1f55-6b66-e886-4f7f6a735c02/090317379569.jpg/600x600bb.jpg',
        movie: 'Oppenheimer',
        movie_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Video126/v4/55/b2/89/55b28956-613b-28f0-1c00-60b6ae208be7/Universal_Oppenheimer_AppleTV_EST_KeyArt_4000x3000.jpg/600x600bb.jpg',
        submission_date: today,
        created_at: new Date().toISOString(),
      },

      // LENGUAS
      {
        id: 'sub-len-1',
        campus_slug: 'unach-tuxtla',
        faculty_id: 'lenguas',
        user_id: 'user-len-1',
        user_email: 'marian.len@unach.mx',
        song: 'Cruel Summer (Taylor Swift)',
        song_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/09/b3/ef/09b3ef50-ec25-ee86-077d-78ebc6e24694/22UMGIM97187.rgb.jpg/600x600bb.jpg',
        artist: 'Taylor Swift',
        artist_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/09/b3/ef/09b3ef50-ec25-ee86-077d-78ebc6e24694/22UMGIM97187.rgb.jpg/600x600bb.jpg',
        movie: 'El Viaje de Chihiro',
        movie_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/05/65/59/056559d2-7c39-38b8-07e1-b4f0b240578d/SpiritedAway_KeyArt_iTunes_2000x3000.jpg/600x600bb.jpg',
        submission_date: today,
        created_at: new Date().toISOString(),
      },
    ];

    localStorage.setItem(MOCK_SUBMISSIONS_KEY, JSON.stringify(initialMock));
    return initialMock;
  }

  async getRankings(
    campusSlug: string,
    facultyId: string,
    timeframe: Timeframe
  ): Promise<FacultyRankings> {
    if (this.isMockMode()) {
      const allSubmissions = this.initMockDataIfNeeded();
      const today = getTodayDateString();
      const sevenDaysAgo = getDateDaysAgoString(7);

      const filtered = allSubmissions.filter((sub) => {
        if (sub.campus_slug !== campusSlug || sub.faculty_id !== facultyId) {
          return false;
        }
        if (timeframe === 'day') {
          return sub.submission_date === today;
        } else if (timeframe === 'week') {
          return sub.submission_date >= sevenDaysAgo;
        }
        return true;
      });

      return {
        songs: this.calculateTopWithImages(
          filtered
            .filter((s) => Boolean(s.song))
            .map((s) => ({ name: s.song!, imageUrl: s.song_image_url })),
          5
        ),
        artists: this.calculateTopWithImages(
          filtered
            .filter((s) => Boolean(s.artist))
            .map((s) => ({ name: s.artist!, imageUrl: s.artist_image_url })),
          5
        ),
        movies: this.calculateTopWithImages(
          filtered
            .filter((s) => Boolean(s.movie))
            .map((s) => ({ name: s.movie!, imageUrl: s.movie_image_url })),
          5
        ),
        totalVotes: filtered.length,
      };
    }

    const supabase = createClient();
    if (!supabase) {
      return { songs: [], artists: [], movies: [], totalVotes: 0 };
    }

    try {
      let query = supabase
        .from('daily_submissions')
        .select('*')
        .eq('campus_slug', campusSlug)
        .eq('faculty_id', facultyId);

      const today = getTodayDateString();
      if (timeframe === 'day') {
        query = query.eq('submission_date', today);
      } else if (timeframe === 'week') {
        query = query.gte('submission_date', getDateDaysAgoString(7));
      }

      const { data, error } = await query;
      if (error || !data) {
        console.error('Error fetching rankings from Supabase:', error);
        return { songs: [], artists: [], movies: [], totalVotes: 0 };
      }

      return {
        songs: this.calculateTopWithImages(
          data
            .filter((r) => Boolean(r.song))
            .map((r) => ({ name: r.song, imageUrl: r.song_image_url })),
          5
        ),
        artists: this.calculateTopWithImages(
          data
            .filter((r) => Boolean(r.artist))
            .map((r) => ({ name: r.artist, imageUrl: r.artist_image_url })),
          5
        ),
        movies: this.calculateTopWithImages(
          data
            .filter((r) => Boolean(r.movie))
            .map((r) => ({ name: r.movie, imageUrl: r.movie_image_url })),
          5
        ),
        totalVotes: data.length,
      };
    } catch (err) {
      console.error('RankingsService exception:', err);
      return { songs: [], artists: [], movies: [], totalVotes: 0 };
    }
  }

  async getUserTodaySubmission(
    campusSlug: string,
    userId: string
  ): Promise<DailySubmission | null> {
    if (!userId) return null;
    const today = getTodayDateString();

    if (this.isMockMode()) {
      const submissions = this.initMockDataIfNeeded();
      const found = submissions.find(
        (s) =>
          s.campus_slug === campusSlug &&
          s.user_id === userId &&
          s.submission_date === today
      );
      return found || null;
    }

    const supabase = createClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('daily_submissions')
        .select('*')
        .eq('campus_slug', campusSlug)
        .eq('user_id', userId)
        .eq('submission_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user today submission:', error);
        return null;
      }

      return data as DailySubmission | null;
    } catch (err) {
      console.error('getUserTodaySubmission exception:', err);
      return null;
    }
  }

  /**
   * Envía o actualiza votos del día por separado.
   * Permite enviar sólo canción, sólo artista, sólo película o combinaciones.
   */
  async submitDailyVote(
    input: DailyVoteInput,
    user: AuthUser
  ): Promise<DailySubmission> {
    if (!user || !user.id || !user.email) {
      throw new Error('Debes estar autenticado para registrar tu voto.');
    }

    const hasSong = Boolean(input.song && input.song.trim());
    const hasArtist = Boolean(input.artist && input.artist.trim());
    const hasMovie = Boolean(input.movie && input.movie.trim());

    if (!hasSong && !hasArtist && !hasMovie) {
      throw new Error('Selecciona al menos una categoría (canción, artista o película).');
    }

    const today = getTodayDateString();

    if (this.isMockMode()) {
      const submissions = this.initMockDataIfNeeded();
      const existingIndex = submissions.findIndex(
        (s) =>
          s.campus_slug === input.campusSlug &&
          s.user_id === user.id &&
          s.submission_date === today
      );

      let record: DailySubmission;

      if (existingIndex >= 0) {
        // Actualizar/combinar los campos que el usuario envió por separado
        const current = submissions[existingIndex];
        record = {
          ...current,
          faculty_id: input.facultyId || current.faculty_id,
          song: hasSong ? input.song!.trim() : current.song,
          song_image_url: hasSong ? input.songImageUrl : current.song_image_url,
          artist: hasArtist ? input.artist!.trim() : current.artist,
          artist_image_url: hasArtist ? input.artistImageUrl : current.artist_image_url,
          movie: hasMovie ? input.movie!.trim() : current.movie,
          movie_image_url: hasMovie ? input.movieImageUrl : current.movie_image_url,
        };
        submissions[existingIndex] = record;
      } else {
        record = {
          id: `mock-sub-${Date.now()}`,
          campus_slug: input.campusSlug,
          faculty_id: input.facultyId,
          user_id: user.id,
          user_email: user.email,
          song: hasSong ? input.song!.trim() : undefined,
          song_image_url: hasSong ? input.songImageUrl : undefined,
          artist: hasArtist ? input.artist!.trim() : undefined,
          artist_image_url: hasArtist ? input.artistImageUrl : undefined,
          movie: hasMovie ? input.movie!.trim() : undefined,
          movie_image_url: hasMovie ? input.movieImageUrl : undefined,
          submission_date: today,
          created_at: new Date().toISOString(),
        };
        submissions.unshift(record);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_SUBMISSIONS_KEY, JSON.stringify(submissions));
      }

      return record;
    }

    const supabase = createClient();
    if (!supabase) {
      throw new Error('Supabase no está configurado.');
    }

    // En Supabase, usamos upsert basado en (user_id, submission_date)
    const payload: any = {
      campus_slug: input.campusSlug,
      faculty_id: input.facultyId,
      user_id: user.id,
      user_email: user.email,
      submission_date: today,
    };

    if (hasSong) {
      payload.song = input.song!.trim();
      payload.song_image_url = input.songImageUrl;
    }
    if (hasArtist) {
      payload.artist = input.artist!.trim();
      payload.artist_image_url = input.artistImageUrl;
    }
    if (hasMovie) {
      payload.movie = input.movie!.trim();
      payload.movie_image_url = input.movieImageUrl;
    }

    const { data, error } = await supabase
      .from('daily_submissions')
      .upsert(payload, { onConflict: 'user_id, submission_date' })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Error al guardar el voto.');
    }

    return data as DailySubmission;
  }

  private calculateTopWithImages(
    items: Array<{ name: string; imageUrl?: string }>,
    limit: number
  ): RankingItem[] {
    const counts: Record<string, { count: number; imageUrl?: string }> = {};

    for (const item of items) {
      const clean = (item.name || '').trim();
      if (!clean) continue;

      if (!counts[clean]) {
        counts[clean] = { count: 0, imageUrl: item.imageUrl };
      }
      counts[clean].count += 1;
      if (!counts[clean].imageUrl && item.imageUrl) {
        counts[clean].imageUrl = item.imageUrl;
      }
    }

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        imageUrl: data.imageUrl,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit);
  }
}

export const rankingsService = new RankingsService();
