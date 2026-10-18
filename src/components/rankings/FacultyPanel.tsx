'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Music,
  Mic2,
  Film,
  Users,
  Search,
  Check,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  X,
  LogIn,
  Send,
} from 'lucide-react';
import {
  CampusConfig,
  FacultyRankings,
  Timeframe,
  DailySubmission,
  MatchingVote,
  AuthUser,
  MediaType,
  MediaItem,
} from '@/types/slambook.types';
import { rankingsService } from '@/services/rankings.service';
import { authService } from '@/services/auth.service';
import { mediaSearchService } from '@/services/media-search.service';
import { useToast } from '@/components/common/Toast';
import MediaImage from '@/components/common/MediaImage';

export type PanelTab = 'faculty' | 'campus' | 'vote';

interface FacultyPanelProps {
  campus: CampusConfig;
  facultyId: string;
  activeTab?: PanelTab;
  onTabChange?: (tab: PanelTab) => void;
  onVoteSubmitted?: () => void;
}

export default function FacultyPanel({
  campus,
  facultyId,
  activeTab: externalTab,
  onTabChange: externalOnTabChange,
  onVoteSubmitted,
}: FacultyPanelProps) {
  const { showToast } = useToast();

  // Gestión de pestaña principal
  const [internalTab, setInternalTab] = useState<PanelTab>('faculty');
  const activeTab = externalTab ?? internalTab;
  const setTab = (tab: PanelTab) => {
    if (externalOnTabChange) externalOnTabChange(tab);
    setInternalTab(tab);
  };

  // Filtro de temporalidad
  const [timeframe, setTimeframe] = useState<Timeframe>('day');

  // Datos de rankings
  const [facultyRankings, setFacultyRankings] = useState<FacultyRankings>({
    songs: [],
    artists: [],
    movies: [],
    totalVotes: 0,
  });
  const [campusRankings, setCampusRankings] = useState<FacultyRankings>({
    songs: [],
    artists: [],
    movies: [],
    totalVotes: 0,
  });

  // Usuario y voto diario
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userSubmission, setUserSubmission] = useState<DailySubmission | null>(null);
  const [matchingVotes, setMatchingVotes] = useState<MatchingVote[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estado del formulario de votación integrado (sin modales)
  const [voteFacultyId, setVoteFacultyId] = useState(facultyId);
  const [selectedSong, setSelectedSong] = useState<{ title: string; imageUrl?: string } | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<{ title: string; imageUrl?: string } | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<{ title: string; imageUrl?: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<MediaType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario rápido de creación/prueba de cuenta demo
  const [testEmailInput, setTestEmailInput] = useState('');

  const currentFaculty = campus.faculties.find((f) => f.id === facultyId) || {
    id: facultyId,
    name: facultyId,
    shortName: facultyId,
  };

  useEffect(() => {
    setVoteFacultyId(facultyId);
  }, [facultyId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [facData, campData, user] = await Promise.all([
        rankingsService.getRankings(campus.slug, facultyId, timeframe),
        rankingsService.getCampusRankings(campus.slug, timeframe),
        authService.getCurrentUser(),
      ]);

      setFacultyRankings(facData);
      setCampusRankings(campData);
      setCurrentUser(user);

      if (user) {
        const sub = await rankingsService.getUserTodaySubmission(campus.slug, user.id);
        setUserSubmission(sub);
        if (sub) {
          const matches = await rankingsService.getMatchingVotes(campus.slug, facultyId, sub);
          setMatchingVotes(matches);
        } else {
          setMatchingVotes([]);
        }
      } else {
        setUserSubmission(null);
        setMatchingVotes([]);
      }
    } catch (e) {
      console.error('Error cargando rankings:', e);
    } finally {
      setLoading(false);
    }
  }, [campus.slug, facultyId, timeframe]);

  useEffect(() => {
    loadData();
    const unsub = authService.onAuthStateChange(() => {
      loadData();
    });
    return unsub;
  }, [loadData]);

  // Búsqueda en tiempo real con debounce
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
    }, 260);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, activeCategory]);

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
      showToast('Conectando con cuenta institucional...');
    } catch (err: any) {
      showToast(err.message || 'Error al autenticar', 'error');
    }
  };

  const handleCreateTestAccount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = testEmailInput.trim()
      ? (testEmailInput.includes('@') ? testEmailInput.trim() : `${testEmailInput.trim()}@${campus.allowedDomain}`)
      : `estudiante.${Math.floor(Math.random() * 899 + 100)}@${campus.allowedDomain}`;

    try {
      authService.createTestAccount(targetEmail);
      setTestEmailInput('');
      showToast(`Cuenta de prueba creada: ${targetEmail}`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error al crear cuenta', 'error');
    }
  };

  const handleSubmitVote = async () => {
    if (!currentUser) {
      showToast('Debes iniciar sesión con tu correo para votar', 'error');
      return;
    }

    if (!selectedSong && !selectedArtist && !selectedMovie) {
      showToast('Elige al menos una categoría para enviar tu voto', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await rankingsService.submitDailyVote(
        {
          campusSlug: campus.slug,
          facultyId: voteFacultyId,
          song: selectedSong?.title,
          songImageUrl: selectedSong?.imageUrl,
          artist: selectedArtist?.title,
          artistImageUrl: selectedArtist?.imageUrl,
          movie: selectedMovie?.title,
          movieImageUrl: selectedMovie?.imageUrl,
        },
        currentUser
      );

      setSelectedSong(null);
      setSelectedArtist(null);
      setSelectedMovie(null);
      setActiveCategory(null);
      setSearchQuery('');
      setSearchResults([]);

      showToast('¡Tu voto diario ha sido registrado con éxito!', 'success');
      await loadData();
      if (onVoteSubmitted) onVoteSubmitted();
      setTab('vote');
    } catch (err: any) {
      showToast(err.message || 'Error al enviar voto', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRankings = activeTab === 'campus' ? campusRankings : facultyRankings;
  const isRankingsEmpty =
    currentRankings.songs.length === 0 &&
    currentRankings.artists.length === 0 &&
    currentRankings.movies.length === 0;

  return (
    <aside className="w-full h-full flex flex-col bg-white dark:bg-[#18181B] border border-neutral-300/80 dark:border-neutral-800 rounded-2xl p-4 md:p-5 text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans shadow-skeuo-card">
      {/* 1. Selector de Pestañas Superior: Control Segmentado Skeuomorphic */}
      <nav className="mb-4 p-1 bg-[#EDEAE4] dark:bg-[#27272A] rounded-xl shadow-skeuo-track flex items-center gap-1 select-none flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            setTab('faculty');
            setActiveCategory(null);
          }}
          className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-all text-center truncate ${
            activeTab === 'faculty'
              ? 'bg-white dark:bg-[#18181B] text-neutral-900 dark:text-white shadow-skeuo-pill'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          {currentFaculty.shortName}
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('campus');
            setActiveCategory(null);
          }}
          className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-all text-center truncate ${
            activeTab === 'campus'
              ? 'bg-white dark:bg-[#18181B] text-neutral-900 dark:text-white shadow-skeuo-pill'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Todo el Campus
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('vote');
            setActiveCategory(null);
          }}
          className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-all text-center truncate ${
            activeTab === 'vote'
              ? 'bg-[#94421A] dark:bg-[#C85D2C] text-white shadow-skeuo-btn'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Votar
        </button>
      </nav>

      {/* 2. Cabecera y Filtros de Temporalidad (para Pestañas de Rankings) */}
      {activeTab !== 'vote' && (
        <div className="pb-3 mb-3 border-b border-neutral-200/70 dark:border-neutral-800 flex-shrink-0">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
            <span>
              {activeTab === 'campus' ? campus.name : campus.shortName}
            </span>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              {currentRankings.totalVotes} {currentRankings.totalVotes === 1 ? 'voto' : 'votos'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
              {activeTab === 'campus' ? 'Lo más popular en el Campus' : currentFaculty.name}
            </h1>

            {/* Píldoras de Temporalidad táctiles */}
            <div className="flex items-center gap-1 bg-[#F4F3F0] dark:bg-[#27272A] p-0.5 rounded-lg border border-black/[0.04] dark:border-white/[0.04]">
              {(['day', 'week', 'all'] as const).map((tab) => {
                const isActive = timeframe === tab;
                const label = tab === 'day' ? 'Hoy' : tab === 'week' ? 'Semana' : 'Histórico';
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTimeframe(tab)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all ${
                      isActive
                        ? 'bg-white dark:bg-[#18181B] text-[#94421A] dark:text-[#FB923C] font-bold shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Área de Contenido Principal Scrolleable */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
        {/* ============================================================== */}
        {/* VISTA A: FORMULARIO DE VOTACIÓN INTEGRADO (SIN MODALES)       */}
        {/* ============================================================== */}
        {activeTab === 'vote' ? (
          <div className="space-y-4 animate-fade-in">
            {/* Si activeCategory está seleccionado, mostramos la búsqueda amplia integrada */}
            {activeCategory ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory(null);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver a categorías</span>
                  </button>
                  <span className="text-[11px] font-semibold text-[#94421A] uppercase tracking-wide">
                    {activeCategory === 'song' ? 'Canción' : activeCategory === 'artist' ? 'Artista' : 'Película'}
                  </span>
                </div>

                {/* Input de Búsqueda Skeuomorphic Recessed */}
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Escribe el título ${activeCategory === 'song' ? 'de la canción' : activeCategory === 'artist' ? 'del artista' : 'de la película'}...`}
                    className="w-full pl-9 pr-8 py-2 bg-[#F9F8F6] border border-neutral-300 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#94421A] shadow-skeuo-inset transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Resultados de la API (Cinemeta / Deezer) */}
                <div className="space-y-1.5 max-h-[55vh] overflow-y-auto">
                  {isSearching ? (
                    <div className="py-8 text-center text-xs text-neutral-400 animate-pulse">
                      Buscando en catálogo oficial...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className="w-full flex items-center gap-2.5 p-2 bg-white hover:bg-[#F9F8F6] border border-neutral-200/80 rounded-xl text-left transition-all shadow-skeuo-btn-neutral group"
                      >
                        <MediaImage
                          src={item.imageUrl}
                          alt={item.title}
                          type={item.type}
                          className={`w-10 h-10 ${
                            item.type === 'artist' ? 'rounded-full' : 'rounded-lg'
                          } object-cover flex-shrink-0 shadow-sm`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-neutral-900 truncate group-hover:text-[#94421A]">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-neutral-500 truncate">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  ) : searchQuery.length >= 2 ? (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      No se encontraron resultados para &ldquo;{searchQuery}&rdquo;.
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      Escribe al menos 2 letras para desplegar resultados en vivo.
                    </div>
                  )}
                </div>
              </div>
            ) : !currentUser ? (
              /* ESTADO NO AUTENTICADO: CREAR / PROBAR CUENTA */
              <div className="p-4 bg-[#F8F7F4] border border-neutral-300 rounded-2xl shadow-skeuo-card space-y-3.5">
                <div>
                  <h2 className="text-xs font-bold text-neutral-900">
                    Acceso para Votar
                  </h2>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    Solo los votos con correo @{campus.allowedDomain} cuentan en el ranking.
                  </p>
                </div>

                {/* Botón de Google OAuth Oficial */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-2.5 px-3 bg-[#94421A] hover:bg-[#7D3412] active:translate-y-[1px] text-white text-xs font-semibold rounded-xl shadow-skeuo-btn flex items-center justify-center gap-2 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Acceder con Google (@{campus.allowedDomain})</span>
                </button>

                {/* Sección de Prueba / Creación Rápida de Cuenta Demo */}
                <div className="pt-2 border-t border-neutral-200/80 space-y-2">
                  <span className="block text-[11px] font-semibold text-neutral-700">
                    O prueba creando una cuenta demo instantánea:
                  </span>
                  <form onSubmit={handleCreateTestAccount} className="flex gap-2">
                    <input
                      type="text"
                      value={testEmailInput}
                      onChange={(e) => setTestEmailInput(e.target.value)}
                      placeholder={`tu_nombre@${campus.allowedDomain}`}
                      className="flex-1 px-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 shadow-skeuo-inset focus:outline-none focus:border-[#94421A]"
                    />
                    <button
                      type="submit"
                      className="py-1.5 px-3 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 text-xs font-semibold rounded-xl shadow-skeuo-btn-neutral active:translate-y-[1px] transition-all"
                    >
                      Probar
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      `estudiante@${campus.allowedDomain}`,
                      `carlos.ing@${campus.allowedDomain}`,
                      `valeria.med@${campus.allowedDomain}`,
                    ].map((sampleEmail) => (
                      <button
                        key={sampleEmail}
                        type="button"
                        onClick={() => {
                          authService.createTestAccount(sampleEmail);
                          showToast(`Sesión de prueba: ${sampleEmail}`, 'info');
                          loadData();
                        }}
                        className="text-[10px] py-0.5 px-2 bg-white border border-neutral-200 rounded-md text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 transition-colors"
                      >
                        {sampleEmail.split('@')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : userSubmission ? (
              /* ESTADO: EL USUARIO YA REGISTRÓ SU VOTO HOY */
              <div className="space-y-4 animate-fade-in py-1">
                <div className="p-4 bg-[#FAF9F6] dark:bg-[#222226] border border-neutral-200/90 dark:border-neutral-700/80 rounded-2xl shadow-skeuo-card text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#94421A]/10 dark:bg-[#C85D2C]/20 text-[#94421A] dark:text-[#FB923C] flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      ¡Ya registraste tu voto de hoy!
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed">
                      Tus elecciones de hoy ya fueron computadas en los rankings. Podrás emitir una nueva selección mañana a partir de las 00:00.
                    </p>
                  </div>
                </div>

                {/* Resumen del voto registrado hoy */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block px-1">
                    Tus elecciones para el día de hoy:
                  </span>

                  <div className="p-3 bg-white dark:bg-[#1E1E22] border border-neutral-200/90 dark:border-neutral-800 rounded-xl space-y-2.5 shadow-sm">
                    {userSubmission.faculty_id && (
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 pb-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <span>Facultad representada:</span>
                        <strong className="text-neutral-900 dark:text-neutral-200 font-semibold">
                          {campus.faculties.find((f) => f.id === userSubmission.faculty_id)?.name || userSubmission.faculty_id}
                        </strong>
                      </div>
                    )}

                    {userSubmission.song && (
                      <div className="flex items-center gap-2.5">
                        {userSubmission.song_image_url ? (
                          <MediaImage
                            src={userSubmission.song_image_url}
                            alt={userSubmission.song}
                            type="song"
                            className="w-9 h-9 rounded-lg object-cover shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[#EDEAE4] dark:bg-[#27272A] text-neutral-500 flex items-center justify-center flex-shrink-0">
                            <Music className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-medium">
                            Canción favorita
                          </span>
                          <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate block">
                            {userSubmission.song}
                          </span>
                        </div>
                      </div>
                    )}

                    {userSubmission.artist && (
                      <div className="flex items-center gap-2.5">
                        {userSubmission.artist_image_url ? (
                          <MediaImage
                            src={userSubmission.artist_image_url}
                            alt={userSubmission.artist}
                            type="artist"
                            className="w-9 h-9 rounded-full object-cover shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#EDEAE4] dark:bg-[#27272A] text-neutral-500 flex items-center justify-center flex-shrink-0">
                            <Mic2 className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-medium">
                            Artista favorito
                          </span>
                          <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate block">
                            {userSubmission.artist}
                          </span>
                        </div>
                      </div>
                    )}

                    {userSubmission.movie && (
                      <div className="flex items-center gap-2.5">
                        {userSubmission.movie_image_url ? (
                          <MediaImage
                            src={userSubmission.movie_image_url}
                            alt={userSubmission.movie}
                            type="movie"
                            className="w-8 h-9 rounded-md object-cover shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-9 rounded-md bg-[#EDEAE4] dark:bg-[#27272A] text-neutral-500 flex items-center justify-center flex-shrink-0">
                            <Film className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-medium">
                            Película favorita
                          </span>
                          <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate block">
                            {userSubmission.movie}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coincidencias con otros estudiantes */}
                {matchingVotes.length > 0 && (
                  <div className="p-3 bg-[#FAF9F6] dark:bg-[#222226] border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#94421A] dark:text-[#FB923C]" />
                        <span>Coincidencias ({matchingVotes.reduce((acc, m) => acc + m.voterCount, 0)})</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Otros estudiantes en el campus votaron por tus mismos gustos hoy.
                    </p>
                  </div>
                )}

                {/* Acciones para explorar rankings */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('faculty')}
                    className="w-full py-2.5 px-4 bg-[#94421A] hover:bg-[#7D3412] dark:bg-[#C85D2C] dark:hover:bg-[#B24E21] text-white text-xs font-semibold rounded-xl shadow-skeuo-btn active:translate-y-[1px] transition-all text-center"
                  >
                    Ver ranking de {currentFaculty.shortName}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab('campus')}
                    className="w-full py-2 px-4 bg-white dark:bg-[#27272A] border border-neutral-300/80 dark:border-neutral-700 hover:bg-[#FAF9F7] dark:hover:bg-[#323238] text-neutral-700 dark:text-neutral-200 text-xs font-semibold rounded-xl shadow-skeuo-btn-neutral active:translate-y-[1px] transition-all text-center"
                  >
                    Ver ranking de todo el Campus
                  </button>
                </div>
              </div>
            ) : (
              /* ESTADO AUTENTICADO: 3 RANURAS DE VOTO INTEGRADO DISPONIBLES */
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span>Sesión: <strong className="text-neutral-800 dark:text-neutral-200 font-semibold">{currentUser.username}</strong></span>
                </div>

                {/* Selector de Facultad */}
                <div>
                  <span className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Facultad que representas
                  </span>
                  <select
                    value={voteFacultyId}
                    onChange={(e) => setVoteFacultyId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#27272A] border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white shadow-skeuo-inset focus:outline-none focus:border-[#94421A]"
                  >
                    {campus.faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ranura 1: Canción */}
                <div
                  onClick={() => {
                    setActiveCategory('song');
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="cursor-pointer flex items-center justify-between p-2.5 bg-white dark:bg-[#222226] hover:bg-[#F9F8F6] dark:hover:bg-[#2A2A30] border border-neutral-200/90 dark:border-neutral-700/80 rounded-xl shadow-skeuo-btn-neutral transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {selectedSong?.imageUrl ? (
                      <MediaImage
                        src={selectedSong.imageUrl}
                        alt={selectedSong.title}
                        type="song"
                        className="w-9 h-9 rounded-lg object-cover shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[#EDEAE4] dark:bg-[#27272A] text-neutral-500 flex items-center justify-center flex-shrink-0">
                        <Music className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-medium">
                        1. Canción favorita
                      </span>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate block group-hover:text-[#94421A] dark:group-hover:text-[#FB923C]">
                        {selectedSong ? selectedSong.title : 'Buscar canción...'}
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
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200" />
                  )}
                </div>

                {/* Ranura 2: Artista */}
                <div
                  onClick={() => {
                    setActiveCategory('artist');
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="cursor-pointer flex items-center justify-between p-2.5 bg-white dark:bg-[#222226] hover:bg-[#F9F8F6] dark:hover:bg-[#2A2A30] border border-neutral-200/90 dark:border-neutral-700/80 rounded-xl shadow-skeuo-btn-neutral transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {selectedArtist?.imageUrl ? (
                      <MediaImage
                        src={selectedArtist.imageUrl}
                        alt={selectedArtist.title}
                        type="artist"
                        className="w-9 h-9 rounded-full object-cover shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#EDEAE4] dark:bg-[#27272A] text-neutral-500 flex items-center justify-center flex-shrink-0">
                        <Mic2 className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-medium">
                        2. Artista favorito
                      </span>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate block group-hover:text-[#94421A] dark:group-hover:text-[#FB923C]">
                        {selectedArtist ? selectedArtist.title : 'Buscar artista...'}
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
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200" />
                  )}
                </div>

                {/* Ranura 3: Película */}
                <div
                  onClick={() => {
                    setActiveCategory('movie');
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="cursor-pointer flex items-center justify-between p-2.5 bg-white dark:bg-[#222226] hover:bg-[#F9F8F6] dark:hover:bg-[#2A2A30] border border-neutral-200/90 dark:border-neutral-700/80 rounded-xl shadow-skeuo-btn-neutral transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {selectedMovie?.imageUrl ? (
                      <MediaImage
                        src={selectedMovie.imageUrl}
                        alt={selectedMovie.title}
                        type="movie"
                        className="w-8 h-9 rounded-md object-cover shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-9 rounded-md bg-[#EDEAE4] dark:bg-[#27272A] text-neutral-500 flex items-center justify-center flex-shrink-0">
                        <Film className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block font-medium">
                        3. Película favorita
                      </span>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate block group-hover:text-[#94421A] dark:group-hover:text-[#FB923C]">
                        {selectedMovie ? selectedMovie.title : 'Buscar película...'}
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
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200" />
                  )}
                </div>

                {/* Botón de Envío Táctil Skeuomorphic */}
                <button
                  type="button"
                  onClick={handleSubmitVote}
                  disabled={isSubmitting || (!selectedSong && !selectedArtist && !selectedMovie)}
                  className="w-full py-2.5 px-4 bg-[#94421A] hover:bg-[#7D3412] dark:bg-[#C85D2C] dark:hover:bg-[#B24E21] disabled:bg-neutral-300 dark:disabled:bg-neutral-800 disabled:shadow-none text-white text-xs font-semibold rounded-xl shadow-skeuo-btn active:translate-y-[1px] transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Registrando...' : 'Registrar voto diario'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================== */
          /* VISTA B: LISTADO DE RANKINGS (FACULTAD O TODO EL CAMPUS)      */
          /* ============================================================== */
          <div className="space-y-4 animate-fade-in">
            {/* Voto del usuario hoy y coincidencias (solo en pestaña Facultad) */}
            {activeTab === 'faculty' && currentUser && (
              <section className="p-3 bg-[#FAF9F6] dark:bg-[#222226] border border-neutral-200/80 dark:border-neutral-800 rounded-xl space-y-2 shadow-skeuo-card">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 dark:text-white">
                    Tu voto de hoy
                  </span>
                  {userSubmission && matchingVotes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowMatches(!showMatches)}
                      className="text-xs text-[#94421A] dark:text-[#FB923C] hover:underline font-semibold flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      {showMatches
                        ? 'Ocultar'
                        : `Coincidencias (${matchingVotes.reduce((acc, m) => acc + m.voterCount, 0)})`}
                    </button>
                  )}
                </div>

                {userSubmission ? (
                  <div className="space-y-1 text-neutral-700 dark:text-neutral-300 text-xs">
                    {userSubmission.song && (
                      <div className="flex items-center gap-1.5">
                        <Music className="w-3 h-3 text-neutral-400" />
                        <span className="text-neutral-400 dark:text-neutral-500">Canción:</span>
                        <span className="font-semibold text-neutral-900 dark:text-white truncate">
                          {userSubmission.song}
                        </span>
                      </div>
                    )}
                    {userSubmission.artist && (
                      <div className="flex items-center gap-1.5">
                        <Mic2 className="w-3 h-3 text-neutral-400" />
                        <span className="text-neutral-400 dark:text-neutral-500">Artista:</span>
                        <span className="font-semibold text-neutral-900 dark:text-white truncate">
                          {userSubmission.artist}
                        </span>
                      </div>
                    )}
                    {userSubmission.movie && (
                      <div className="flex items-center gap-1.5">
                        <Film className="w-3 h-3 text-neutral-400" />
                        <span className="text-neutral-400 dark:text-neutral-500">Película:</span>
                        <span className="font-semibold text-neutral-900 dark:text-white truncate">
                          {userSubmission.movie}
                        </span>
                      </div>
                    )}

                    {showMatches && matchingVotes.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-neutral-200/80 dark:border-neutral-800 space-y-1.5">
                        <span className="text-[11px] font-semibold text-[#94421A] dark:text-[#FB923C] block">
                          Estudiantes con el mismo voto:
                        </span>
                        {matchingVotes.map((mv) => (
                          <div key={mv.category} className="space-y-0.5">
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">
                              En {mv.category === 'song' ? 'canción' : mv.category === 'artist' ? 'artista' : 'película'}: &ldquo;{mv.itemTitle}&rdquo;
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {mv.voters.map((v) => (
                                <span
                                  key={v.userId}
                                  className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#2A2A30] px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-sm"
                                >
                                  {v.displayName}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>Aún no has votado hoy.</span>
                    <button
                      type="button"
                      onClick={() => setTab('vote')}
                      className="text-[#94421A] dark:text-[#FB923C] hover:underline font-semibold"
                    >
                      Votar ahora
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Listas de Rankings */}
            {loading ? (
              <div className="py-16 text-center text-neutral-400 text-xs animate-pulse">
                Cargando rankings...
              </div>
            ) : isRankingsEmpty ? (
              <div className="py-14 text-center space-y-2 animate-fade-in">
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Aún no hay votos registrados
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  {activeTab === 'campus'
                    ? 'No hay registros en el campus en este período.'
                    : `Sé el primero en votar en ${currentFaculty.shortName} para posicionar tus favoritos.`}
                </p>
                <button
                  type="button"
                  onClick={() => setTab('vote')}
                  className="mt-2 py-1.5 px-3.5 bg-white dark:bg-[#27272A] border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-xl shadow-skeuo-btn-neutral hover:bg-neutral-50 dark:hover:bg-[#323238] active:translate-y-[1px] transition-all"
                >
                  Registrar primer voto
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* TOP CANCIONES */}
                <section className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    <Music className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>Top Canciones</span>
                  </div>
                  {currentRankings.songs.length === 0 ? (
                    <p className="text-neutral-400 italic text-[11px]">Sin registros en este período</p>
                  ) : (
                    <div className="space-y-1">
                      {currentRankings.songs.map((song, idx) => (
                        <div
                          key={song.name}
                          className="flex items-center gap-2.5 p-1.5 bg-white dark:bg-[#222226] border border-neutral-200/60 dark:border-neutral-800 rounded-xl hover:bg-neutral-50/80 dark:hover:bg-[#2A2A30] transition-colors shadow-sm"
                        >
                          <span className="w-4 text-center font-bold text-neutral-400 dark:text-neutral-500 text-xs">
                            {idx + 1}
                          </span>
                          <MediaImage
                            src={song.imageUrl}
                            alt={song.name}
                            type="song"
                            className="w-9 h-9 rounded-lg object-cover border border-neutral-100 dark:border-neutral-800 flex-shrink-0 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-neutral-900 dark:text-white truncate">
                              {song.name}
                            </div>
                          </div>
                          <span className="font-bold text-neutral-600 dark:text-neutral-300 text-xs px-1">
                            {song.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* TOP ARTISTAS */}
                <section className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    <Mic2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>Top Artistas</span>
                  </div>
                  {currentRankings.artists.length === 0 ? (
                    <p className="text-neutral-400 italic text-[11px]">Sin registros en este período</p>
                  ) : (
                    <div className="space-y-1">
                      {currentRankings.artists.map((artist, idx) => (
                        <div
                          key={artist.name}
                          className="flex items-center gap-2.5 p-1.5 bg-white dark:bg-[#222226] border border-neutral-200/60 dark:border-neutral-800 rounded-xl hover:bg-neutral-50/80 dark:hover:bg-[#2A2A30] transition-colors shadow-sm"
                        >
                          <span className="w-4 text-center font-bold text-neutral-400 dark:text-neutral-500 text-xs">
                            {idx + 1}
                          </span>
                          <MediaImage
                            src={artist.imageUrl}
                            alt={artist.name}
                            type="artist"
                            className="w-9 h-9 rounded-full object-cover border border-neutral-100 dark:border-neutral-800 flex-shrink-0 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-neutral-900 dark:text-white truncate">
                              {artist.name}
                            </div>
                          </div>
                          <span className="font-bold text-neutral-600 dark:text-neutral-300 text-xs px-1">
                            {artist.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* TOP PELÍCULAS */}
                <section className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    <Film className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                    <span>Top Películas</span>
                  </div>
                  {currentRankings.movies.length === 0 ? (
                    <p className="text-neutral-400 italic text-[11px]">Sin registros en este período</p>
                  ) : (
                    <div className="space-y-1">
                      {currentRankings.movies.map((movie, idx) => (
                        <div
                          key={movie.name}
                          className="flex items-center gap-2.5 p-1.5 bg-white dark:bg-[#222226] border border-neutral-200/60 dark:border-neutral-800 rounded-xl hover:bg-neutral-50/80 dark:hover:bg-[#2A2A30] transition-colors shadow-sm"
                        >
                          <span className="w-4 text-center font-bold text-neutral-400 dark:text-neutral-500 text-xs">
                            {idx + 1}
                          </span>
                          <MediaImage
                            src={movie.imageUrl}
                            alt={movie.name}
                            type="movie"
                            className="w-8 h-10 rounded-lg object-cover border border-neutral-100 dark:border-neutral-800 flex-shrink-0 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-neutral-900 dark:text-white truncate">
                              {movie.name}
                            </div>
                          </div>
                          <span className="font-bold text-neutral-600 dark:text-neutral-300 text-xs px-1">
                            {movie.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
