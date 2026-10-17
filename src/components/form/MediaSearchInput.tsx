'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MediaType, MediaItem } from '@/types/slambook.types';
import { mediaSearchService } from '@/services/media-search.service';

interface MediaSearchInputProps {
  label: string;
  type: MediaType;
  value: string;
  imageUrl?: string;
  onChange: (value: string, imageUrl?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}

export default function MediaSearchInput({
  label,
  type,
  value,
  imageUrl,
  onChange,
  disabled = false,
  placeholder = 'Buscar...',
}: MediaSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2 || value) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const data = await mediaSearchService.search(
          query,
          type,
          controller.signal
        );
        setResults(data);
        setIsOpen(true);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Search error:', e);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, type, value]);

  const handleSelect = (item: MediaItem) => {
    let standardizedValue = item.title;
    if (type === 'song' && item.subtitle) {
      standardizedValue = `${item.title} (${item.subtitle})`;
    }
    onChange(standardizedValue, item.imageUrl);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('', undefined);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="w-full text-xs font-sans" ref={containerRef}>
      <label className="block text-[11px] font-semibold text-slate-300 tracking-wide uppercase mb-1.5">
        {label}
      </label>

      {value ? (
        // Estado seleccionado estilo Apple Music / Apple TV
        <div className="flex items-center gap-3 p-2 bg-slate-900/80 border border-blue-500/30 rounded-xl text-white">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={value}
              className={`w-10 h-10 object-cover border border-white/10 ${
                type === 'artist' ? 'rounded-full' : 'rounded-lg'
              }`}
            />
          ) : (
            <div
              className={`w-10 h-10 bg-slate-800 flex items-center justify-center text-slate-400 font-bold ${
                type === 'artist' ? 'rounded-full' : 'rounded-lg'
              }`}
            >
              {type === 'song' ? '♪' : type === 'artist' ? '★' : '🎬'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-white">
              {value}
            </div>
            <div className="text-[11px] text-slate-400 capitalize">
              {type === 'song' ? 'Canción' : type === 'artist' ? 'Artista' : 'Película'} seleccionada
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Cambiar selección"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            disabled={disabled}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />

          {loading && (
            <div className="absolute right-3.5 top-3 text-[11px] text-blue-400 animate-pulse">
              Buscando...
            </div>
          )}

          {isOpen && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-1.5 space-y-1">
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-blue-600/30 transition-colors group"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className={`w-9 h-9 object-cover border border-white/10 flex-shrink-0 ${
                        type === 'artist' ? 'rounded-full' : 'rounded-lg'
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold flex-shrink-0 ${
                        type === 'artist' ? 'rounded-full' : 'rounded-lg'
                      }`}
                    >
                      {type === 'song' ? '♪' : type === 'artist' ? '★' : '🎬'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate group-hover:text-blue-200">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-[11px] text-slate-400 truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {isOpen && query.length >= 2 && !loading && results.length === 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 p-3 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl text-slate-400 text-xs">
              No se encontraron resultados para &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
