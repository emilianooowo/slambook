'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, User, LogIn } from 'lucide-react';
import { getCampusBySlug } from '@/config/campuses';
import CampusMap from '@/components/map/CampusMap';
import FacultyPanel from '@/components/rankings/FacultyPanel';
import VoteModal from '@/components/form/VoteModal';
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

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    authService.getCurrentUser().then(setCurrentUser);
    const unsub = authService.onAuthStateChange(setCurrentUser);
    return unsub;
  }, []);

  if (!campus) {
    notFound();
  }

  const handleVoteSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleCampusChange = (newSlug: string) => {
    router.push(`/${newSlug}`);
  };

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-[#f9f9f9] text-neutral-900 font-sans">
      <Suspense fallback={null}>
        <AuthFeedbackWatcher allowedDomain={campus.allowedDomain} />
      </Suspense>

      {/* Header minimalista blanco */}
      <header className="h-14 px-6 border-b border-neutral-200 bg-white flex items-center justify-between select-none flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <span className="text-base font-semibold tracking-tight text-neutral-900">
            Slambook
          </span>
          <span className="text-neutral-300">/</span>
          <span className="text-xs text-neutral-500 font-normal hidden sm:inline">
            {campus.name}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Botón para buscar en rankings históricos */}
          <Link
            href="/rankings"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-medium transition-colors"
            title="Buscar posición de tus favoritos en el ranking"
          >
            <Search className="w-3.5 h-3.5 text-[#8A4222]" />
            <span className="hidden sm:inline">Buscar en rankings</span>
          </Link>

          {/* Botón de voto en el Header con acento cobrizo oscuro */}
          <button
            type="button"
            onClick={() => setIsVoteModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8A4222] hover:bg-[#72361b] text-white rounded-xl text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Votar hoy</span>
          </button>

          {/* Acceso o Perfil de usuario */}
          {currentUser ? (
            <Link
              href="/profile"
              className="w-8 h-8 rounded-full border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-600 hover:border-[#8A4222] transition-colors overflow-hidden flex-shrink-0 shadow-sm"
              title={`Perfil: ${currentUser.username || currentUser.email}`}
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-bold text-neutral-700">
                  {(currentUser.username || currentUser.email)[0]?.toUpperCase()}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:bg-neutral-50 rounded-xl font-medium transition-colors"
              title="Acceder con cuenta institucional"
            >
              <LogIn className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Acceder</span>
            </Link>
          )}
        </div>
      </header>

      {/* Contenido Principal sobre fondo #f9f9f9 con paneles en #ffffff */}
      <div className="flex-1 flex flex-col md:flex-row p-4 md:p-5 gap-4 overflow-hidden">
        {/* Panel del Mapa */}
        <section className="flex-1 h-full min-h-0 relative flex flex-col">
          <CampusMap
            selectedFacultyId={selectedFacultyId}
            onSelectFaculty={(id) => setSelectedFacultyId(id)}
            currentCampus={campus}
            onCampusChange={handleCampusChange}
            className="flex-1 h-full"
          />
        </section>

        {/* Panel Lateral de Rankings y Coincidencias */}
        <aside className="w-full md:w-[400px] lg:w-[440px] h-full flex-shrink-0 flex flex-col overflow-hidden">
          <FacultyPanel
            key={`${selectedFacultyId}-${refreshKey}`}
            campus={campus}
            facultyId={selectedFacultyId}
          />
        </aside>
      </div>

      {/* Modal Minimalista de Voto */}
      <VoteModal
        isOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        campus={campus}
        initialFacultyId={selectedFacultyId}
        onVoteSubmitted={handleVoteSuccess}
      />
    </main>
  );
}
