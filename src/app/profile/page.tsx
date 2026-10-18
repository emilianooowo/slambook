'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, ArrowLeft, Trash2, Check, AlertTriangle, User } from 'lucide-react';
import { AuthUser } from '@/types/slambook.types';
import { authService } from '@/services/auth.service';
import { DEFAULT_CAMPUS_SLUG } from '@/config/campuses';
import { isValidUsername, sanitizeInput, MAX_LENGTHS } from '@/lib/security';
import { useToast } from '@/components/common/Toast';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop&crop=faces',
];

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      setCurrentUser(user);
      if (user) {
        setUsername(user.username || user.email.split('@')[0]);
        setAvatarUrl(user.avatarUrl || PRESET_AVATARS[0]);
      }
    });
  }, []);

  // Procesa y comprime la foto subida localmente para mantener el rendimiento y no exceder límites
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen válido', 'error');
      return;
    }

    // Límite de tamaño de archivo original: 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen original no debe superar 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar a un avatar circular óptimo de 200x200
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
          showToast('Foto cargada correctamente', 'success');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const cleanUsername = sanitizeInput(username, MAX_LENGTHS.USERNAME);
    if (!cleanUsername || cleanUsername.length < 3) {
      showToast('El nombre de usuario debe tener al menos 3 caracteres', 'error');
      return;
    }

    if (!isValidUsername(cleanUsername)) {
      showToast('El usuario solo permite letras, números, puntos o guiones', 'error');
      return;
    }

    setLoading(true);

    try {
      await authService.updateProfile(currentUser.id, {
        username: cleanUsername,
        avatarUrl: avatarUrl || PRESET_AVATARS[0],
      });

      showToast('Perfil actualizado correctamente', 'success');
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              username: cleanUsername,
              avatarUrl: avatarUrl || PRESET_AVATARS[0],
            }
          : null
      );
    } catch (err: any) {
      showToast(err.message || 'Error al guardar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
    showToast('Sesión cerrada');
    router.push(`/${DEFAULT_CAMPUS_SLUG}`);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setIsDeleting(true);

    try {
      await authService.deleteAccount(currentUser.id);
      showToast('Tu cuenta y votos asociados han sido eliminados', 'info');
      setShowDeleteModal(false);
      setCurrentUser(null);
      router.push(`/${DEFAULT_CAMPUS_SLUG}`);
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar cuenta', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-neutral-900 font-sans flex flex-col">
      {/* Header minimalista sin fondos ni bordes en labels */}
      <header className="h-14 bg-white border-b border-neutral-200 px-6 flex items-center justify-between">
        <Link
          href={`/${DEFAULT_CAMPUS_SLUG}`}
          className="text-xs text-neutral-600 hover:text-[#8A4222] font-medium flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al campus</span>
        </Link>
        <span className="text-xs font-semibold text-neutral-900">
          Perfil de Estudiante
        </span>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6 animate-scale-in">
          {!currentUser ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto">
                <User className="w-6 h-6" />
              </div>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Inicia sesión con tu correo institucional para editar tu foto, nombre de usuario y administrar tu cuenta.
              </p>
              <Link
                href={`/${DEFAULT_CAMPUS_SLUG}`}
                className="inline-block py-2.5 px-5 bg-[#8A4222] text-white text-xs font-medium rounded-xl hover:bg-[#72361b] transition-colors"
              >
                Ir al campus
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Sección de Avatar con subida de archivo nativa */}
              <div className="flex flex-col items-center gap-2.5">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-100 bg-neutral-100 flex items-center justify-center shadow-sm">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar del estudiante"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-neutral-400">
                        {username[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>

                  {/* Botón flotante para seleccionar archivo desde el dispositivo */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-[#8A4222] hover:bg-[#72361b] text-white rounded-full shadow-md transition-transform hover:scale-105"
                    title="Subir foto desde tu dispositivo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#8A4222] hover:underline font-medium"
                  >
                    Subir foto desde dispositivo
                  </button>
                </div>
              </div>

              {/* Selector de avatares predeterminados */}
              <div>
                <span className="block text-xs font-medium text-neutral-700 mb-2">
                  O elige un avatar rápido
                </span>
                <div className="flex gap-2.5 justify-center">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                        avatarUrl === url
                          ? 'border-[#8A4222] scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      title={`Avatar ${idx + 1}`}
                    >
                      <img
                        src={url}
                        alt={`Preset ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre de usuario (sin fondos ni bordes en labels) */}
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
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#8A4222] transition-colors"
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
                  className="w-full px-3.5 py-2.5 bg-neutral-100/70 border border-neutral-200 rounded-xl text-xs text-neutral-500 cursor-not-allowed select-none"
                />
              </div>

              {/* Acciones principales */}
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#8A4222] hover:bg-[#72361b] disabled:bg-neutral-300 text-white font-medium rounded-xl text-xs transition-colors shadow-sm"
                >
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2.5 px-3 border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl text-xs font-medium transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>

              {/* Zona de peligro: Eliminar cuenta */}
              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">
                  ¿Deseas dar de baja tu perfil?
                </span>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar cuenta</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Modal de confirmación para eliminar cuenta */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-modal border border-neutral-100 p-6 space-y-4 animate-scale-in">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-semibold text-neutral-900">
                ¿Eliminar cuenta permanentemente?
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Esta acción es irreversible. Se eliminará tu perfil y todos los votos que hayas registrado en los rankings universitarios.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-3 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium transition-colors"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
