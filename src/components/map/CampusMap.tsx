'use client';

import React, { useState } from 'react';
import {
  MAP_VIEWBOX,
  UNACH_FACULTIES_DATA,
  UNACH_ROAD_LABELS,
  UNACH_ROAD_PATHS,
} from './unach-map-data';
import {
  getAllUniversities,
  getCampusesByUniversity,
} from '@/config/campuses';
import { CampusConfig } from '@/types/slambook.types';

interface CampusMapProps {
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const hoveredFaculty = UNACH_FACULTIES_DATA.find((f) => f.id === hoveredId);

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
    <div
      className={`relative w-full h-full flex flex-col bg-white border border-neutral-200 rounded-xl overflow-hidden select-none ${className}`}
    >
      {/* Barra superior de estado sin bordes ni fondos en labels */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 bg-white text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-900">{currentCampus.shortName}</span>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-500">
            {selectedFacultyId ? selectedFacultyId.toUpperCase() : 'Ninguna seleccionada'}
          </span>
        </div>
        <div className="text-xs text-neutral-400">
          {hoveredFaculty ? hoveredFaculty.name : 'Haz clic en una facultad'}
        </div>
      </div>

      {/* SVG del Mapa en estilo claro minimalista */}
      <div className="relative flex-1 w-full h-full p-4 flex items-center justify-center overflow-hidden bg-[#fafafa]">
        <svg
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          className="w-full h-full max-h-full object-contain"
          preserveAspectRatio="xMidYMid meet"
          role="region"
          aria-label="Plano de facultades"
        >
          {/* Calles */}
          <g id="roads" className="pointer-events-none">
            {UNACH_ROAD_PATHS.map((road) => (
              <path
                key={road.id}
                d={road.d}
                stroke={road.kind === 'major' ? '#e2e8f0' : '#edf2f7'}
                strokeWidth={road.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {UNACH_ROAD_LABELS.map((label) => (
              <text
                key={label.id}
                x={label.x}
                y={label.y}
                transform={`rotate(${label.rotation} ${label.x} ${label.y})`}
                fill="#94a3b8"
                fontSize="11"
                fontFamily="system-ui, sans-serif"
                fontWeight="500"
                letterSpacing="0.06em"
                textAnchor="middle"
              >
                {label.text}
              </text>
            ))}
          </g>

          {/* Polígonos de Facultades */}
          <g id="faculties">
            {UNACH_FACULTIES_DATA.map((faculty) => {
              const isSelected = selectedFacultyId === faculty.id;
              const isHovered = hoveredId === faculty.id;

              let fill = '#ffffff';
              let stroke = '#cbd5e1';
              let strokeWidth = 1.5;

              if (isSelected) {
                fill = '#8A4222'; // Acento cobrizo casi oscuro
                stroke = '#6b3319';
                strokeWidth = 2.5;
              } else if (isHovered) {
                fill = '#f8fafc';
                stroke = '#8A4222';
                strokeWidth = 2;
              }

              return (
                <path
                  key={faculty.id}
                  id={`faculty-${faculty.id}`}
                  d={faculty.svgPath}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={faculty.name}
                  onClick={() => onSelectFaculty(faculty.id)}
                  onMouseEnter={() => setHoveredId(faculty.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(faculty.id)}
                  onBlur={() => setHoveredId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectFaculty(faculty.id);
                    }
                  }}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  className="cursor-pointer transition-colors duration-150 outline-none"
                />
              );
            })}
          </g>

          {/* Rótulos de Facultades */}
          <g id="labels" className="pointer-events-none select-none">
            {UNACH_FACULTIES_DATA.map((faculty) => {
              const isSelected = selectedFacultyId === faculty.id;
              return (
                <text
                  key={`label-${faculty.id}`}
                  x={faculty.labelCoords.x}
                  y={faculty.labelCoords.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="system-ui, sans-serif"
                  fontSize="13"
                  fontWeight="600"
                  fill={isSelected ? '#ffffff' : '#334155'}
                >
                  {faculty.shortName}
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Selectores de Universidad y Campus en la parte inferior */}
      <footer className="px-4 py-3 border-t border-neutral-100 bg-white flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          {/* Label sin fondo ni bordeado */}
          <span className="text-neutral-500 font-medium whitespace-nowrap">
            Universidad:
          </span>
          <select
            value={currentCampus.universityId}
            onChange={handleUniversitySelect}
            className="px-2.5 py-1.5 bg-white border border-neutral-200 rounded-md text-neutral-800 text-xs focus:outline-none focus:border-[#8A4222]"
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
          <span className="text-neutral-500 font-medium whitespace-nowrap">
            Campus:
          </span>
          <select
            value={currentCampus.slug}
            onChange={handleCampusSelect}
            className="px-2.5 py-1.5 bg-white border border-neutral-200 rounded-md text-neutral-800 text-xs focus:outline-none focus:border-[#8A4222]"
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
