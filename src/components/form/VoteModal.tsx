'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Music,
  Mic2,
  Film,
  Check,
  X,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { CampusConfig, AuthUser, DailySubmission, MediaType, MediaItem } from '@/types/slambook.types';
import { rankingsService } from '@/services/rankings.service';
import { authService } from '@/services/auth.service';
import { mediaSearchService } from '@/services/media-search.service';
import { useToast } from '@/components/common/Toast';
import MediaImage from '@/components/common/MediaImage';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  campus: CampusConfig;
  initialFacultyId: string;
  onVoteSubmitted: () => void;
}

export default function VoteModal({
  isOpen,
  onClose,
  campus,
  initialFacultyId,
  onVoteSubmitted,
}: VoteModalProps) {
  const { showToast } = useToast();

  const [selectedFaculty, setSelectedFaculty] = useState(initialFacultyId);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [todaySubmission, setTodaySubmission] = useState<DailySubmission | null>(null);

  // Selecciones del usuario
  const [selectedSong, setSelectedSong] = useState<{ title: string; imageUrl?: string } | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<{ title: string; imageUrl?: string } | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<{ title: string; imageUrl?: string } | null>(null);

  // Estado del buscador expandido (cuando activeCategory no es null, se abre la vista de búsqueda amplia)
  const [activeCategory, setActiveCategory] = useState<MediaType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedFaculty(initialFacultyId);
  }, [initialFacultyId]);

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const sub = await rankingsService.getUserTodaySubmission(campus.slug, user.id);
        setTodaySubmission(sub);
        if (sub) {
          if (sub.song && !selectedSong) {
            setSelectedSong({ title: sub.song, imageUrl: sub.song_image_url });
          }
          if (sub.artist && !selectedArtist) {
            setSelectedArtist({ title: sub.artist, imageUrl: sub.artist_image_url });
          }
          if (sub.movie && !selectedMovie) {
            setSelectedMovie({ title: sub.movie, imageUrl: sub.movie_image_url });
          }
        }
      } else {
        setTodaySubmission(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserData();
      setActiveCategory(null);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, campus.slug]);

  // Búsqueda con debounce en tiempo real
  useEffect(() => {
    if (!activeCategory || !searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const data = await mediaSearchService.search(searchQuery, activeCategory, controller.signal);
        setSearchResults(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, activeCategory]);

  if (!isOpen) return null;

  const handleSelectItem = (item: MediaItem) => {
    let standardizedValue = item.title;
    if (item.type === 'song' && item.subtitle) {
      standardizedValue = `${item.title} (${item.subtitle})`;
    }

    if (item.type === 'song') {
      setSelectedSong({ title: standardizedValue, imageUrl: item.imageUrl });
    } else if (item.type === 'artist') {
      setSelectedArtist({ title: standardizedValue, imageUrl: item.imageUrl });
    } else if (item.type === 'movie') {
      setSelectedMovie({ title: standardizedValue, imageUrl: item.imageUrl });
    }

    setActiveCategory(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleGoogleLogin = async () => {
    try {
      await authService.signInWithGoogle(campus.allowedDomain);
      await loadUserData();
      showToast('Conectado con tu cuenta institucional');
    } catch (err: any) {
      showToast(err.message || 'Error al conectar con Google', 'error');
    }
  };

  const handleSimulateLogin = () => {
    const mockEmail = `estudiante.${Math.floor(Math.random() * 900 + 100)}@${campus.allowedDomain}`;
    authService.simulateMockLogin(mockEmail);
    loadUserData();
    showToast(`Sesión demo iniciada: ${mockEmail}`);
  };

  const handleSubmitVote = async () => {
    if (!currentUser) return;

    if (!selectedSong && !selectedArtist && !selectedMovie) {
      showToast('Selecciona al menos una categoría para votar', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await rankingsService.submitDailyVote(
        {
          campusSlug: campus.slug,
          facultyId: selectedFaculty,
          song: selectedSong?.title,
          songImageUrl: selectedSong?.imageUrl,
          artist: selectedArtist?.title,
          artistImageUrl: selectedArtist?.imageUrl,
          movie: selectedMovie?.title,
          movieImageUrl: selectedMovie?.imageUrl,
        },
        currentUser
      );

      showToast('¡Tu voto diario ha sido registrado con éxito!', 'success');
      onVoteSubmitted();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error al enviar el voto', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasSelections = Boolean(selectedSong || selectedArtist || selectedMovie);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-modal border border-neutral-100 flex flex-col max-h-[88vh] overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera del modal */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeCategory && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory(null);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-1 -ml-1 text-neutral-400 hover:text-neutral-800 transition-colors rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                {activeCategory
                  ? `Buscar ${activeCategory === 'song' ? 'Canción' : activeCategory === 'artist' ? 'Artista' : 'Película'}`
                  : 'Registrar Voto Diario'}
              </h2>
              <span className="text-[11px] text-neutral-400 block">
                {activeCategory
                  ? 'Escribe el nombre y selecciona de la lista'
                  : 'Puedes votar una sola categoría o todas a la vez'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* VISTA 1: BÚSQUEDA AMPLIA (cuando activeCategory está seleccionado) */}
          {activeCategory ? (
            <div className="space-y-4 animate-fade-in">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Escribe el nombre ${activeCategory === 'song' ? 'de la canción' : activeCategory === 'artist' ? 'del artista' : 'de la película'}...`}
                  className="w-full pl-9 pr-9 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#8A4222] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Lista amplia y espaciosa de resultados (sin recortes) */}
              <div className="space-y-2">
                {isSearching ? (
                  <div className="py-12 text-center text-xs text-neutral-400 animate-pulse">
                    Buscando en catálogo oficial...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto p-0.5">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className="flex items-center gap-3 p-2.5 bg-white border border-neutral-100 hover:border-[#8A4222]/40 hover:bg-[#8A4222]/5 rounded-xl text-left transition-all group"
                      >
                        <MediaImage
                          src={item.imageUrl}
                          alt={item.title}
                          type={item.type}
                          className={`w-11 h-11 ${
                            item.type === 'artist' ? 'rounded-full' : 'rounded-lg'
                          } object-cover flex-shrink-0 shadow-sm`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-neutral-900 truncate group-hover:text-[#8A4222]">
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
                ) : searchQuery.length >= 2 ? (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    No se encontraron coincidencias para &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    Escribe al menos 2 letras para desplegar resultados en vivo.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VISTA 2: SELECCIÓN DE CATEGORÍAS Y FACULTAD */
            <div className="space-y-5 animate-fade-in">
              {/* Selector de Facultad */}
              <div>
                <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Facultad que representas
                </span>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#8A4222]"
                >
                  {campus.faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.shortName})
                    </option>
                  ))}
                </select>
              </div>

              {!currentUser ? (
                /* Estado no autenticado: Google OAuth nativo */
                <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 text-center space-y-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#8A4222]/10 text-[#8A4222] flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-900">
                      Autenticación Universitaria
                    </h3>
                    <p className="text-[11px] text-neutral-500 max-w-xs mx-auto mt-0.5">
                      Solo los votos de estudiantes con correo @{campus.allowedDomain} cuentan en el ranking.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-2.5 px-4 bg-[#8A4222] hover:bg-[#72361b] text-white text-xs font-medium rounded-xl transition-colors shadow-sm"
                  >
                    Iniciar con Google (@{campus.allowedDomain})
                  </button>
                  {authService.isMockMode() && (
                    <button
                      type="button"
                      onClick={handleSimulateLogin}
                      className="text-[11px] text-neutral-400 hover:text-neutral-700 underline block mx-auto pt-1"
                    >
                      [Modo desarrollo local] Simular sesión @{campus.allowedDomain}
                    </button>
                  )}
                </div>
              ) : (
                /* Estado autenticado: 3 Ranuras Amplias de Selección */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-500 px-0.5">
                    <span>Sesión: {currentUser.email}</span>
                    {todaySubmission && (
                      <span className="text-[#8A4222] font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Voto previo hoy
                      </span>
                    )}
                  </div>

                  {/* RANURA 1: CANCIÓN */}
                  <div
                    onClick={() => {
                      setActiveCategory('song');
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="cursor-pointer flex items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-100 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedSong?.imageUrl ? (
                        <MediaImage
                          src={selectedSong.imageUrl}
                          alt={selectedSong.title}
                          type="song"
                          className="w-10 h-10 rounded-lg object-cover shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 group-hover:text-[#8A4222] flex-shrink-0">
                          <Music className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[11px] text-neutral-400 block font-medium">
                          1. Canción favorita
                        </span>
                        <span className="text-xs font-semibold text-neutral-900 truncate block">
                          {selectedSong ? selectedSong.title : 'Toca para buscar canción...'}
                        </span>
                      </div>
                    </div>
                    {selectedSong ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSong(null);
                        }}
                        className="p-1 text-neutral-400 hover:text-[#8A4222] rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
                    )}
                  </div>

                  {/* RANURA 2: ARTISTA */}
                  <div
                    onClick={() => {
                      setActiveCategory('artist');
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="cursor-pointer flex items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-100 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedArtist?.imageUrl ? (
                        <MediaImage
                          src={selectedArtist.imageUrl}
                          alt={selectedArtist.title}
                          type="artist"
                          className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 group-hover:text-[#8A4222] flex-shrink-0">
                          <Mic2 className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[11px] text-neutral-400 block font-medium">
                          2. Artista del momento
                        </span>
                        <span className="text-xs font-semibold text-neutral-900 truncate block">
                          {selectedArtist ? selectedArtist.title : 'Toca para buscar artista...'}
                        </span>
                      </div>
                    </div>
                    {selectedArtist ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArtist(null);
                        }}
                        className="p-1 text-neutral-400 hover:text-[#8A4222] rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
                    )}
                  </div>

                  {/* RANURA 3: PELÍCULA */}
                  <div
                    onClick={() => {
                      setActiveCategory('movie');
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="cursor-pointer flex items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-100 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedMovie?.imageUrl ? (
                        <MediaImage
                          src={selectedMovie.imageUrl}
                          alt={selectedMovie.title}
                          type="movie"
                          className="w-8 h-10 rounded object-cover shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 group-hover:text-[#8A4222] flex-shrink-0">
                          <Film className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[11px] text-neutral-400 block font-medium">
                          3. Película recomendada
                        </span>
                        <span className="text-xs font-semibold text-neutral-900 truncate block">
                          {selectedMovie ? selectedMovie.title : 'Toca para buscar película...'}
                        </span>
                      </div>
                    </div>
                    {selectedMovie ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMovie(null);
                        }}
                        className="p-1 text-neutral-400 hover:text-[#8A4222] rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer del modal */}
        {!activeCategory && currentUser && (
          <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/50">
            <span className="text-[11px] text-neutral-400">
              {hasSelections
                ? 'Listo para enviar tu voto'
                : 'Elige al menos 1 categoría'}
            </span>
            <button
              type="button"
              disabled={isSubmitting || !hasSelections}
              onClick={handleSubmitVote}
              className="px-5 py-2.5 bg-[#8A4222] hover:bg-[#72361b] disabled:bg-neutral-200 disabled:text-neutral-400 text-white rounded-xl text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              {isSubmitting ? 'Guardando...' : 'Confirmar voto'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
