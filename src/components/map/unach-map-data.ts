export const MAP_VIEWBOX = { width: 1200, height: 800 } as const;

export interface FacultyMapItem {
  id: string;
  name: string;
  shortName: string;
  svgPath: string;
  labelCoords: { x: number; y: number };
}

export interface RoadPath {
  id: string;
  d: string;
  kind: 'major' | 'minor';
  strokeWidth: number;
}

export interface RoadLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  rotation: number;
}

export const UNACH_FACULTIES_DATA: FacultyMapItem[] = [
  {
    id: 'ingenieria',
    name: 'Facultad de Ingeniería',
    shortName: 'Ingeniería',
    svgPath: 'M623 123 L988 145 L988 322 L870 303 L648 268 Z',
    labelCoords: { x: 770, y: 212 },
  },
  {
    id: 'arquitectura',
    name: 'Facultad de Arquitectura',
    shortName: 'Arquitectura',
    svgPath: 'M962 350 L1118 357 L1124 450 L1030 494 L968 478 Z',
    labelCoords: { x: 1040, y: 420 },
  },
  {
    id: 'contaduria',
    name: 'Facultad de Contaduría y Administración',
    shortName: 'FCA',
    svgPath: 'M1090 485 L1190 480 L1190 770 L1068 770 L1062 560 Z',
    labelCoords: { x: 1130, y: 625 },
  },
  {
    id: 'lenguas',
    name: 'Facultad de Lenguas Campus Tuxtla',
    shortName: 'Lenguas',
    svgPath: 'M40 520 L200 520 L200 610 L40 610 Z',
    labelCoords: { x: 120, y: 565 },
  },
  {
    id: 'biblioteca',
    name: 'Biblioteca Central Universitaria',
    shortName: 'Biblioteca',
    svgPath: 'M745 345 L830 345 L830 415 L745 415 Z',
    labelCoords: { x: 788, y: 380 },
  },
];

export const UNACH_ROAD_PATHS: RoadPath[] = [
  {
    id: 'blvd-belisario-dominguez',
    d: 'M-20 11 L608 75 L1220 123',
    kind: 'major',
    strokeWidth: 44,
  },
  {
    id: 'avenida-2-norte-oriente',
    d: 'M40 190 L355 269 L709 291 L978 339',
    kind: 'minor',
    strokeWidth: 12,
  },
  {
    id: 'acceso-poniente',
    d: 'M0 211 L243 295',
    kind: 'minor',
    strokeWidth: 10,
  },
  {
    id: 'circuito-poniente',
    d: 'M40 190 C30 260 38 330 36 380 L34 476',
    kind: 'minor',
    strokeWidth: 10,
  },
  {
    id: 'andador-central',
    d: 'M253 300 C400 380 540 430 600 470 C640 500 640 560 648 585 L628 617 L664 674',
    kind: 'minor',
    strokeWidth: 10,
  },
  {
    id: 'avenida-golondrinas',
    d: 'M0 700 L610 757 L930 800',
    kind: 'minor',
    strokeWidth: 14,
  },
];

export const UNACH_ROAD_LABELS: RoadLabel[] = [
  {
    id: 'label-blvd',
    text: 'BLVD. DR. BELISARIO DOMÍNGUEZ · MEX 190',
    x: 330,
    y: 47,
    rotation: 5.1,
  },
  {
    id: 'label-2-norte',
    text: 'AV. 2 NORTE ORIENTE',
    x: 530,
    y: 268,
    rotation: 3.6,
  },
];
