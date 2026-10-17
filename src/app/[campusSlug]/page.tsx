'use client';

import React, { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getCampusBySlug } from '@/config/campuses';
import CampusMap from '@/components/map/CampusMap';
import FacultyPanel from '@/components/rankings/FacultyPanel';
import VoteModal from '@/components/form/VoteModal';

export default function CampusPage() {
  const params = useParams();
  const campusSlug = typeof params.campusSlug === 'string' ? params.campusSlug : '';
  const campus = getCampusBySlug(campusSlug);

  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(() => {
    return campus?.defaultFacultyId || 'ingenieria';
  });

  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!campus) {
    notFound();
  }

  const handleVoteSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-[#070b14] text-white">
      {/* Header estilo Apple */}
      <header className="h-16 px-6 border-b border-white/10 bg-[#0b101d]/70 backdrop-blur-xl flex items-center justify-between select-none flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500/50" />
            <span className="text-base font-bold tracking-tight text-white">
              Slambook
            </span>
          </div>
          <span className="text-white/20">|</span>
          <span className="text-xs font-medium text-slate-300 hidden sm:inline">
            {campus.name}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono hidden md:inline">
            @{campus.allowedDomain}
          </span>
        </div>

        {/* Botón destacado en el Header para votar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsVoteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <span>+</span>
            <span>Registrar Voto</span>
          </button>
        </div>
      </header>

      {/* Área Principal con Bordes Redondeados y Fondo Negro-Azul */}
      <div className="flex-1 flex flex-col md:flex-row p-4 md:p-6 gap-5 overflow-hidden">
        {/* Tarjeta del Mapa SVG */}
        <section className="flex-1 h-full min-h-0 relative flex flex-col">
          <CampusMap
            selectedFacultyId={selectedFacultyId}
            onSelectFaculty={(id) => setSelectedFacultyId(id)}
            campusSlug={campus.slug}
            className="flex-1 h-full"
          />
        </section>

        {/* Tarjeta del Panel de Rankings */}
        <aside className="w-full md:w-[420px] lg:w-[480px] h-full flex-shrink-0 flex flex-col overflow-hidden">
          <FacultyPanel
            key={`${selectedFacultyId}-${refreshKey}`}
            campus={campus}
            facultyId={selectedFacultyId}
          />
        </aside>
      </div>

      {/* Modal de Voto */}
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
