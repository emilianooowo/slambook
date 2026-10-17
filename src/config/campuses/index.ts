import { CampusConfig } from '@/types/slambook.types';
import { unachTuxtlaConfig } from './unach-tuxtla';

export const unachTapachulaConfig: CampusConfig = {
  slug: 'unach-tapachula',
  universityId: 'unach',
  universityName: 'Universidad Autónoma de Chiapas',
  campusName: 'Campus IV · Tapachula',
  name: 'UNACH · Campus IV Tapachula',
  shortName: 'UNACH Tapachula',
  allowedDomain: 'unach.mx',
  defaultFacultyId: 'ciencias-quimicas',
  faculties: [
    {
      id: 'ciencias-quimicas',
      name: 'Facultad de Ciencias Químicas',
      shortName: 'Químicas',
    },
    {
      id: 'administracion',
      name: 'Facultad de Ciencias de la Administración',
      shortName: 'Administración',
    },
    {
      id: 'agronomia',
      name: 'Facultad de Ciencias Agrícolas',
      shortName: 'Agronomía',
    },
  ],
};

export const unamCUConfig: CampusConfig = {
  slug: 'unam-cu',
  universityId: 'unam',
  universityName: 'Universidad Nacional Autónoma de México',
  campusName: 'Ciudad Universitaria (CDMX)',
  name: 'UNAM · Ciudad Universitaria',
  shortName: 'UNAM CU',
  allowedDomain: 'unam.mx',
  defaultFacultyId: 'ingenieria',
  faculties: [
    {
      id: 'ingenieria',
      name: 'Facultad de Ingeniería',
      shortName: 'Ingeniería',
    },
    {
      id: 'ciencias',
      name: 'Facultad de Ciencias',
      shortName: 'Ciencias',
    },
    {
      id: 'medicina',
      name: 'Facultad de Medicina',
      shortName: 'Medicina',
    },
    {
      id: 'derecho',
      name: 'Facultad de Derecho',
      shortName: 'Derecho',
    },
  ],
};

export const CAMPUSES: Record<string, CampusConfig> = {
  'unach-tuxtla': unachTuxtlaConfig,
  'unach-tapachula': unachTapachulaConfig,
  'unam-cu': unamCUConfig,
};

export const DEFAULT_CAMPUS_SLUG = 'unach-tuxtla';

export interface UniversityOption {
  id: string;
  name: string;
}

export function getAllUniversities(): UniversityOption[] {
  const seen = new Set<string>();
  const list: UniversityOption[] = [];

  for (const campus of Object.values(CAMPUSES)) {
    if (!seen.has(campus.universityId)) {
      seen.add(campus.universityId);
      list.push({
        id: campus.universityId,
        name: campus.universityName,
      });
    }
  }

  return list;
}

export function getCampusesByUniversity(universityId: string): CampusConfig[] {
  return Object.values(CAMPUSES).filter((c) => c.universityId === universityId);
}

export function getCampusBySlug(slug: string): CampusConfig | null {
  return CAMPUSES[slug] ?? null;
}

export function getAllCampuses(): CampusConfig[] {
  return Object.values(CAMPUSES);
}
