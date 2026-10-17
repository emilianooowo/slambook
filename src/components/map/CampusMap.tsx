'use client';

import React, { useState } from 'react';
import {
  MAP_VIEWBOX,
  UNACH_FACULTIES_DATA,
  UNACH_ROAD_LABELS,
  UNACH_ROAD_PATHS,
} from './unach-map-data';

interface CampusMapProps {
  selectedFacultyId: string | null;
  onSelectFaculty: (facultyId: string) => void;
  campusSlug?: string;
  className?: string;
}

export default function CampusMap({
  selectedFacultyId,
  onSelectFaculty,
  className = '',
}: CampusMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const hoveredFaculty = UNACH_FACULTIES_DATA.find((f) => f.id === hoveredId);

  return (
    <div
      className={`relative w-full h-full flex flex-col bg-[#0b101d]/90 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl select-none ${className}`}
    >
      {/* Barra de título del mapa estilo macOS */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/30 backdrop-blur text-xs font-sans text-slate-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-400 font-medium">Plano Interactivo Campus I</span>
          <span className="text-slate-600">/</span>
          <span className="text-white font-semibold">
            {selectedFacultyId ? selectedFacultyId.toUpperCase() : 'Ninguna'}
          </span>
        </div>

        <div className="text-xs">
          {hoveredFaculty ? (
            <span className="text-blue-400 font-medium">{hoveredFaculty.name}</span>
          ) : (
            <span className="text-slate-500">Toca una facultad para explorar</span>
          )}
        </div>
      </div>

      {/* SVG del Mapa con Paleta Dark Blue de Apple */}
      <div className="relative flex-1 w-full h-full p-4 flex items-center justify-center overflow-hidden bg-[#070b14]">
        <svg
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          className="w-full h-full max-h-full object-contain"
          preserveAspectRatio="xMidYMid meet"
          role="region"
          aria-label="Plano de facultades Campus UNACH"
        >
          {/* Trazos viales */}
          <g id="roads" className="pointer-events-none">
            {UNACH_ROAD_PATHS.map((road) => (
              <path
                key={road.id}
                d={road.d}
                stroke={road.kind === 'major' ? '#1e293b' : '#0f172a'}
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
                fill="#475569"
                fontSize="11"
                fontFamily="-apple-system, system-ui, sans-serif"
                fontWeight="500"
                letterSpacing="0.08em"
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

              let fill = '#111827';
              let stroke = '#374151';
              let strokeWidth = 1.5;

              if (isSelected) {
                fill = '#0071e3'; // Azul Apple oficial
                stroke = '#ffffff';
                strokeWidth = 3;
              } else if (isHovered) {
                fill = '#1f293d';
                stroke = '#60a5fa';
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
                  className="cursor-pointer transition-all duration-200 outline-none"
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
                  fontFamily="-apple-system, system-ui, sans-serif"
                  fontSize="13"
                  fontWeight="700"
                  letterSpacing="0.02em"
                  fill={isSelected ? '#ffffff' : '#cbd5e1'}
                >
                  {faculty.shortName}
                </text>
              );
            })}
          </g>
        </svg>

        {/* Badge inferior estilo pill de Apple */}
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs text-slate-300 font-sans shadow-lg">
          Campus I · Tuxtla Gutiérrez
        </div>
      </div>
    </div>
  );
}
