'use client';

import { useState } from 'react';
import {
  FACULTIES_MAP_DATA,
  MAP_VIEWBOX,
  ROAD_LABELS,
  ROAD_PATHS,
} from './faculties-paths';
import styles from './UnachCampusMap.module.css';

interface UnachCampusMapProps {
  selectedFacultyId: string | null;
  onSelectFaculty: (id: string) => void;
  className?: string;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export default function UnachCampusMap({
  selectedFacultyId,
  onSelectFaculty,
  className,
}: UnachCampusMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const hovered = FACULTIES_MAP_DATA.find((f) => f.id === hoveredId) ?? null;

  return (
    <div className={cx(styles.root, className)}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="Mapa del Campus I de la UNACH"
      >
        {/* Calles de contexto */}
        <g>
          {ROAD_PATHS.map((road) => (
            <path
              key={road.id}
              d={road.d}
              strokeWidth={road.strokeWidth}
              className={cx(
                styles.road,
                road.kind === 'major' ? styles.roadMajor : styles.roadMinor,
              )}
            />
          ))}
          {ROAD_LABELS.map((label) => (
            <text
              key={label.id}
              x={label.x}
              y={label.y}
              transform={`rotate(${label.rotation} ${label.x} ${label.y})`}
              className={styles.roadLabel}
            >
              {label.text}
            </text>
          ))}
        </g>

        {/* Facultades interactivas */}
        <g>
          {FACULTIES_MAP_DATA.map((faculty) => {
            const isSelected = selectedFacultyId === faculty.id;
            return (
              <path
                key={faculty.id}
                d={faculty.svgPath}
                role="button"
                tabIndex={0}
                aria-label={faculty.name}
                aria-pressed={isSelected}
                className={cx(
                  styles.faculty,
                  isSelected && styles.facultySelected,
                )}
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
              />
            );
          })}
        </g>

        {/* Etiquetas (no capturan eventos) */}
        <g>
          {FACULTIES_MAP_DATA.map((faculty) => (
            <text
              key={faculty.id}
              x={faculty.labelCoords.x}
              y={faculty.labelCoords.y}
              className={cx(
                styles.label,
                selectedFacultyId === faculty.id && styles.labelSelected,
              )}
            >
              {faculty.shortName}
            </text>
          ))}
        </g>
      </svg>

      {/* Tooltip en HTML, posicionado en % para mantenerse responsivo */}
      {hovered && (
        <div
          className={styles.tooltip}
          role="tooltip"
          style={{
            left: `${(hovered.labelCoords.x / MAP_VIEWBOX.width) * 100}%`,
            top: `${((hovered.labelCoords.y - 12) / MAP_VIEWBOX.height) * 100}%`,
          }}
        >
          <span className={styles.tooltipName}>{hovered.name}</span>
          <span className={styles.tooltipHint}>Ver tendencias →</span>
        </div>
      )}
    </div>
  );
}
