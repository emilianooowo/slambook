'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Music, Mic2, Film, ArrowLeft, Trophy, MapPin, X } from 'lucide-react';
import { EntityRankingDetail, MediaType, RankingItem } from '@/types/slambook.types';
import { rankingsService } from '@/services/rankings.service';
import { DEFAULT_CAMPUS_SLUG, getCampusBySlug } from '@/config/campuses';
import MediaImage from '@/components/common/MediaImage';

export default function RankingsSearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MediaType | 'all'>('all');
  const [results, setResults] = useState<EntityRankingDetail[]>([]);
  const [searching, setSearching] = useState(false);

  // Líderes All-Time
  const [topSongs, setTopSongs] = useState<RankingItem[]>([]);
  const [topArtists, setTopArtists] = useState<RankingItem[]>([]);
  const [topMovies, setTopMovies] = useState<RankingItem[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const campus = getCampusBySlug(DEFAULT_CAMPUS_SLUG);

  useEffect(() => {
    // Cargar líderes All-Time de inicio
    Promise.all([
      rankingsService.getAllTimeLeaderboard(DEFAULT_CAMPUS_SLUG, 'song', 5),
      rankingsService.getAllTimeLeaderboard(DEFAULT_CAMPUS_SLUG, 'artist', 5),
      rankingsService.getAllTimeLeaderboard(DEFAULT_CAMPUS_SLUG, 'movie', 5),
    ]).then(([songs, artists, movies]) => {
      setTopSongs(songs);
      setTopArtists(artists);
      setTopMovies(movies);
      setLoadingLeaderboard(false);
    });
  }, []);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const typeFilter = category === 'all' ? undefined : category;
      const data = await rankingsService.searchEntityRanking(
        DEFAULT_CAMPUS_SLUG,
        query,
        typeFilter
      );
      setResults(data);
      setSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, category]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-neutral-900 font-sans flex flex-col">
      {/* Header minimalista blanco */}
      <header className="h-14 bg-white border-b border-neutral-200 px-6 flex items-center justify-between sticky top-0 z-30">
        <Link
          href={`/${DEFAULT_CAMPUS_SLUG}`}
          className="text-xs text-neutral-600 hover:text-[#8A4222] font-medium flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#8A4222]" />
          <span>Volver al mapa</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
          <Trophy className="w-3.5 h-3.5 text-[#8A4222]" />
          <span>Posición en Rankings All-Time</span>
        </div>
      </header>

      {/* Contenedor central */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Buscador Principal */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h1 className="text-base font-semibold text-neutral-900">
              ¿En qué lugar está tu favorito?
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Busca cualquier canción, artista o película para descubrir su puesto histórico y votos por facultad.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar canción, artista o película..."
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#8A4222] transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros de categoría */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-neutral-500 font-medium mr-1">Filtrar:</span>
            {[
              { id: 'all', label: 'Todas', icon: null },
              { id: 'song', label: 'Canciones', icon: Music },
              { id: 'artist', label: 'Artistas', icon: Mic2 },
              { id: 'movie', label: 'Películas', icon: Film },
            ].map((f) => {
              const Icon = f.icon;
              const isActive = category === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCategory(f.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    isActive
                      ? 'border-[#8A4222] text-[#8A4222] bg-[#8A4222]/5'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resultados de la Búsqueda */}
        {query.trim().length >= 2 ? (
          <div className="space-y-3">
            <div className="text-xs text-neutral-500 font-medium px-1">
              {searching
                ? 'Buscando en registros históricos...'
                : `Resultados encontrados (${results.length})`}
            </div>

            {results.length === 0 && !searching && (
              <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-neutral-800">
                  No se encontraron votos para &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Este título o artista aún no tiene votos registrados en el campus. ¡Puedes ser el primero en votarlo hoy desde el mapa!
                </p>
                <Link
                  href={`/${DEFAULT_CAMPUS_SLUG}`}
                  className="inline-block mt-3 px-4 py-2 bg-[#8A4222] text-white text-xs font-medium rounded-lg hover:bg-[#72361b] transition-colors"
                >
                  Ir al mapa y votar
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {results.map((item) => (
                <div
                  key={`${item.type}-${item.title}`}
                  className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start gap-3.5">
                    <MediaImage
                      src={item.imageUrl}
                      alt={item.title}
                      type={item.type}
                      className={`w-14 h-14 ${
                        item.type === 'artist' ? 'rounded-full' : 'rounded-lg'
                      } border border-neutral-100 flex-shrink-0 shadow-sm`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8A4222] font-semibold uppercase tracking-wider">
                        {item.type === 'song' && <Music className="w-3 h-3" />}
                        {item.type === 'artist' && <Mic2 className="w-3 h-3" />}
                        {item.type === 'movie' && <Film className="w-3 h-3" />}
                        <span>
                          {item.type === 'song' ? 'Canción' : item.type === 'artist' ? 'Artista' : 'Película'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-neutral-900 truncate">
                        {item.title}
                      </h3>

                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="font-bold text-neutral-900">
                          Puesto #{item.campusRank}
                        </span>
                        <span className="text-neutral-400">·</span>
                        <span className="text-neutral-500">
                          {item.totalCampusVotes} {item.totalCampusVotes === 1 ? 'voto total' : 'votos totales'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Desglose por facultad */}
                  {item.facultyBreakdowns.length > 0 && (
                    <div className="pt-2.5 border-t border-neutral-100 text-xs space-y-1.5">
                      <span className="text-[11px] font-medium text-neutral-500 block">
                        Votos por facultad:
                      </span>
                      <div className="space-y-1">
                        {item.facultyBreakdowns.map((fb) => (
                          <div
                            key={fb.facultyId}
                            className="flex items-center justify-between text-xs text-neutral-700 py-1 border-b border-neutral-100/60 last:border-b-0"
                          >
                            <span className="truncate flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-[#8A4222]" />
                              {fb.facultyName}
                            </span>
                            <span className="font-semibold text-neutral-900 whitespace-nowrap ml-2">
                              #{fb.rank} ({fb.votes} {fb.votes === 1 ? 'voto' : 'votos'})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Cuadros de Líderes All-Time cuando no hay búsqueda activa */
          <div className="space-y-4">
            <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
              Líderes Históricos (All-Time en {campus?.shortName})
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* TOP 5 CANCIONES */}
              <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 pb-2 border-b border-neutral-100">
                  <Music className="w-4 h-4 text-[#8A4222]" />
                  <span>Top Canciones</span>
                </div>
                {loadingLeaderboard ? (
                  <p className="text-xs text-neutral-400">Cargando...</p>
                ) : topSongs.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic py-2">Sin votos registrados aún</p>
                ) : (
                  <div className="space-y-2">
                    {topSongs.map((song, idx) => (
                      <div key={song.name} className="flex items-center gap-2.5 text-xs">
                        <span className="w-3.5 text-center font-bold text-neutral-400 text-[11px]">
                          {idx + 1}
                        </span>
                        <MediaImage
                          src={song.imageUrl}
                          alt={song.name}
                          type="song"
                          className="w-7 h-7 rounded object-cover border border-neutral-100 flex-shrink-0"
                        />
                        <span className="flex-1 truncate font-medium text-neutral-800">
                          {song.name}
                        </span>
                        <span className="text-neutral-500 font-semibold text-[11px]">
                          {song.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TOP 5 ARTISTAS */}
              <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 pb-2 border-b border-neutral-100">
                  <Mic2 className="w-4 h-4 text-[#8A4222]" />
                  <span>Top Artistas</span>
                </div>
                {loadingLeaderboard ? (
                  <p className="text-xs text-neutral-400">Cargando...</p>
                ) : topArtists.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic py-2">Sin votos registrados aún</p>
                ) : (
                  <div className="space-y-2">
                    {topArtists.map((artist, idx) => (
                      <div key={artist.name} className="flex items-center gap-2.5 text-xs">
                        <span className="w-3.5 text-center font-bold text-neutral-400 text-[11px]">
                          {idx + 1}
                        </span>
                        <MediaImage
                          src={artist.imageUrl}
                          alt={artist.name}
                          type="artist"
                          className="w-7 h-7 rounded-full object-cover border border-neutral-100 flex-shrink-0"
                        />
                        <span className="flex-1 truncate font-medium text-neutral-800">
                          {artist.name}
                        </span>
                        <span className="text-neutral-500 font-semibold text-[11px]">
                          {artist.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TOP 5 PELÍCULAS */}
              <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 pb-2 border-b border-neutral-100">
                  <Film className="w-4 h-4 text-[#8A4222]" />
                  <span>Top Películas</span>
                </div>
                {loadingLeaderboard ? (
                  <p className="text-xs text-neutral-400">Cargando...</p>
                ) : topMovies.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic py-2">Sin votos registrados aún</p>
                ) : (
                  <div className="space-y-2">
                    {topMovies.map((movie, idx) => (
                      <div key={movie.name} className="flex items-center gap-2.5 text-xs">
                        <span className="w-3.5 text-center font-bold text-neutral-400 text-[11px]">
                          {idx + 1}
                        </span>
                        <MediaImage
                          src={movie.imageUrl}
                          alt={movie.name}
                          type="movie"
                          className="w-6 h-8 rounded object-cover border border-neutral-100 flex-shrink-0"
                        />
                        <span className="flex-1 truncate font-medium text-neutral-800">
                          {movie.name}
                        </span>
                        <span className="text-neutral-500 font-semibold text-[11px]">
                          {movie.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
