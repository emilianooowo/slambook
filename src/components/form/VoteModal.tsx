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
      setStatusMessage('Conectando...');
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
      setStatusMessage('Elige al menos una categoría.');
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

      setStatusMessage('Voto guardado');
      onVoteSubmitted();
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 700);
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const hasAtLeastOneSelection = Boolean(song || artist || movie);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[2px]">
      <div
        className="relative w-full max-w-md bg-white border border-neutral-200 rounded-xl p-6 shadow-xl text-neutral-900 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
          <h2 className="text-base font-semibold text-neutral-900">
            Registrar voto del día
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 transition-colors text-sm px-1"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Selector de Facultad - Sin fondos ni bordes en labels */}
          <div>
            <span className="block text-xs font-medium text-neutral-700 mb-1.5">
              Facultad
            </span>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-[#8A4222]"
            >
              {campus.faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.shortName})
                </option>
              ))}
            </select>
          </div>

          {!currentUser ? (
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-center space-y-3">
              <p className="text-xs text-neutral-600">
                Se requiere correo institucional @{campus.allowedDomain}
              </p>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2 px-3 bg-[#8A4222] text-white font-medium rounded-lg hover:bg-[#72361b] transition-colors text-xs"
              >
                Continuar con Google (@{campus.allowedDomain})
              </button>
              {authService.isMockMode() && (
                <button
                  type="button"
                  onClick={handleSimulateLogin}
                  className="w-full py-1.5 px-3 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 rounded-lg text-xs transition-colors"
                >
                  [Demo] Simular sesión @{campus.allowedDomain}
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="text-xs text-neutral-500">
                Sesión: {currentUser.email}
              </div>

              <MediaSearchInput
                label="Canción favorita"
                type="song"
                value={song}
                imageUrl={songImageUrl}
                onChange={(val, img) => {
                  setSong(val);
                  setSongImageUrl(img);
                }}
                placeholder="Buscar..."
                disabled={loading}
              />

              <MediaSearchInput
                label="Artista favorito"
                type="artist"
                value={artist}
                imageUrl={artistImageUrl}
                onChange={(val, img) => {
                  setArtist(val);
                  setArtistImageUrl(img);
                }}
                placeholder="Buscar..."
                disabled={loading}
              />

              <MediaSearchInput
                label="Película favorita"
                type="movie"
                value={movie}
                imageUrl={movieImageUrl}
                onChange={(val, img) => {
                  setMovie(val);
                  setMovieImageUrl(img);
                }}
                placeholder="Buscar..."
                disabled={loading}
              />

              {statusMessage && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-medium ${
                    isError
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {statusMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !hasAtLeastOneSelection}
                className="w-full py-2.5 px-4 bg-[#8A4222] hover:bg-[#72361b] disabled:bg-neutral-200 disabled:text-neutral-400 font-medium rounded-lg text-xs text-white transition-colors"
              >
                {loading ? 'Guardando...' : 'Enviar voto'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
