'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, User, LogIn, Sun, Moon } from 'lucide-react';
import { getCampusBySlug } from '@/config/campuses';
import CampusMap from '@/components/map/CampusMap';
import FacultyPanel, { PanelTab } from '@/components/rankings/FacultyPanel';
import { authService } from '@/services/auth.service';
import { AuthUser } from '@/types/slambook.types';
import { useToast } from '@/components/common/Toast';

function AuthFeedbackWatcher({ allowedDomain }: { allowedDomain: string }) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  useEffect(() => {
    const authError = searchParams.get('auth_error');
    const authSuccess = searchParams.get('auth_success');
    const rejectedEmail = searchParams.get('rejected_email');

    if (authError) {
      if (authError === 'domain_not_allowed') {
        showToast(
          `Solo se permite acceso con correos institucionales (@${allowedDomain})${
            rejectedEmail ? ` — ${rejectedEmail}` : ''
          }`,
          'error'
        );
      } else {
        showToast(`Error de autenticación: ${authError}`, 'error');
      }
    } else if (authSuccess) {
      showToast('¡Bienvenido a Slambook! Sesión iniciada con éxito', 'success');
    }
  }, [searchParams, allowedDomain, showToast]);

  return null;
}

export default function CampusPage() {
  const params = useParams();
  const router = useRouter();
  const campusSlug = typeof params.campusSlug === 'string' ? params.campusSlug : '';
  const campus = getCampusBySlug(campusSlug);

  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(() => {
    return campus?.defaultFacultyId || 'ingenieria';
  });

  const [panelTab, setPanelTab] = useState<PanelTab>('faculty');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser);
    const unsub = authService.onAuthStateChange(setCurrentUser);
    return unsub;
  }, []);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('slambook-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('slambook-theme', 'light');
    }
  };

  if (!campus) {
    notFound();
  }

  const handleVoteSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSelectFacultyFromMap = (id: string) => {
    setSelectedFacultyId(id);
    setPanelTab('faculty');
  };

  const handleCampusChange = (newSlug: string) => {
    router.push(`/${newSlug}`);
  };

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-[#F5F4F0] dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 font-sans">
      <Suspense fallback={null}>
        <AuthFeedbackWatcher allowedDomain={campus.allowedDomain} />
      </Suspense>

      {/* Header Táctil Skeuomorphic Minimalista */}
      <header className="h-14 px-6 border-b border-neutral-300/80 dark:border-neutral-800 bg-white dark:bg-[#18181B] shadow-sm flex items-center justify-between select-none flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-base font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Slambook
          </span>
          <span className="text-neutral-300 dark:text-neutral-700 font-light">/</span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium hidden sm:inline">
            {campus.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternar tema Claro / Oscuro */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 border border-neutral-300/80 dark:border-neutral-700 bg-white dark:bg-[#27272A] hover:bg-[#FAF9F7] dark:hover:bg-[#323238] text-neutral-600 dark:text-neutral-300 rounded-xl text-xs shadow-skeuo-btn-neutral active:translate-y-[1px] transition-all"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Alternar tema"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#FB923C]" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-600" />
            )}
          </button>

          {/* Botón para buscar en rankings históricos */}
          <Link
            href="/rankings"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300/80 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-[#27272A] hover:bg-[#FAF9F7] dark:hover:bg-[#323238] text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold shadow-skeuo-btn-neutral active:translate-y-[1px] transition-all"
            title="Buscar posición de tus favoritos en el ranking"
          >
            <Search className="w-3.5 h-3.5 text-[#94421A] dark:text-[#FB923C]" />
            <span className="hidden sm:inline">Buscar en rankings</span>
          </Link>

          {/* Botón de voto que activa directamente la pestaña de votación en el panel */}
          <button
            type="button"
            onClick={() => setPanelTab('vote')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#94421A] hover:bg-[#7D3412] dark:bg-[#C85D2C] dark:hover:bg-[#B24E21] text-white rounded-xl text-xs font-semibold shadow-skeuo-btn active:translate-y-[1px] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Votar hoy</span>
          </button>

          {/* Acceso o Perfil de usuario (sin fotos de perfil, solo nombre y tipografía táctil) */}
          {currentUser ? (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#27272A] border border-neutral-300/90 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:text-[#94421A] dark:hover:text-[#FB923C] hover:border-[#94421A]/40 rounded-xl text-xs font-semibold shadow-skeuo-btn-neutral active:translate-y-[1px] transition-all"
              title={`Perfil: ${currentUser.username}`}
            >
              <User className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span className="max-w-[120px] truncate">{currentUser.username}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setPanelTab('vote')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#27272A] border border-neutral-300/80 dark:border-neutral-700 hover:bg-[#FAF9F7] dark:hover:bg-[#323238] text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold shadow-skeuo-btn-neutral active:translate-y-[1px] transition-all"
              title="Acceder con cuenta institucional"
            >
              <LogIn className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span className="hidden sm:inline">Acceder</span>
            </button>
          )}
        </div>
      </header>

      {/* Contenido Principal sobre fondo táctil #F5F4F0 / #121214 */}
      <div className="flex-1 flex flex-col md:flex-row p-3 md:p-4 gap-3 md:gap-4 overflow-hidden">
        {/* Panel del Mapa */}
        <section className="flex-1 h-full min-h-0 relative flex flex-col bg-white dark:bg-[#18181B] border border-neutral-300/80 dark:border-neutral-800 rounded-2xl shadow-skeuo-card overflow-hidden">
          <CampusMap
            selectedFacultyId={selectedFacultyId}
            onSelectFaculty={handleSelectFacultyFromMap}
            currentCampus={campus}
            onCampusChange={handleCampusChange}
            className="flex-1 h-full"
          />
        </section>

        {/* Panel Lateral Integrado de Rankings, Campus y Votación (Sin Modales) */}
        <aside className="w-full md:w-[380px] lg:w-[420px] h-full flex-shrink-0 flex flex-col overflow-hidden">
          <FacultyPanel
            key={`${selectedFacultyId}-${refreshKey}`}
            campus={campus}
            facultyId={selectedFacultyId}
            activeTab={panelTab}
            onTabChange={setPanelTab}
            onVoteSubmitted={handleVoteSuccess}
          />
        </aside>
      </div>
    </main>
  );
}
