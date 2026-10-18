'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Map, {
  Source,
  Layer,
  NavigationControl,
  Popup,
  MapRef,
  LayerProps,
  MapLayerMouseEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import facultiesGeoJson from './faculties.geojson';
import {
  MAP_STYLES,
  MAP_COLORS,
  INITIAL_VIEW_STATE,
  MAP_BOUNDS,
  MapThemeMode,
} from './map-config';
import styles from './UnachCampusMap.module.css';

export interface UnachCampusMapProps {
  selectedFacultyId: string | null;
  onSelectFaculty: (id: string) => void;
  className?: string;
}

interface HoveredInfo {
  id: number;
  name: string;
  slug: string;
  longitude: number;
  latitude: number;
}

function getInitialTheme(): MapThemeMode {
  if (typeof window === 'undefined') return 'light';
  const html = document.documentElement;
  if (html.classList.contains('dark') || html.getAttribute('data-theme') === 'dark') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function UnachCampusMapInternal({
  selectedFacultyId,
  onSelectFaculty,
  className = '',
}: UnachCampusMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [themeMode, setThemeMode] = useState<MapThemeMode>(getInitialTheme);
  const [cursor, setCursor] = useState<string>('auto');
  const [hoveredInfo, setHoveredInfo] = useState<HoveredInfo | null>(null);
  const hoveredIdRef = useRef<number | null>(null);

  // Escuchar cambios de tema (prefers-color-scheme, clase 'dark' o data-theme)
  useEffect(() => {
    const checkTheme = () => {
      const html = document.documentElement;
      const isDark =
        html.classList.contains('dark') ||
        html.getAttribute('data-theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeMode(isDark ? 'dark' : 'light');
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkTheme);
    };
  }, []);

  // Animación suave flyTo hacia la facultad seleccionada
  useEffect(() => {
    if (!selectedFacultyId || !mapRef.current) return;

    const feature = (facultiesGeoJson.features as any[]).find(
      (f) => f.properties?.slug === selectedFacultyId
    );

    if (feature && feature.properties?.center) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      mapRef.current.flyTo({
        center: feature.properties.center,
        zoom: 17.2,
        pitch: 42,
        duration: prefersReducedMotion ? 0 : 850,
        essential: true,
      });
    }
  }, [selectedFacultyId]);

  // Manejadores de eventos de hover interactivo sobre facultades
  const onMouseEnter = useCallback(() => {
    setCursor('pointer');
  }, []);

  const onMouseLeave = useCallback(() => {
    setCursor('auto');
    if (hoveredIdRef.current !== null && mapRef.current) {
      mapRef.current.setFeatureState(
        { source: 'faculties-source', id: hoveredIdRef.current },
        { hover: false }
      );
      hoveredIdRef.current = null;
    }
    setHoveredInfo(null);
  }, []);

  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (feature && feature.id !== undefined) {
      const numericId = Number(feature.id);

      if (hoveredIdRef.current !== null && hoveredIdRef.current !== numericId && mapRef.current) {
        mapRef.current.setFeatureState(
          { source: 'faculties-source', id: hoveredIdRef.current },
          { hover: false }
        );
      }

      hoveredIdRef.current = numericId;
      if (mapRef.current) {
        mapRef.current.setFeatureState(
          { source: 'faculties-source', id: numericId },
          { hover: true }
        );
      }

      setHoveredInfo({
        id: numericId,
        name: feature.properties?.name || '',
        slug: feature.properties?.slug || '',
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
      });
    }
  }, []);

  const onClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (feature && feature.properties?.slug) {
        onSelectFaculty(feature.properties.slug);
      }
    },
    [onSelectFaculty]
  );

  const colors = MAP_COLORS[themeMode];

  // Capas vectoriales técnicas y minimalistas
  const fillLayer: LayerProps = {
    id: 'faculties-fill',
    type: 'fill',
    source: 'faculties-source',
    paint: {
      'fill-color': [
        'case',
        ['==', ['get', 'slug'], selectedFacultyId || ''],
        colors.fillSelected,
        ['boolean', ['feature-state', 'hover'], false],
        colors.fillHover,
        colors.fill,
      ],
      'fill-opacity': 0.92,
    },
  };

  const lineLayer: LayerProps = {
    id: 'faculties-line',
    type: 'line',
    source: 'faculties-source',
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'slug'], selectedFacultyId || ''],
        colors.strokeSelected,
        colors.stroke,
      ],
      'line-width': [
        'case',
        ['==', ['get', 'slug'], selectedFacultyId || ''],
        3.5,
        ['boolean', ['feature-state', 'hover'], false],
        2.5,
        1.5,
      ],
    },
  };

  const symbolLayer: LayerProps = {
    id: 'faculties-symbol',
    type: 'symbol',
    source: 'faculties-source',
    layout: {
      'text-field': ['get', 'shortName'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 13,
      'text-anchor': 'center',
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': [
        'case',
        ['==', ['get', 'slug'], selectedFacultyId || ''],
        colors.textSelected,
        colors.text,
      ],
      'text-halo-color': themeMode === 'dark' ? '#111317' : '#FFFFFF',
      'text-halo-width': 1.8,
    },
  };

  return (
    <div
      className={`${styles.container} ${className}`}
      role="region"
      aria-label="Mapa interactivo del Campus I de la UNACH"
    >
      <div className={styles.mapWrapper}>
        <Map
          ref={mapRef}
          initialViewState={INITIAL_VIEW_STATE}
          maxBounds={MAP_BOUNDS.maxBounds}
          minZoom={MAP_BOUNDS.minZoom}
          maxZoom={MAP_BOUNDS.maxZoom}
          mapStyle={MAP_STYLES[themeMode]}
          cursor={cursor}
          interactiveLayerIds={['faculties-fill']}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseMove={onMouseMove}
          onClick={onClick}
          attributionControl={{ compact: false }}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="bottom-right" showCompass={true} />

          <Source
            id="faculties-source"
            type="geojson"
            data={facultiesGeoJson as any}
            generateId={false}
          >
            <Layer {...fillLayer} />
            <Layer {...lineLayer} />
            <Layer {...symbolLayer} />
          </Source>

          {hoveredInfo && (
            <Popup
              longitude={hoveredInfo.longitude}
              latitude={hoveredInfo.latitude}
              closeButton={false}
              closeOnClick={false}
              anchor="bottom"
              offset={[0, -12]}
            >
              <div className={styles.tooltip}>
                <span className={styles.tooltipTitle}>{hoveredInfo.name}</span>
                <span className={styles.tooltipHint}>Ver tendencias →</span>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}

const UnachCampusMap = dynamic(() => Promise.resolve(UnachCampusMapInternal), {
  ssr: false,
  loading: () => (
    <div className={styles.container}>
      <div className="w-full h-full min-h-[380px] bg-[#F5F4F0] flex items-center justify-center text-xs text-neutral-400 font-medium animate-pulse">
        Cargando mapa interactivo de la UNACH...
      </div>
    </div>
  ),
});

export default UnachCampusMap;
