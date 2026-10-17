import { CampusConfig } from '@/types/slambook.types';
import { unachTuxtlaConfig } from './unach-tuxtla';

export const CAMPUSES: Record<string, CampusConfig> = {
  'unach-tuxtla': unachTuxtlaConfig,
};

export const DEFAULT_CAMPUS_SLUG = 'unach-tuxtla';

export function getCampusBySlug(slug: string): CampusConfig | null {
  return CAMPUSES[slug] ?? null;
}

export function getAllCampuses(): CampusConfig[] {
  return Object.values(CAMPUSES);
}
