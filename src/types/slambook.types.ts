export type FacultyId =
  | 'arquitectura'
  | 'ingenieria'
  | 'contaduria'
  | 'lenguas'
  | 'biblioteca'
  | string;

export interface CampusFaculty {
  id: FacultyId;
  name: string;
  shortName: string;
}

export interface CampusConfig {
  slug: string;
  universityId: string;
  universityName: string;
  campusName: string;
  name: string;
  shortName: string;
  allowedDomain: string;
  defaultFacultyId: string;
  faculties: CampusFaculty[];
}

export type Timeframe = 'day' | 'week' | 'all';

export type MediaType = 'song' | 'artist' | 'movie';

export interface MediaItem {
  id: string;
  title: string;
  subtitle?: string;
  type: MediaType;
  imageUrl?: string;
}

export interface DailySubmission {
  id: string;
  campus_slug: string;
  faculty_id: string;
  user_id: string;
  user_email: string;
  username?: string;
  user_avatar_url?: string;
  song?: string;
  song_image_url?: string;
  artist?: string;
  artist_image_url?: string;
  movie?: string;
  movie_image_url?: string;
  submission_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface RankingItem {
  name: string;
  count: number;
  imageUrl?: string;
  subtitle?: string;
}

export interface FacultyRankings {
  songs: RankingItem[];
  artists: RankingItem[];
  movies: RankingItem[];
  totalVotes: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  isMock?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl: string;
}

export interface DailyVoteInput {
  campusSlug: string;
  facultyId: string;
  song?: string;
  songImageUrl?: string;
  artist?: string;
  artistImageUrl?: string;
  movie?: string;
  movieImageUrl?: string;
}

export interface MatchingVote {
  category: 'song' | 'artist' | 'movie';
  itemTitle: string;
  voterCount: number;
  voters: Array<{
    userId: string;
    displayName: string;
    avatarUrl?: string;
  }>;
}
