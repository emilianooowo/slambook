import { CampusConfig } from '@/types/slambook.types';

export const unachTuxtlaConfig: CampusConfig = {
  slug: 'unach-tuxtla',
  universityId: 'unach',
  universityName: 'Universidad Autónoma de Chiapas',
  campusName: 'Campus I · Tuxtla Gutiérrez',
  name: 'UNACH · Campus I Tuxtla',
  shortName: 'UNACH Tuxtla',
  allowedDomain: 'unach.mx',
  defaultFacultyId: 'ingenieria',
  faculties: [
    {
      id: 'ingenieria',
      name: 'Facultad de Ingeniería',
      shortName: 'Ingeniería',
    },
    {
      id: 'arquitectura',
      name: 'Facultad de Arquitectura',
      shortName: 'Arquitectura',
    },
    {
      id: 'contaduria',
      name: 'Facultad de Contaduría y Administración',
      shortName: 'FCA',
    },
    {
      id: 'lenguas',
      name: 'Facultad de Lenguas Campus Tuxtla',
      shortName: 'Lenguas',
    },
    {
      id: 'biblioteca',
      name: 'Biblioteca Central Universitaria',
      shortName: 'Biblioteca',
    },
  ],
};
