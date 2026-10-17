'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthUser } from '@/types/slambook.types';
import { authService } from '@/services/auth.service';
import { DEFAULT_CAMPUS_SLUG } from '@/config/campuses';
import { isValidUsername, sanitizeInput, sanitizeImageUrl, MAX_LENGTHS } from '@/lib/security';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop&crop=faces',
];

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      setCurrentUser(user);
      if (user) {
        setUsername(user.username || user.email.split('@')[0]);
        setAvatarUrl(user.avatarUrl || PRESET_AVATARS[0]);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const cleanUsername = sanitizeInput(username, MAX_LENGTHS.USERNAME);
    if (!cleanUsername || cleanUsername.length < 3) {
      setIsError(true);
      setStatusMessage('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (!isValidUsername(cleanUsername)) {
      setIsError(true);
      setStatusMessage('El nombre de usuario solo puede tener letras, números, puntos o guiones.');
      return;
    }

    const cleanAvatar = sanitizeImageUrl(avatarUrl) || PRESET_AVATARS[0];

    setLoading(true);
    setIsError(false);
    setStatusMessage(null);

    try {
      await authService.updateProfile(currentUser.id, {
        username: cleanUsername,
        avatarUrl: cleanAvatar,
      });

      setStatusMessage('Perfil actualizado correctamente');
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              username: cleanUsername,
              avatarUrl: cleanAvatar,
            }
          : null
      );
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err.message || 'Error al guardar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-neutral-900 font-sans flex flex-col">
      {/* Header minimalista blanco */}
      <header className="h-14 bg-white border-b border-neutral-200 px-6 flex items-center justify-between">
        <Link
          href={`/${DEFAULT_CAMPUS_SLUG}`}
          className="text-xs text-neutral-600 hover:text-[#8A4222] font-medium flex items-center gap-1.5 transition-colors"
        >
          <span>←</span>
          <span>Volver al campus</span>
        </Link>
        <span className="text-xs font-semibold text-neutral-900">
          Perfil de Estudiante
        </span>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-5">
          {!currentUser ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-neutral-500">
                Inicia sesión con tu correo institucional para editar tu perfil.
              </p>
              <Link
                href={`/${DEFAULT_CAMPUS_SLUG}`}
                className="inline-block py-2 px-4 bg-[#8A4222] text-white text-xs font-medium rounded-lg hover:bg-[#72361b] transition-colors"
              >
                Ir a inicio y acceder
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Vista previa de avatar */}
              <div className="flex flex-col items-center gap-2 pb-2">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover border border-neutral-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 font-bold text-xl">
                      {username[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-neutral-400">
                  Foto de perfil
                </span>
              </div>

              {/* Selector de avatares predeterminados */}
              <div>
                <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Elige una foto rápida
                </span>
                <div className="flex gap-2 justify-center">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                        avatarUrl === url ? 'border-[#8A4222]' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Preset ${idx}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* URL de foto personalizada */}
              <div>
                <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                  O pega el enlace de tu foto (HTTPS)
                </span>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  maxLength={MAX_LENGTHS.URL}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#8A4222]"
                />
              </div>

              {/* Nombre de usuario */}
              <div>
                <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Nombre de usuario
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={MAX_LENGTHS.USERNAME}
                  placeholder="ej. carlos_m"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#8A4222]"
                />
              </div>

              {/* Correo institucional (lectura) */}
              <div>
                <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Correo institucional
                </span>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-xs text-neutral-500 cursor-not-allowed"
                />
              </div>

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

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#8A4222] hover:bg-[#72361b] disabled:bg-neutral-300 text-white font-medium rounded-lg text-xs transition-colors"
                >
                  {loading ? 'Guardando...' : 'Guardar perfil'}
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2 px-3 border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg text-xs transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
