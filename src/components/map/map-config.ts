/**
 * Configuración del mapa interactivo de MapLibre GL para UNACH Campus I
 */

export interface MapThemeColors {
  fill: string;
  fillHover: string;
  fillSelected: string;
  stroke: string;
  strokeSelected: string;
  text: string;
  textSelected: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipMuted: string;
  extrusionColor: string;
}

export const MAP_STYLES = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
} as const;

export type MapThemeMode = 'light' | 'dark';

export const MAP_COLORS: Record<MapThemeMode, MapThemeColors> = {
  light: {
    fill: '#FFFFFF',
    fillHover: '#FAF3E8',
    fillSelected: '#94421A', // Acento Sienna Bronce
    stroke: '#78716C',
    strokeSelected: '#612509',
    text: '#1C1917',
    textSelected: '#FFFFFF',
    tooltipBg: '#1C1917',
    tooltipText: '#FFFFFF',
    tooltipMuted: '#D99676',
    extrusionColor: '#E2DDD0',
  },
  dark: {
    fill: '#1E293B',
    fillHover: '#334155',
    fillSelected: '#C85D2C', // Acento vibrante para fondo oscuro
    stroke: '#94A3B8',
    strokeSelected: '#FFA07A',
    text: '#F8FAFC',
    textSelected: '#FFFFFF',
    tooltipBg: '#18181B',
    tooltipText: '#F4F4F5',
    tooltipMuted: '#FB923C',
    extrusionColor: '#27272A',
  },
};

export const INITIAL_VIEW_STATE = {
  longitude: -93.1545,
  latitude: 16.7540,
  zoom: 16.4,
  pitch: 20,
  bearing: 0,
};

export const MAP_BOUNDS = {
  // Delimita el paneo holgado sobre Tuxtla Gutiérrez y Campus I [minLng, minLat, maxLng, maxLat]
  maxBounds: [-93.2000, 16.7200, -93.1100, 16.7900] as [number, number, number, number],
  minZoom: 13,
  maxZoom: 19,
};

export interface FacultyProperties {
  slug: string;
  name: string;
  shortName: string;
  center: [number, number];
  height?: number;
  approximate?: boolean;
}
