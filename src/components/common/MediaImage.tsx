'use client';

import React, { useState } from 'react';
import { Music, Mic2, Film } from 'lucide-react';
import { MediaType } from '@/types/slambook.types';

interface MediaImageProps {
  src?: string;
  alt: string;
  type: MediaType;
  className?: string;
}

export default function MediaImage({
  src,
  alt,
  type,
  className = '',
}: MediaImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`bg-neutral-50 flex items-center justify-center text-neutral-300 select-none ${className}`}
        aria-label={alt}
      >
        {type === 'song' && <Music className="w-1/2 h-1/2" strokeWidth={1.5} />}
        {type === 'artist' && <Mic2 className="w-1/2 h-1/2" strokeWidth={1.5} />}
        {type === 'movie' && <Film className="w-1/2 h-1/2" strokeWidth={1.5} />}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-neutral-50 ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
      />
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse" />
      )}
    </div>
  );
}
