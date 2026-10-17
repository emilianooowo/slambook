'use client';

import React, { useState, useEffect } from 'react';
import { CampusConfig, AuthUser, DailySubmission } from '@/types/slambook.types';
import { rankingsService } from '@/services/rankings.service';
import { authService } from '@/services/auth.service';
import MediaSearchInput from './MediaSearchInput';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  campus: CampusConfig;
  initialFacultyId: string;
  onVoteSubmitted: () => void;
}

export default function VoteModal({
  isOpen,
  onClose,
  campus,
  initialFacultyId,
  onVoteSubmitted,
}: VoteModalProps) {
  const [selectedFaculty, setSelectedFaculty] = useState(initialFacultyId);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [todaySubmission, setTodaySubmission] = useState<DailySubmission | null>(null);

  const [song, setSong] = useState('');
  const [songImageUrl, setSongImageUrl] = useState<string | undefined>();

  const [artist, setArtist] = useState('');
  const [artistImageUrl, setArtistImageUrl] = useState<string | undefined>();

  const [movie, setMovie] = useState('');
  const [movieImageUrl, setMovieImageUrl] = useState<string | undefined>();

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setSelectedFaculty(initialFacultyId);
  }, [initialFacultyId]);

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const sub = await rankingsService.getUserTodaySubmission(campus.slug, user.id);
        setTodaySubmission(sub);
        if (sub) {
          if (sub.song && !song) {
            setSong(sub.song);
            setSongImageUrl(sub.song_image_url);
          }
          if (sub.artist && !artist) {
            setArtist(sub.artist);
            setArtistImageUrl(sub.artist_image_url);
          }
          if (sub.movie && !movie) {
            setMovie(sub.movie);
            setMovieImageUrl(sub.movie_image_url);
          }
        }
      } else {
        setTodaySubmission(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen, campus.slug]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setIsError(false);
      setStatusMessage('Conectando con Google...');
      await authService.signInWithGoogle(campus.allowedDomain);
      await loadUserData();
      setStatusMessage(null);
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err.message || 'Error al autenticar');
    }
  };

  const handleSimulateLogin = () => {
    const mockEmail = `estudiante.${Math.floor(Math.random() * 900 + 100)}@${campus.allowedDomain}`;
    authService.simulateMockLogin(mockEmail);
    loadUserData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!song && !artist && !movie) {
      setIsError(true);
      setStatusMessage('Selecciona al menos una canción, artista o película.');
      return;
    }

    setLoading(true);
    setIsError(false);
    setStatusMessage(null);

    try {
      await rankingsService.submitDailyVote(
        {
          campusSlug: campus.slug,
          facultyId: selectedFaculty,
          song: song || undefined,
          songImageUrl,
          artist: artist || undefined,
          artistImageUrl,
          movie: movie || undefined,
          movieImageUrl,
        },
        currentUser
      );

      setStatusMessage('¡Voto registrado con éxito!');
      onVoteSubmitted();
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 900);
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err.message || 'Error al enviar voto.');
    } finally {
      setLoading(false);
    }
  };

  const hasAtLeastOneSelection = Boolean(song || artist || movie);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-[#0c1222]/95 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl text-white overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Registrar voto del día
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Puedes votar por una sola categoría o todas a la vez.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Selector de Facultad */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 tracking-wide uppercase mb-2">
              Facultad a representar
            </label>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {campus.faculties.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                  {f.name} ({f.shortName})
                </option>
              ))}
            </select>
          </div>

          {!currentUser ? (
            <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-center space-y-3">
              <div className="text-sm font-semibold text-white">
                Acceso institucional requerido
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Solo estudiantes con cuenta @{campus.allowedDomain} pueden participar en los rankings.
              </p>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 bg-white text-slate-950 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm shadow-md"
              >
                Continuar con Google (@{campus.allowedDomain})
              </button>
              {authService.isMockMode() && (
                <button
                  type="button"
                  onClick={handleSimulateLogin}
                  className="w-full py-2 px-3 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl text-xs transition-colors"
                >
                  [Demo Local] Simular cuenta @{campus.allowedDomain}
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Cuenta: {currentUser.email}</span>
                {todaySubmission && (
                  <span className="text-blue-400 font-medium">
                    ✓ Ya tienes registros hoy
                  </span>
                )}
              </div>

              {/* Categoría 1: Canción */}
              <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                <MediaSearchInput
                  label="Canción favorita de hoy"
                  type="song"
                  value={song}
                  imageUrl={songImageUrl}
                  onChange={(val, img) => {
                    setSong(val);
                    setSongImageUrl(img);
                  }}
                  placeholder="Buscar canción en Apple Music..."
                  disabled={loading}
                />
              </div>

              {/* Categoría 2: Artista */}
              <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                <MediaSearchInput
                  label="Artista del momento"
                  type="artist"
                  value={artist}
                  imageUrl={artistImageUrl}
                  onChange={(val, img) => {
                    setArtist(val);
                    setArtistImageUrl(img);
                  }}
                  placeholder="Buscar artista o banda..."
                  disabled={loading}
                />
              </div>

              {/* Categoría 3: Película */}
              <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                <MediaSearchInput
                  label="Película recomendada"
                  type="movie"
                  value={movie}
                  imageUrl={movieImageUrl}
                  onChange={(val, img) => {
                    setMovie(val);
                    setMovieImageUrl(img);
                  }}
                  placeholder="Buscar película en Apple TV / iTunes..."
                  disabled={loading}
                />
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    isError
                      ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                      : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
                  }`}
                >
                  {statusMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !hasAtLeastOneSelection}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 text-white"
              >
                {loading
                  ? 'Guardando voto...'
                  : hasAtLeastOneSelection
                  ? 'Guardar mi voto diario'
                  : 'Elige al menos 1 elemento'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
