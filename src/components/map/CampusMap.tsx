'use client';

import React from 'react';
import UnachCampusMap from './UnachCampusMap';
import {
  getAllUniversities,
  getCampusesByUniversity,
} from '@/config/campuses';
import { CampusConfig } from '@/types/slambook.types';

export interface CampusMapProps {
  selectedFacultyId: string | null;
  onSelectFaculty: (facultyId: string) => void;
  currentCampus: CampusConfig;
  onCampusChange: (newSlug: string) => void;
  className?: string;
}

export default function CampusMap({
  selectedFacultyId,
  onSelectFaculty,
  currentCampus,
  onCampusChange,
  className = '',
}: CampusMapProps) {
  const universities = getAllUniversities();
  const campusesForCurrentUni = getCampusesByUniversity(currentCampus.universityId);

  const handleUniversitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uniId = e.target.value;
    const campuses = getCampusesByUniversity(uniId);
    if (campuses.length > 0) {
      onCampusChange(campuses[0].slug);
    }
  };

  const handleCampusSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCampusChange(e.target.value);
  };

  return (
    <div className={`relative w-full h-full flex flex-col bg-white overflow-hidden ${className}`}>
      {/* Contenedor del Mapa MapLibre GL interactivo */}
      <div className="flex-1 w-full h-full min-h-0 relative">
        <UnachCampusMap
          selectedFacultyId={selectedFacultyId}
          onSelectFaculty={onSelectFaculty}
          className="w-full h-full"
        />
      </div>

      {/* Selectores de Universidad y Campus en la parte inferior */}
      <footer className="px-4 py-2.5 border-t border-neutral-200/80 bg-white flex flex-wrap items-center gap-4 text-xs select-none flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Label sin fondo ni bordeado */}
          <span className="text-neutral-600 font-semibold whitespace-nowrap">
            Universidad:
          </span>
          <select
            value={currentCampus.universityId}
            onChange={handleUniversitySelect}
            className="px-2.5 py-1.5 bg-[#F9F8F6] border border-neutral-300 rounded-xl text-neutral-800 text-xs shadow-skeuo-inset focus:outline-none focus:border-[#94421A]"
          >
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Label sin fondo ni bordeado */}
          <span className="text-neutral-600 font-semibold whitespace-nowrap">
            Campus:
          </span>
          <select
            value={currentCampus.slug}
            onChange={handleCampusSelect}
            className="px-2.5 py-1.5 bg-[#F9F8F6] border border-neutral-300 rounded-xl text-neutral-800 text-xs shadow-skeuo-inset focus:outline-none focus:border-[#94421A]"
          >
            {campusesForCurrentUni.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.campusName}
              </option>
            ))}
          </select>
        </div>
      </footer>
    </div>
  );
}

export { UnachCampusMap };
