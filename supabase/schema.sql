-- ==============================================================================
-- SLAMBOOK DATABASE SCHEMA & SECURITY CONTROLS (SUPABASE POSTGRESQL) - V3
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Perfiles de Usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Restricciones de longitud para seguridad contra desbordamientos
  CONSTRAINT profiles_username_length_check CHECK (char_length(username) >= 3 AND char_length(username) <= 40),
  CONSTRAINT profiles_email_length_check CHECK (char_length(email) <= 120),
  CONSTRAINT profiles_avatar_length_check CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500000)
);

-- 2. Tabla de Envíos Diarios
CREATE TABLE IF NOT EXISTS public.daily_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_slug TEXT NOT NULL,
  faculty_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  username TEXT,
  user_avatar_url TEXT,
  song TEXT,
  song_image_url TEXT,
  artist TEXT,
  artist_image_url TEXT,
  movie TEXT,
  movie_image_url TEXT,
  submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Restricción estricta: Máximo 1 registro por usuario por día
  CONSTRAINT daily_submissions_user_date_key UNIQUE (user_id, submission_date),

  -- Restricciones defensivas de longitud de buffers/strings contra payloads anómalos
  CONSTRAINT check_lengths CHECK (
    char_length(campus_slug) <= 60 AND
    char_length(faculty_id) <= 60 AND
    char_length(user_email) <= 120 AND
    (song IS NULL OR char_length(song) <= 150) AND
    (artist IS NULL OR char_length(artist) <= 150) AND
    (movie IS NULL OR char_length(movie) <= 150) AND
    (username IS NULL OR char_length(username) <= 40)
  )
);

-- 3. Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_submissions_campus_faculty_date 
  ON public.daily_submissions (campus_slug, faculty_id, submission_date);

CREATE INDEX IF NOT EXISTS idx_submissions_user_date 
  ON public.daily_submissions (user_id, submission_date);

-- 4. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_submissions ENABLE ROW LEVEL SECURITY;

-- Políticas de Perfiles
DROP POLICY IF EXISTS "Lectura pública de perfiles" ON public.profiles;
CREATE POLICY "Lectura pública de perfiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Edición de perfil por su propio usuario" ON public.profiles;
CREATE POLICY "Edición de perfil por su propio usuario" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Políticas de Envíos Diarios
DROP POLICY IF EXISTS "Lectura pública de rankings" ON public.daily_submissions;
CREATE POLICY "Lectura pública de rankings" ON public.daily_submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserción diaria restringida" ON public.daily_submissions;
CREATE POLICY "Inserción diaria restringida" ON public.daily_submissions FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND submission_date = CURRENT_DATE
);

DROP POLICY IF EXISTS "Actualización diaria propia" ON public.daily_submissions;
CREATE POLICY "Actualización diaria propia" ON public.daily_submissions FOR UPDATE USING (
  auth.uid() = user_id
  AND submission_date = CURRENT_DATE
);

-- 5. Función RPC get_faculty_rankings
CREATE OR REPLACE FUNCTION public.get_faculty_rankings(
  p_campus_slug TEXT,
  p_faculty_id TEXT,
  p_timeframe TEXT DEFAULT 'day'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE;
  v_total_votes INT;
  v_songs JSONB;
  v_artists JSONB;
  v_movies JSONB;
BEGIN
  IF p_timeframe = 'day' THEN
    v_start_date := CURRENT_DATE;
  ELSIF p_timeframe = 'week' THEN
    v_start_date := (CURRENT_DATE - INTERVAL '7 days')::DATE;
  ELSE
    v_start_date := '1970-01-01'::DATE;
  END IF;

  SELECT COUNT(*)
  INTO v_total_votes
  FROM public.daily_submissions
  WHERE campus_slug = p_campus_slug
    AND faculty_id = p_faculty_id
    AND (p_timeframe = 'all' OR submission_date >= v_start_date);

  -- Top Canciones
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', sub.song,
        'count', sub.cnt,
        'imageUrl', sub.img
      )
    ),
    '[]'::jsonb
  )
  INTO v_songs
  FROM (
    SELECT 
      song, 
      COUNT(*) AS cnt,
      MAX(song_image_url) AS img
    FROM public.daily_submissions
    WHERE campus_slug = p_campus_slug
      AND faculty_id = p_faculty_id
      AND song IS NOT NULL AND TRIM(song) <> ''
      AND (p_timeframe = 'all' OR submission_date >= v_start_date)
    GROUP BY song
    ORDER BY cnt DESC, song ASC
    LIMIT 5
  ) sub;

  -- Top Artistas
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', sub.artist,
        'count', sub.cnt,
        'imageUrl', sub.img
      )
    ),
    '[]'::jsonb
  )
  INTO v_artists
  FROM (
    SELECT 
      artist, 
      COUNT(*) AS cnt,
      MAX(artist_image_url) AS img
    FROM public.daily_submissions
    WHERE campus_slug = p_campus_slug
      AND faculty_id = p_faculty_id
      AND artist IS NOT NULL AND TRIM(artist) <> ''
      AND (p_timeframe = 'all' OR submission_date >= v_start_date)
    GROUP BY artist
    ORDER BY cnt DESC, artist ASC
    LIMIT 5
  ) sub;

  -- Top Películas
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', sub.movie,
        'count', sub.cnt,
        'imageUrl', sub.img
      )
    ),
    '[]'::jsonb
  )
  INTO v_movies
  FROM (
    SELECT 
      movie, 
      COUNT(*) AS cnt,
      MAX(movie_image_url) AS img
    FROM public.daily_submissions
    WHERE campus_slug = p_campus_slug
      AND faculty_id = p_faculty_id
      AND movie IS NOT NULL AND TRIM(movie) <> ''
      AND (p_timeframe = 'all' OR submission_date >= v_start_date)
    GROUP BY movie
    ORDER BY cnt DESC, movie ASC
    LIMIT 5
  ) sub;

  RETURN jsonb_build_object(
    'songs', v_songs,
    'artists', v_artists,
    'movies', v_movies,
    'totalVotes', v_total_votes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_faculty_rankings(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
