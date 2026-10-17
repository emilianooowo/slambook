'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { getCampusBySlug } from '@/config/campuses';
import CampusMap from '@/components/map/CampusMap';
import FacultyPanel from '@/components/rankings/FacultyPanel';
import VoteModal from '@/components/form/VoteModal';
import { authService } from '@/services/auth.service';
import { AuthUser } from '@/types/slambook.types';

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
      {/* Header minimalista blanco #ffffff */}
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

        <div className="flex items-center gap-3">
          {/* Botón de voto en el Header con acento cobrizo casi oscuro */}
          <button
            type="button"
            onClick={() => setIsVoteModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#8A4222] hover:bg-[#72361b] text-white rounded-lg text-xs font-medium transition-colors"
          >
            + Votar hoy
          </button>

          {/* Ícono de perfil que redirige a /profile */}
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full border border-neutral-200 bg-neutral-100 flex items-center justify-center text-neutral-600 hover:border-[#8A4222] hover:text-[#8A4222] transition-colors overflow-hidden"
            title="Ver perfil de usuario"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt="Perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </Link>
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
