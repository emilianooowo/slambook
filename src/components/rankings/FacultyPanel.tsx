'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Music, Mic2, Film, Users, Trophy, Sparkles } from 'lucide-react';
import {
  CampusConfig,
  FacultyRankings,
  Timeframe,
  DailySubmission,
  MatchingVote,
  AuthUser,
} from '@/types/slambook.types';
import { rankingsService } from '@/services/rankings.service';
import { authService } from '@/services/auth.service';
import MediaImage from '@/components/common/MediaImage';

interface FacultyPanelProps {
  campus: CampusConfig;
  facultyId: string;
}

export default function FacultyPanel({ campus, facultyId }: FacultyPanelProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('day');
  const [rankings, setRankings] = useState<FacultyRankings>({
    songs: [],
    artists: [],
    movies: [],
    totalVotes: 0,
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userSubmission, setUserSubmission] = useState<DailySubmission | null>(null);
  const [matchingVotes, setMatchingVotes] = useState<MatchingVote[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentFaculty = campus.faculties.find((f) => f.id === facultyId) || {
    id: facultyId,
    name: facultyId,
    shortName: facultyId,
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rankingsService.getRankings(
        campus.slug,
        facultyId,
        timeframe
      );
      setRankings(data);

      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const sub = await rankingsService.getUserTodaySubmission(campus.slug, user.id);
        setUserSubmission(sub);

        if (sub) {
          const matches = await rankingsService.getMatchingVotes(campus.slug, facultyId, sub);
          setMatchingVotes(matches);
        } else {
          setMatchingVotes([]);
        }
      } else {
        setUserSubmission(null);
        setMatchingVotes([]);
      }
    } catch (e) {
      console.error('Error fetching rankings/user votes:', e);
    } finally {
      setLoading(false);
    }
  }, [campus.slug, facultyId, timeframe]);

  useEffect(() => {
    loadData();
    const unsub = authService.onAuthStateChange(() => {
      loadData();
    });
    return unsub;
  }, [loadData]);

  const isEmpty =
    rankings.songs.length === 0 &&
    rankings.artists.length === 0 &&
    rankings.movies.length === 0;

  return (
    <aside className="w-full h-full flex flex-col bg-white border border-neutral-200 rounded-2xl p-5 text-neutral-900 overflow-hidden font-sans shadow-sm animate-fade-in">
      {/* Header sin bordes ni fondos en labels */}
      <header className="pb-3 mb-3 border-b border-neutral-100 flex flex-col gap-0.5">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>{campus.shortName}</span>
          <span className="text-neutral-500 font-medium">
            {rankings.totalVotes} {rankings.totalVotes === 1 ? 'voto' : 'votos'}
          </span>
        </div>
        <h1 className="text-base font-semibold text-neutral-900 truncate">
          {currentFaculty.name}
        </h1>
      </header>

      {/* Pestañas minimalistas con acento cobrizo casi oscuro #8A4222 */}
      <nav className="flex items-center gap-6 border-b border-neutral-100 pb-2 mb-4 text-xs">
        {(['day', 'week', 'all'] as const).map((tab) => {
          const isActive = timeframe === tab;
          const label = tab === 'day' ? 'Hoy' : tab === 'week' ? 'Semana' : 'Histórico';
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setTimeframe(tab)}
              className={`pb-1 font-medium transition-colors relative ${
                isActive
                  ? 'text-[#8A4222] font-semibold'
                  : 'text-neutral-400 hover:text-neutral-800'
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute bottom-[-9px] left-0 right-0 h-[2px] bg-[#8A4222] rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Contenido scrolleable con animaciones sutiles */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
        {/* SECCIÓN: Voto del usuario hoy y coincidencias */}
        {currentUser && (
          <section className="p-3.5 bg-neutral-50 border border-neutral-100 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#8A4222]" />
                Tu voto de hoy
              </span>
              {userSubmission && matchingVotes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowMatches(!showMatches)}
                  className="text-xs text-[#8A4222] hover:underline font-medium flex items-center gap-1"
                >
                  <Users className="w-3 h-3" />
                  {showMatches
                    ? 'Ocultar'
                    : `Coincidencias (${matchingVotes.reduce((acc, m) => acc + m.voterCount, 0)})`}
                </button>
              )}
            </div>

            {userSubmission ? (
              <div className="space-y-1.5 text-neutral-600">
                {userSubmission.song && (
                  <div className="flex items-center gap-2">
                    <Music className="w-3 h-3 text-neutral-400" />
                    <span className="text-neutral-400">Canción:</span>
                    <span className="font-medium text-neutral-900 truncate">
                      {userSubmission.song}
                    </span>
                  </div>
                )}
                {userSubmission.artist && (
                  <div className="flex items-center gap-2">
                    <Mic2 className="w-3 h-3 text-neutral-400" />
                    <span className="text-neutral-400">Artista:</span>
                    <span className="font-medium text-neutral-900 truncate">
                      {userSubmission.artist}
                    </span>
                  </div>
                )}
                {userSubmission.movie && (
                  <div className="flex items-center gap-2">
                    <Film className="w-3 h-3 text-neutral-400" />
                    <span className="text-neutral-400">Película:</span>
                    <span className="font-medium text-neutral-900 truncate">
                      {userSubmission.movie}
                    </span>
                  </div>
                )}

                {showMatches && matchingVotes.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-neutral-200/60 space-y-2 animate-fade-in">
                    <span className="text-xs font-medium text-[#8A4222] block">
                      Estudiantes que votaron lo mismo:
                    </span>
                    {matchingVotes.map((mv) => (
                      <div key={mv.category} className="space-y-1 pl-1">
                        <span className="text-[11px] text-neutral-500 block">
                          En {mv.category === 'song' ? 'canción' : mv.category === 'artist' ? 'artista' : 'película'}: &ldquo;{mv.itemTitle}&rdquo;
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {mv.voters.map((v) => (
                            <div
                              key={v.userId}
                              className="flex items-center gap-1.5 text-[11px] text-neutral-800"
                            >
                              {v.avatarUrl ? (
                                <img
                                  src={v.avatarUrl}
                                  alt={v.displayName}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[9px] font-bold">
                                  {v.displayName[0]?.toUpperCase()}
                                </span>
                              )}
                              <span>{v.displayName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-neutral-400 text-xs">
                Aún no has registrado tu voto hoy en esta facultad.
              </p>
            )}
          </section>
        )}

        {loading ? (
          <div className="py-16 text-center text-neutral-400 text-xs animate-pulse">
            Actualizando rankings...
          </div>
        ) : isEmpty ? (
          <div className="py-14 text-center space-y-2 animate-fade-in">
            <div className="w-9 h-9 rounded-full bg-[#8A4222]/10 text-[#8A4222] flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-neutral-800">
              Aún no hay votos registrados
            </p>
            <p className="text-[11px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Sé el primero en votar en {currentFaculty.shortName} para posicionar tus canciones, artistas y películas favoritas.
            </p>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            {/* TOP CANCIONES */}
            <section className="space-y-2.5">
              <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-neutral-500" />
                Top Canciones
              </span>
              {rankings.songs.length === 0 ? (
                <p className="text-neutral-400 italic text-[11px]">Sin registros en este período</p>
              ) : (
                <div className="space-y-1.5">
                  {rankings.songs.map((song, idx) => (
                    <div
                      key={song.name}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors"
                    >
                      <span className="w-4 text-center font-semibold text-neutral-400 text-xs">
                        {idx + 1}
                      </span>
                      <MediaImage
                        src={song.imageUrl}
                        alt={song.name}
                        type="song"
                        className="w-9 h-9 rounded-lg object-cover border border-neutral-100 flex-shrink-0 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-900 truncate">
                          {song.name}
                        </div>
                      </div>
                      <span className="font-medium text-neutral-500 text-xs">
                        {song.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* TOP ARTISTAS */}
            <section className="space-y-2.5">
              <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5 text-neutral-500" />
                Top Artistas
              </span>
              {rankings.artists.length === 0 ? (
                <p className="text-neutral-400 italic text-[11px]">Sin registros en este período</p>
              ) : (
                <div className="space-y-1.5">
                  {rankings.artists.map((artist, idx) => (
                    <div
                      key={artist.name}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors"
                    >
                      <span className="w-4 text-center font-semibold text-neutral-400 text-xs">
                        {idx + 1}
                      </span>
                      <MediaImage
                        src={artist.imageUrl}
                        alt={artist.name}
                        type="artist"
                        className="w-9 h-9 rounded-full object-cover border border-neutral-100 flex-shrink-0 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-900 truncate">
                          {artist.name}
                        </div>
                      </div>
                      <span className="font-medium text-neutral-500 text-xs">
                        {artist.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* TOP PELÍCULAS */}
            <section className="space-y-2.5">
              <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-neutral-500" />
                Top Películas
              </span>
              {rankings.movies.length === 0 ? (
                <p className="text-neutral-400 italic text-[11px]">Sin registros en este período</p>
              ) : (
                <div className="space-y-1.5">
                  {rankings.movies.map((movie, idx) => (
                    <div
                      key={movie.name}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors"
                    >
                      <span className="w-4 text-center font-semibold text-neutral-400 text-xs">
                        {idx + 1}
                      </span>
                      <MediaImage
                        src={movie.imageUrl}
                        alt={movie.name}
                        type="movie"
                        className="w-8 h-10 rounded-lg object-cover border border-neutral-100 flex-shrink-0 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-900 truncate">
                          {movie.name}
                        </div>
                      </div>
                      <span className="font-medium text-neutral-500 text-xs">
                        {movie.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}
