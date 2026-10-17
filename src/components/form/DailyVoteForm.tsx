'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser, DailySubmission } from '@/types/slambook.types';
import { rankingsService } from '@/services/rankings.service';
import { authService } from '@/services/auth.service';
import MediaSearchInput from './MediaSearchInput';

interface DailyVoteFormProps {
  campusSlug: string;
  facultyId: string;
  facultyName: string;
  allowedDomain: string;
  onVoteSubmitted: () => void;
}

export default function DailyVoteForm({
  campusSlug,
  facultyId,
  facultyName,
  allowedDomain,
  onVoteSubmitted,
}: DailyVoteFormProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [todaySubmission, setTodaySubmission] = useState<DailySubmission | null>(null);
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [movie, setMovie] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // Cargar usuario y verificar voto diario
  const loadUserAndVote = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const submission = await rankingsService.getUserTodaySubmission(campusSlug, user.id);
        setTodaySubmission(submission);
      } else {
        setTodaySubmission(null);
      }
    } catch (e) {
      console.error('Error loading user/vote:', e);
    }
  };

  useEffect(() => {
    loadUserAndVote();
    const unsubscribe = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        rankingsService.getUserTodaySubmission(campusSlug, user.id).then(setTodaySubmission);
      } else {
        setTodaySubmission(null);
      }
    });
    return unsubscribe;
  }, [campusSlug]);

  const handleGoogleLogin = async () => {
    try {
      setIsError(false);
      setStatusMessage('Conectando...');
      await authService.signInWithGoogle(allowedDomain);
      await loadUserAndVote();
      setStatusMessage(null);
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err.message || 'Error al conectar con Google.');
    }
  };

  const handleSimulateLogin = () => {
    const mockEmail = `estudiante.${Math.floor(Math.random() * 900 + 100)}@${allowedDomain}`;
    authService.simulateMockLogin(mockEmail);
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setTodaySubmission(null);
    setSong('');
    setArtist('');
    setMovie('');
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!song || !artist || !movie) {
      setIsError(true);
      setStatusMessage('Completa los 3 campos seleccionando de la búsqueda.');
      return;
    }

    setLoading(true);
    setIsError(false);
    setStatusMessage(null);

    try {
      const result = await rankingsService.submitDailyVote(
        {
          campusSlug,
          facultyId,
          song,
          artist,
          movie,
        },
        currentUser
      );

      setTodaySubmission(result);
      setStatusMessage('VOTO REGISTRADO PARA HOY');
      onVoteSubmitted();
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err.message || 'Error al registrar el voto.');
    } finally {
      setLoading(false);
    }
  };

  const isMock = authService.isMockMode();

  return (
    <div className="border border-neutral-300 bg-white p-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-300">
        <span className="font-bold text-neutral-900 uppercase">
          VOTO DIARIO [{facultyName.toUpperCase()}]
        </span>
        {currentUser && (
          <button
            type="button"
            onClick={handleSignOut}
            className="text-[10px] text-neutral-500 hover:text-black uppercase underline"
          >
            [SALIR]
          </button>
        )}
      </div>

      {!currentUser ? (
        // Estado sin autenticación: solo botón Google institucional
        <div className="space-y-2 py-1">
          <div className="text-[11px] text-neutral-600">
            AUTENTICACIÓN REQUERIDA (@{allowedDomain})
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2 px-3 bg-neutral-900 text-white font-bold hover:bg-neutral-800 transition-none uppercase tracking-wide text-xs text-center border border-neutral-900"
          >
            ENTRAR CON GOOGLE ({allowedDomain})
          </button>

          {isMock && (
            <div className="pt-2 border-t border-neutral-200">
              <button
                type="button"
                onClick={handleSimulateLogin}
                className="w-full py-1.5 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 text-[11px] uppercase"
              >
                [MODO DEMO] SIMULAR SESIÓN @{allowedDomain}
              </button>
            </div>
          )}
        </div>
      ) : todaySubmission ? (
        // Estado: ya votó el día de hoy
        <div className="space-y-2">
          <div className="p-2 border border-neutral-900 bg-neutral-50 space-y-1">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
              ESTADO: VOTO ENVIADO HOY ({todaySubmission.submission_date})
            </div>
            <div className="text-[11px] text-neutral-900 font-bold truncate">
              CANCIÓN: <span className="font-normal">{todaySubmission.song}</span>
            </div>
            <div className="text-[11px] text-neutral-900 font-bold truncate">
              ARTISTA: <span className="font-normal">{todaySubmission.artist}</span>
            </div>
            <div className="text-[11px] text-neutral-900 font-bold truncate">
              PELÍCULA: <span className="font-normal">{todaySubmission.movie}</span>
            </div>
          </div>
          <div className="text-[10px] text-neutral-500">
            USUARIO: {currentUser.email}
          </div>
          <div className="text-[10px] text-neutral-400">
            Límite de 1 voto por día alcanzado. Podrás votar nuevamente mañana.
          </div>
        </div>
      ) : (
        // Estado: autenticado y listo para votar
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="text-[10px] text-neutral-500">
            SESIÓN: {currentUser.email}
          </div>

          <MediaSearchInput
            label="1. CANCIÓN DEL DÍA"
            type="song"
            value={song}
            onChange={setSong}
            placeholder="Escribe título o artista..."
            disabled={loading}
          />

          <MediaSearchInput
            label="2. ARTISTA DEL DÍA"
            type="artist"
            value={artist}
            onChange={setArtist}
            placeholder="Escribe el nombre del artista..."
            disabled={loading}
          />

          <MediaSearchInput
            label="3. PELÍCULA DEL DÍA"
            type="movie"
            value={movie}
            onChange={setMovie}
            placeholder="Escribe el título de la película..."
            disabled={loading}
          />

          {statusMessage && (
            <div
              className={`p-1.5 border text-[11px] ${
                isError
                  ? 'border-neutral-900 bg-neutral-100 text-neutral-900 font-bold'
                  : 'border-neutral-900 bg-neutral-900 text-white font-bold'
              }`}
            >
              {statusMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !song || !artist || !movie}
            className="w-full py-2 px-3 bg-neutral-900 text-white font-bold hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed transition-none uppercase tracking-wide text-xs border border-neutral-900"
          >
            {loading ? 'REGISTRANDO...' : 'ENVIAR VOTO (1 POR DÍA)'}
          </button>
        </form>
      )}
    </div>
  );
}
