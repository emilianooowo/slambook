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
    }, 280);

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
    <div className="w-full text-xs" ref={containerRef}>
      {/* Label estrictamente sin fondo y sin bordeado */}
      <span className="block text-xs font-medium text-neutral-700 mb-1.5">
        {label}
      </span>

      {value ? (
        // Estado seleccionado minimalista
        <div className="flex items-center gap-3 p-2.5 bg-white border border-neutral-200 rounded-lg">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={value}
              className={`w-9 h-9 object-cover border border-neutral-100 ${
                type === 'artist' ? 'rounded-full' : 'rounded-md'
              }`}
            />
          ) : (
            <div
              className={`w-9 h-9 bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs font-semibold ${
                type === 'artist' ? 'rounded-full' : 'rounded-md'
              }`}
            >
              {type === 'song' ? '♪' : type === 'artist' ? '★' : '🎬'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-neutral-900 truncate">
              {value}
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-neutral-400 hover:text-[#8A4222] transition-colors px-1"
              title="Cambiar"
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
            maxLength={100}
            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#8A4222] transition-colors"
          />

          {loading && (
            <div className="absolute right-3 top-2.5 text-xs text-neutral-400">
              ...
            </div>
          )}

          {isOpen && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-lg p-1 space-y-0.5">
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 p-2 rounded-md text-left hover:bg-neutral-50 transition-colors"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className={`w-8 h-8 object-cover border border-neutral-100 flex-shrink-0 ${
                        type === 'artist' ? 'rounded-full' : 'rounded'
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs font-semibold flex-shrink-0 ${
                        type === 'artist' ? 'rounded-full' : 'rounded'
                      }`}
                    >
                      {type === 'song' ? '♪' : type === 'artist' ? '★' : '🎬'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-neutral-900 truncate">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-[11px] text-neutral-500 truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {isOpen && query.length >= 2 && !loading && results.length === 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 p-3 bg-white border border-neutral-200 rounded-lg text-neutral-500 text-xs shadow-md">
              Sin coincidencias
            </div>
          )}
        </div>
      )}
    </div>
  );
}
