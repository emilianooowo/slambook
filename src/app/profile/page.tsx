'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, User, LogIn, Check } from 'lucide-react';
import { AuthUser } from '@/types/slambook.types';
import { authService } from '@/services/auth.service';
import { DEFAULT_CAMPUS_SLUG, getCampusBySlug } from '@/config/campuses';
import { isValidUsername, sanitizeInput, MAX_LENGTHS } from '@/lib/security';
import { useToast } from '@/components/common/Toast';

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const campus = getCampusBySlug(DEFAULT_CAMPUS_SLUG);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Campos para probar la creación de una cuenta
  const [testEmail, setTestEmail] = useState('');
  const [testUsername, setTestUsername] = useState('');

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      setCurrentUser(user);
      if (user) {
        setUsername(user.username || user.email.split('@')[0]);
      }
    });
  }, []);

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
      });

      showToast('Perfil actualizado correctamente', 'success');
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              username: cleanUsername,
            }
          : null
      );
    } catch (err: any) {
      showToast(err.message || 'Error al guardar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const domain = campus?.allowedDomain || 'unach.mx';
    const emailToUse = testEmail.trim()
      ? testEmail.includes('@')
        ? testEmail.trim()
        : `${testEmail.trim()}@${domain}`
      : `estudiante.${Math.floor(Math.random() * 899 + 100)}@${domain}`;

    try {
      const newUser = authService.createTestAccount(emailToUse, testUsername.trim() || undefined);
      setCurrentUser(newUser);
      setUsername(newUser.username || '');
      setTestEmail('');
      setTestUsername('');
      showToast(`¡Cuenta de prueba creada! Sesión iniciada como: ${newUser.username}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al crear cuenta', 'error');
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
      setShowConfirmDelete(false);
      setCurrentUser(null);
      router.push(`/${DEFAULT_CAMPUS_SLUG}`);
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar cuenta', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-neutral-900 font-sans flex flex-col">
      {/* Header minimalista skeuomorphic */}
      <header className="h-14 bg-white border-b border-neutral-300/80 px-6 flex items-center justify-between shadow-sm select-none">
        <Link
          href={`/${DEFAULT_CAMPUS_SLUG}`}
          className="text-xs text-neutral-700 hover:text-[#94421A] font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#94421A]" />
          <span>Volver al campus</span>
        </Link>
        <span className="text-xs font-bold text-neutral-900">
          Cuenta de Estudiante
        </span>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-neutral-300/90 rounded-2xl p-6 shadow-skeuo-card space-y-6 animate-scale-in">
          {!currentUser ? (
            /* Sección cuando no hay sesión iniciada: Explicación y Creación Rápida de Cuenta */
            <div className="space-y-5">
              <div className="text-center space-y-1.5">
                <div className="w-11 h-11 rounded-2xl bg-[#EDEAE4] text-neutral-700 flex items-center justify-center mx-auto shadow-skeuo-pill">
                  <User className="w-5 h-5" />
                </div>
                <h1 className="text-sm font-bold text-neutral-900">
                  Acceso a Slambook
                </h1>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Inicia sesión con tu correo institucional (@{campus?.allowedDomain || 'unach.mx'}) para votar y personalizar tu cuenta.
                </p>
              </div>

              {/* Botón oficial de Google OAuth */}
              <button
                type="button"
                onClick={() => authService.signInWithGoogle(campus?.allowedDomain || 'unach.mx')}
                className="w-full py-2.5 px-3 bg-[#94421A] hover:bg-[#7D3412] text-white text-xs font-semibold rounded-xl shadow-skeuo-btn active:translate-y-[1px] flex items-center justify-center gap-2 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Iniciar con Google (@{campus?.allowedDomain || 'unach.mx'})</span>
              </button>

              {/* Formulario para Probar la Creación de Cuenta (Mock / Local Demo) */}
              <div className="pt-3 border-t border-neutral-200/80 space-y-3">
                <span className="block text-xs font-bold text-neutral-800">
                  ¿Cómo probar la creación de una cuenta?
                </span>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Ingresa cualquier correo institucional simulado (o deja vacío para generar uno aleatorio) y pruébalo al instante:
                </p>

                <form onSubmit={handleCreateTestAccount} className="space-y-2.5">
                  <input
                    type="text"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder={`ej. carlos.mendez@${campus?.allowedDomain || 'unach.mx'}`}
                    className="w-full px-3 py-2 bg-[#F9F8F6] border border-neutral-300 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 shadow-skeuo-inset focus:outline-none focus:border-[#94421A]"
                  />
                  <input
                    type="text"
                    value={testUsername}
                    onChange={(e) => setTestUsername(e.target.value)}
                    placeholder="Nombre de usuario (ej. carlos_m)"
                    className="w-full px-3 py-2 bg-[#F9F8F6] border border-neutral-300 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 shadow-skeuo-inset focus:outline-none focus:border-[#94421A]"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 px-3 bg-white hover:bg-[#FAF9F7] border border-neutral-300 text-neutral-800 text-xs font-semibold rounded-xl shadow-skeuo-btn-neutral active:translate-y-[1px] transition-all"
                  >
                    Crear cuenta y entrar
                  </button>
                </form>

                {/* Accesos rápidos con un clic */}
                <div className="pt-1 flex flex-wrap gap-1.5">
                  {[
                    `estudiante@${campus?.allowedDomain || 'unach.mx'}`,
                    `mariana.ing@${campus?.allowedDomain || 'unach.mx'}`,
                    `diego.quim@${campus?.allowedDomain || 'unach.mx'}`,
                  ].map((emailSample) => (
                    <button
                      key={emailSample}
                      type="button"
                      onClick={() => {
                        const user = authService.createTestAccount(emailSample);
                        setCurrentUser(user);
                        setUsername(user.username || '');
                        showToast(`Sesión de prueba: ${emailSample}`, 'info');
                      }}
                      className="text-[11px] py-1 px-2.5 bg-white border border-neutral-300/80 rounded-lg text-neutral-700 hover:text-neutral-900 hover:border-neutral-400 shadow-sm transition-all"
                    >
                      {emailSample.split('@')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Sección cuando el usuario tiene sesión activa */
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-neutral-200/80">
                <div className="w-10 h-10 rounded-xl bg-[#EDEAE4] text-neutral-800 font-extrabold flex items-center justify-center text-sm shadow-skeuo-pill flex-shrink-0">
                  {username[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-neutral-900 truncate">
                    {username}
                  </h2>
                  <span className="text-[11px] text-neutral-500 truncate block">
                    {currentUser.email}
                  </span>
                </div>
              </div>

              {/* Nombre de usuario (sin fondos ni bordes en labels) */}
              <div>
                <span className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  Nombre de usuario
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={MAX_LENGTHS.USERNAME}
                  placeholder="ej. carlos_m"
                  className="w-full px-3.5 py-2.5 bg-[#F9F8F6] border border-neutral-300 rounded-xl text-xs text-neutral-900 shadow-skeuo-inset focus:outline-none focus:border-[#94421A] transition-colors"
                />
              </div>

              {/* Correo institucional (lectura) */}
              <div>
                <span className="block text-xs font-semibold text-neutral-800 mb-1.5">
                  Correo institucional
                </span>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs text-neutral-500 cursor-not-allowed select-none"
                />
              </div>

              {/* Acciones principales */}
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#94421A] hover:bg-[#7D3412] disabled:bg-neutral-300 text-white font-semibold rounded-xl text-xs shadow-skeuo-btn active:translate-y-[1px] transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{loading ? 'Guardando...' : 'Guardar nombre'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2.5 px-3 bg-white border border-neutral-300 text-neutral-700 hover:text-neutral-900 hover:bg-[#FAF9F7] rounded-xl text-xs font-semibold shadow-skeuo-btn-neutral active:translate-y-[1px] transition-all"
                >
                  Cerrar sesión
                </button>
              </div>

              {/* Switcher / Crear otra cuenta para pruebas sin salir de la página */}
              <div className="pt-3 border-t border-neutral-200/80 space-y-2">
                <span className="block text-[11px] font-semibold text-neutral-600">
                  Probar con otra cuenta de estudiante:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    `estudiante@${campus?.allowedDomain || 'unach.mx'}`,
                    `carlos.ing@${campus?.allowedDomain || 'unach.mx'}`,
                    `laura.med@${campus?.allowedDomain || 'unach.mx'}`,
                  ].map((emailSample) => (
                    <button
                      key={emailSample}
                      type="button"
                      onClick={() => {
                        const user = authService.createTestAccount(emailSample);
                        setCurrentUser(user);
                        setUsername(user.username || '');
                        showToast(`Cambiado a sesión: ${emailSample}`, 'info');
                      }}
                      className="text-[11px] py-1 px-2.5 bg-white border border-neutral-300/80 rounded-lg text-neutral-700 hover:text-neutral-900 hover:border-neutral-400 shadow-sm transition-all"
                    >
                      {emailSample.split('@')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zona de peligro: Eliminar cuenta (Confirmación inline sin modales) */}
              <div className="pt-3 border-t border-neutral-200/80 space-y-3">
                {!showConfirmDelete ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500">
                      Dar de baja cuenta y votos
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(true)}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar cuenta</span>
                    </button>
                  </div>
                ) : (
                  /* Confirmación inline sin modales */
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2 animate-fade-in">
                    <p className="text-xs text-rose-800 font-semibold">
                      ¿Confirmas eliminar tu cuenta permanentemente?
                    </p>
                    <p className="text-[11px] text-rose-600 leading-relaxed">
                      Se borrará tu perfil y todos los votos que hayas emitido en el campus.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowConfirmDelete(false)}
                        disabled={isDeleting}
                        className="flex-1 py-1.5 px-2.5 bg-white border border-neutral-300 text-neutral-700 text-xs font-semibold rounded-lg shadow-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="flex-1 py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
