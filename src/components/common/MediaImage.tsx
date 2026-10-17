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

  if (!src || hasError) {
    return (
      <div
        className={`bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 ${className}`}
        aria-label={alt}
      >
        {type === 'song' && <Music className="w-1/2 h-1/2 text-neutral-500" strokeWidth={1.8} />}
        {type === 'artist' && <Mic2 className="w-1/2 h-1/2 text-neutral-500" strokeWidth={1.8} />}
        {type === 'movie' && <Film className="w-1/2 h-1/2 text-neutral-500" strokeWidth={1.8} />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
}
