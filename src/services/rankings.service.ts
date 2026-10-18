import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  AuthUser,
  DailySubmission,
  DailyVoteInput,
  EntityRankingDetail,
  FacultyRankings,
  MatchingVote,
  MediaType,
  RankingItem,
  Timeframe,
} from '@/types/slambook.types';
import { sanitizeInput, sanitizeImageUrl, MAX_LENGTHS } from '@/lib/security';
import { getCampusBySlug } from '@/config/campuses';

const MOCK_SUBMISSIONS_KEY = 'slambook_submissions_live';

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
        return [];
      }
    }
    return [];
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

  async getCampusRankings(
    campusSlug: string,
    timeframe: Timeframe
  ): Promise<FacultyRankings> {
    if (this.isMockMode()) {
      const allSubmissions = this.initMockDataIfNeeded();
      const today = getTodayDateString();
      const sevenDaysAgo = getDateDaysAgoString(7);

      const filtered = allSubmissions.filter((sub) => {
        if (sub.campus_slug !== campusSlug) {
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
        .eq('campus_slug', campusSlug);

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

  async searchEntityRanking(
    campusSlug: string,
    query: string,
    typeFilter?: MediaType
  ): Promise<EntityRankingDetail[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const campus = getCampusBySlug(campusSlug);
    let allSubmissions: DailySubmission[] = [];

    if (this.isMockMode()) {
      allSubmissions = this.initMockDataIfNeeded().filter((s) => s.campus_slug === campusSlug);
    } else {
      const supabase = createClient();
      if (supabase) {
        const { data } = await supabase
          .from('daily_submissions')
          .select('*')
          .eq('campus_slug', campusSlug);
        if (data) allSubmissions = data;
      }
    }

    const facultyNames = new Map<string, string>();
    if (campus) {
      campus.faculties.forEach((f) => facultyNames.set(f.id, f.name));
    }

    const entityMap = new Map<string, { type: MediaType; imageUrl?: string }>();

    for (const sub of allSubmissions) {
      if (sub.song && (!typeFilter || typeFilter === 'song')) {
        const key = `song:${sub.song.trim().toLowerCase()}`;
        if (!entityMap.has(key)) {
          entityMap.set(key, { type: 'song', imageUrl: sub.song_image_url });
        }
      }
      if (sub.artist && (!typeFilter || typeFilter === 'artist')) {
        const key = `artist:${sub.artist.trim().toLowerCase()}`;
        if (!entityMap.has(key)) {
          entityMap.set(key, { type: 'artist', imageUrl: sub.artist_image_url });
        }
      }
      if (sub.movie && (!typeFilter || typeFilter === 'movie')) {
        const key = `movie:${sub.movie.trim().toLowerCase()}`;
        if (!entityMap.has(key)) {
          entityMap.set(key, { type: 'movie', imageUrl: sub.movie_image_url });
        }
      }
    }

    const computeCategoryRanks = (type: MediaType) => {
      const counts: Record<string, number> = {};
      for (const sub of allSubmissions) {
        const val = type === 'song' ? sub.song : type === 'artist' ? sub.artist : sub.movie;
        if (val) {
          const clean = val.trim().toLowerCase();
          counts[clean] = (counts[clean] || 0) + 1;
        }
      }
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, votes], idx) => ({ name, votes, rank: idx + 1 }));
    };

    const songRanks = computeCategoryRanks('song');
    const artistRanks = computeCategoryRanks('artist');
    const movieRanks = computeCategoryRanks('movie');

    const results: EntityRankingDetail[] = [];

    for (const [key, meta] of Array.from(entityMap.entries())) {
      const [type, rawName] = key.split(':');
      if (!rawName.includes(q)) continue;

      const table = type === 'song' ? songRanks : type === 'artist' ? artistRanks : movieRanks;
      const foundRank = table.find((item) => item.name === rawName);
      const campusRank = foundRank ? foundRank.rank : 999;
      const totalCampusVotes = foundRank ? foundRank.votes : 0;

      const facultyCounts: Record<string, number> = {};
      for (const sub of allSubmissions) {
        const val = type === 'song' ? sub.song : type === 'artist' ? sub.artist : sub.movie;
        if (val && val.trim().toLowerCase() === rawName) {
          facultyCounts[sub.faculty_id] = (facultyCounts[sub.faculty_id] || 0) + 1;
        }
      }

      const facultyBreakdowns = Object.entries(facultyCounts).map(([fId, votes]) => {
        const facultySubs = allSubmissions.filter((s) => s.faculty_id === fId);
        const fCounts: Record<string, number> = {};
        for (const s of facultySubs) {
          const v = type === 'song' ? s.song : type === 'artist' ? s.artist : s.movie;
          if (v) {
            const clean = v.trim().toLowerCase();
            fCounts[clean] = (fCounts[clean] || 0) + 1;
          }
        }
        const sorted = Object.entries(fCounts).sort((a, b) => b[1] - a[1]);
        const rIndex = sorted.findIndex(([n]) => n === rawName);

        return {
          facultyId: fId,
          facultyName: facultyNames.get(fId) || fId,
          rank: rIndex >= 0 ? rIndex + 1 : 999,
          votes,
        };
      });

      const originalSub = allSubmissions.find((s) => {
        const v = type === 'song' ? s.song : type === 'artist' ? s.artist : s.movie;
        return v && v.trim().toLowerCase() === rawName;
      });
      const displayTitle = originalSub
        ? type === 'song' ? originalSub.song! : type === 'artist' ? originalSub.artist! : originalSub.movie!
        : rawName;

      results.push({
        title: displayTitle,
        type: meta.type,
        imageUrl: meta.imageUrl,
        campusRank,
        totalCampusVotes,
        facultyBreakdowns: facultyBreakdowns.sort((a, b) => b.votes - a.votes),
      });
    }

    return results.sort((a, b) => a.campusRank - b.campusRank);
  }

  async getAllTimeLeaderboard(campusSlug: string, type: MediaType, limit = 10): Promise<RankingItem[]> {
    let allSubmissions: DailySubmission[] = [];

    if (this.isMockMode()) {
      allSubmissions = this.initMockDataIfNeeded().filter((s) => s.campus_slug === campusSlug);
    } else {
      const supabase = createClient();
      if (supabase) {
        const { data } = await supabase
          .from('daily_submissions')
          .select('*')
          .eq('campus_slug', campusSlug);
        if (data) allSubmissions = data;
      }
    }

    const items = allSubmissions
      .filter((s) => {
        const val = type === 'song' ? s.song : type === 'artist' ? s.artist : s.movie;
        return Boolean(val);
      })
      .map((s) => {
        if (type === 'song') return { name: s.song!, imageUrl: s.song_image_url };
        if (type === 'artist') return { name: s.artist!, imageUrl: s.artist_image_url };
        return { name: s.movie!, imageUrl: s.movie_image_url };
      });

    return this.calculateTopWithImages(items, limit);
  }

  async submitDailyVote(
    input: DailyVoteInput,
    user: AuthUser
  ): Promise<DailySubmission> {
    if (!user || !user.id || !user.email) {
      throw new Error('Debes estar autenticado para registrar tu voto.');
    }

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
      throw new Error('Selecciona al menos una categoría.');
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

  async deleteUserData(userId: string): Promise<void> {
    if (!userId) return;

    if (this.isMockMode()) {
      if (typeof window !== 'undefined') {
        const subs = this.initMockDataIfNeeded();
        const filtered = subs.filter((s) => s.user_id !== userId);
        localStorage.setItem(MOCK_SUBMISSIONS_KEY, JSON.stringify(filtered));
      }
      return;
    }

    const supabase = createClient();
    if (supabase) {
      await supabase.from('daily_submissions').delete().eq('user_id', userId);
    }
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
