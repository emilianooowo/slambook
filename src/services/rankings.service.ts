import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  AuthUser,
  DailySubmission,
  DailyVoteInput,
  FacultyRankings,
  MatchingVote,
  RankingItem,
  Timeframe,
} from '@/types/slambook.types';
import { sanitizeInput, sanitizeImageUrl, MAX_LENGTHS } from '@/lib/security';

const MOCK_SUBMISSIONS_KEY = 'slambook_mock_submissions_v3';

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
        // En caso de corrupción, reinicializamos
      }
    }

    const today = getTodayDateString();
    const twoDaysAgo = getDateDaysAgoString(2);
    const fourDaysAgo = getDateDaysAgoString(4);
    const tenDaysAgo = getDateDaysAgoString(10);

    const initialMock: DailySubmission[] = [
      // INGENIERÍA
      {
        id: 'sub-ing-1',
        campus_slug: 'unach-tuxtla',
        faculty_id: 'ingenieria',
        user_id: 'user-unach-10',
        user_email: 'carlos.m@unach.mx',
        username: 'carlos_m',
        user_avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
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
        username: 'valeria_r',
        user_avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
        song: 'Starboy (The Weeknd)',
        song_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/19/27/bf19273c-cbe4-8f49-556b-67a845a7ad86/16UMGIM86064.rgb.jpg/600x600bb.jpg',
        artist: 'Daft Punk',
        artist_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/64/98/9c/64989c72-c07a-24ce-55c3-11dc82ffcf19/886443927080.jpg/600x600bb.jpg',
        movie: 'Interstellar',
        movie_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Video115/v4/ee/11/fb/ee11fb14-5f50-fa0c-5264-a690e0b3c20c/pr_source.lsr/600x600bb.jpg',
        submission_date: today,
        created_at: new Date().toISOString(),
      },
      {
        id: 'sub-ing-3',
        campus_slug: 'unach-tuxtla',
        faculty_id: 'ingenieria',
        user_id: 'user-unach-12',
        user_email: 'jorge.g@unach.mx',
        username: 'jorge_ing',
        user_avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces',
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
        username: 'ana_luisa',
        user_avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
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
        username: 'roberto_s',
        user_avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
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
        username: 'elena_arq',
        user_avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
        song: 'Ojitos Lindos (Bad Bunny)',
        song_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3e/70/4e/3e704e90-c24c-9f6b-735a-8b8a68b57112/196626945068.jpg/600x600bb.jpg',
        artist: 'Bad Bunny',
        artist_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3e/70/4e/3e704e90-c24c-9f6b-735a-8b8a68b57112/196626945068.jpg/600x600bb.jpg',
        movie: 'Parasite',
        movie_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Video123/v4/36/53/7d/36537dbf-5db7-0136-1262-1cf7bbd22223/pr_source.jpg/600x600bb.jpg',
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
    } catch {
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

      if (error) return null;
      return data as DailySubmission | null;
    } catch {
      return null;
    }
  }

  /**
   * Encuentra qué otras personas han votado lo mismo que el usuario.
   */
  async getMatchingVotes(
    campusSlug: string,
    facultyId: string,
    userSubmission: DailySubmission
  ): Promise<MatchingVote[]> {
    const results: MatchingVote[] = [];
    if (!userSubmission) return results;

    let pool: DailySubmission[] = [];

    if (this.isMockMode()) {
      const all = this.initMockDataIfNeeded();
      pool = all.filter(
        (s) =>
          s.campus_slug === campusSlug &&
          s.faculty_id === facultyId &&
          s.user_id !== userSubmission.user_id
      );
    } else {
      const supabase = createClient();
      if (supabase) {
        const { data } = await supabase
          .from('daily_submissions')
          .select('*')
          .eq('campus_slug', campusSlug)
          .eq('faculty_id', facultyId)
          .neq('user_id', userSubmission.user_id);
        if (data) pool = data;
      }
    }

    // Coincidencias en Canción
    if (userSubmission.song) {
      const target = userSubmission.song.trim().toLowerCase();
      const matches = pool.filter((s) => s.song && s.song.trim().toLowerCase() === target);
      if (matches.length > 0) {
        results.push({
          category: 'song',
          itemTitle: userSubmission.song,
          voterCount: matches.length,
          voters: matches.map((m) => ({
            userId: m.user_id,
            displayName: m.username || m.user_email.split('@')[0],
            avatarUrl: m.user_avatar_url,
          })),
        });
      }
    }

    // Coincidencias en Artista
    if (userSubmission.artist) {
      const target = userSubmission.artist.trim().toLowerCase();
      const matches = pool.filter((s) => s.artist && s.artist.trim().toLowerCase() === target);
      if (matches.length > 0) {
        results.push({
          category: 'artist',
          itemTitle: userSubmission.artist,
          voterCount: matches.length,
          voters: matches.map((m) => ({
            userId: m.user_id,
            displayName: m.username || m.user_email.split('@')[0],
            avatarUrl: m.user_avatar_url,
          })),
        });
      }
    }

    // Coincidencias en Película
    if (userSubmission.movie) {
      const target = userSubmission.movie.trim().toLowerCase();
      const matches = pool.filter((s) => s.movie && s.movie.trim().toLowerCase() === target);
      if (matches.length > 0) {
        results.push({
          category: 'movie',
          itemTitle: userSubmission.movie,
          voterCount: matches.length,
          voters: matches.map((m) => ({
            userId: m.user_id,
            displayName: m.username || m.user_email.split('@')[0],
            avatarUrl: m.user_avatar_url,
          })),
        });
      }
    }

    return results;
  }

  async submitDailyVote(
    input: DailyVoteInput,
    user: AuthUser
  ): Promise<DailySubmission> {
    if (!user || !user.id || !user.email) {
      throw new Error('Debes estar autenticado para registrar tu voto.');
    }

    // Seguridad: Sanitizar entradas contra buffer overflow y caracteres extraños
    const cleanSong = input.song ? sanitizeInput(input.song, MAX_LENGTHS.TEXT_INPUT) : undefined;
    const cleanArtist = input.artist ? sanitizeInput(input.artist, MAX_LENGTHS.TEXT_INPUT) : undefined;
    const cleanMovie = input.movie ? sanitizeInput(input.movie, MAX_LENGTHS.TEXT_INPUT) : undefined;

    const cleanSongImg = sanitizeImageUrl(input.songImageUrl);
    const cleanArtistImg = sanitizeImageUrl(input.artistImageUrl);
    const cleanMovieImg = sanitizeImageUrl(input.movieImageUrl);

    const hasSong = Boolean(cleanSong && cleanSong.length > 0);
    const hasArtist = Boolean(cleanArtist && cleanArtist.length > 0);
    const hasMovie = Boolean(cleanMovie && cleanMovie.length > 0);

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
        const current = submissions[existingIndex];
        record = {
          ...current,
          faculty_id: input.facultyId || current.faculty_id,
          username: user.username || current.username,
          user_avatar_url: user.avatarUrl || current.user_avatar_url,
          song: hasSong ? cleanSong : current.song,
          song_image_url: hasSong ? cleanSongImg : current.song_image_url,
          artist: hasArtist ? cleanArtist : current.artist,
          artist_image_url: hasArtist ? cleanArtistImg : current.artist_image_url,
          movie: hasMovie ? cleanMovie : current.movie,
          movie_image_url: hasMovie ? cleanMovieImg : current.movie_image_url,
        };
        submissions[existingIndex] = record;
      } else {
        record = {
          id: `mock-sub-${Date.now()}`,
          campus_slug: input.campusSlug,
          faculty_id: input.facultyId,
          user_id: user.id,
          user_email: user.email,
          username: user.username,
          user_avatar_url: user.avatarUrl,
          song: hasSong ? cleanSong : undefined,
          song_image_url: hasSong ? cleanSongImg : undefined,
          artist: hasArtist ? cleanArtist : undefined,
          artist_image_url: hasArtist ? cleanArtistImg : undefined,
          movie: hasMovie ? cleanMovie : undefined,
          movie_image_url: hasMovie ? cleanMovieImg : undefined,
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
    if (!supabase) throw new Error('Supabase no está configurado.');

    const payload: any = {
      campus_slug: input.campusSlug,
      faculty_id: input.facultyId,
      user_id: user.id,
      user_email: user.email,
      username: user.username,
      user_avatar_url: user.avatarUrl,
      submission_date: today,
    };

    if (hasSong) {
      payload.song = cleanSong;
      payload.song_image_url = cleanSongImg;
    }
    if (hasArtist) {
      payload.artist = cleanArtist;
      payload.artist_image_url = cleanArtistImg;
    }
    if (hasMovie) {
      payload.movie = cleanMovie;
      payload.movie_image_url = cleanMovieImg;
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
