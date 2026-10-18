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
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
} as const;

export type MapThemeMode = 'light' | 'dark';

export const MAP_COLORS: Record<MapThemeMode, MapThemeColors> = {
  light: {
    fill: '#F4F2EC',
    fillHover: '#E8E3D7',
    fillSelected: '#94421A', // Acento Sienna Bronce
    stroke: '#2D2823',
    strokeSelected: '#612509',
    text: '#1C1917',
    textSelected: '#FFFFFF',
    tooltipBg: '#1C1917',
    tooltipText: '#FFFFFF',
    tooltipMuted: '#D99676',
    extrusionColor: '#E2DDD0',
  },
  dark: {
    fill: '#1B1E24',
    fillHover: '#2A303C',
    fillSelected: '#C85D2C', // Acento para alto contraste en fondo oscuro
    stroke: '#E8E5DF',
    strokeSelected: '#FFB088',
    text: '#F5F5F4',
    textSelected: '#FFFFFF',
    tooltipBg: '#F5F5F4',
    tooltipText: '#0F1115',
    tooltipMuted: '#94421A',
    extrusionColor: '#242932',
  },
};

export const INITIAL_VIEW_STATE = {
  longitude: -93.1545,
  latitude: 16.7540,
  zoom: 16.6,
  pitch: 40,
  bearing: -10,
};

export const MAP_BOUNDS = {
  // Delimita el paneo para que no se aleje del Campus I [minLng, minLat, maxLng, maxLat]
  maxBounds: [-93.1670, 16.7450, -93.1420, 16.7630] as [number, number, number, number],
  minZoom: 14.5,
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
