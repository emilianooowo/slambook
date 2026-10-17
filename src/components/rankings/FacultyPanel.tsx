'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CampusConfig, FacultyRankings, Timeframe } from '@/types/slambook.types';
import { rankingsService } from '@/services/rankings.service';

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
  const [loading, setLoading] = useState(true);

  const currentFaculty = campus.faculties.find((f) => f.id === facultyId) || {
    id: facultyId,
    name: facultyId,
    shortName: facultyId,
  };

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rankingsService.getRankings(
        campus.slug,
        facultyId,
        timeframe
      );
      setRankings(data);
    } catch (e) {
      console.error('Error fetching rankings:', e);
    } finally {
      setLoading(false);
    }
  }, [campus.slug, facultyId, timeframe]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return (
    <aside className="w-full h-full flex flex-col bg-[#0b101d]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl text-white overflow-hidden font-sans">
      {/* Header de la Facultad */}
      <header className="pb-4 mb-4 border-b border-white/10 flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-blue-400 tracking-wider uppercase">
          <span>{campus.shortName}</span>
          <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">
            {rankings.totalVotes} votos registrados
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white truncate">
          {currentFaculty.name}
        </h1>
      </header>

      {/* Control Segmentado de Periodo estilo Apple */}
      <nav className="p-1 bg-black/40 border border-white/5 rounded-2xl grid grid-cols-3 gap-1 mb-5">
        {(['day', 'week', 'all'] as const).map((tab) => {
          const isActive = timeframe === tab;
          const label = tab === 'day' ? 'Hoy' : tab === 'week' ? 'Semana' : 'Histórico';
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setTimeframe(tab)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          );
        })}
      </nav>

      {/* Listas de Rankings con Fotografías y Portadas */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Cargando ranking en vivo...
          </div>
        ) : (
          <>
            {/* 1. CANCIONES */}
            <section className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Top Canciones</span>
                <span className="text-[11px] font-normal text-slate-500">Votos</span>
              </div>
              {rankings.songs.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-slate-500 text-xs text-center">
                  Sin votos para este periodo
                </div>
              ) : (
                <div className="space-y-2">
                  {rankings.songs.map((song, idx) => (
                    <div
                      key={song.name}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                    >
                      <span className="text-sm font-bold text-slate-500 w-4 text-center">
                        {idx + 1}
                      </span>
                      {song.imageUrl ? (
                        <img
                          src={song.imageUrl}
                          alt={song.name}
                          className="w-11 h-11 rounded-xl object-cover border border-white/10 shadow"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm">
                          ♪
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate group-hover:text-blue-300">
                          {song.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Canción más votada
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold text-xs border border-white/10">
                        {song.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 2. ARTISTAS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Top Artistas</span>
                <span className="text-[11px] font-normal text-slate-500">Votos</span>
              </div>
              {rankings.artists.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-slate-500 text-xs text-center">
                  Sin votos para este periodo
                </div>
              ) : (
                <div className="space-y-2">
                  {rankings.artists.map((artist, idx) => (
                    <div
                      key={artist.name}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                    >
                      <span className="text-sm font-bold text-slate-500 w-4 text-center">
                        {idx + 1}
                      </span>
                      {artist.imageUrl ? (
                        <img
                          src={artist.imageUrl}
                          alt={artist.name}
                          className="w-11 h-11 rounded-full object-cover border border-white/10 shadow"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm">
                          ★
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate group-hover:text-blue-300">
                          {artist.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Artista favorito
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold text-xs border border-white/10">
                        {artist.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 3. PELÍCULAS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Top Películas</span>
                <span className="text-[11px] font-normal text-slate-500">Votos</span>
              </div>
              {rankings.movies.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-slate-500 text-xs text-center">
                  Sin votos para este periodo
                </div>
              ) : (
                <div className="space-y-2">
                  {rankings.movies.map((movie, idx) => (
                    <div
                      key={movie.name}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                    >
                      <span className="text-sm font-bold text-slate-500 w-4 text-center">
                        {idx + 1}
                      </span>
                      {movie.imageUrl ? (
                        <img
                          src={movie.imageUrl}
                          alt={movie.name}
                          className="w-9 h-12 rounded-lg object-cover border border-white/10 shadow flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs flex-shrink-0">
                          🎬
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate group-hover:text-blue-300">
                          {movie.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Película destacada
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold text-xs border border-white/10">
                        {movie.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
