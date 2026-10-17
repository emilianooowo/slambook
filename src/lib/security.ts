/**
 * Utilidades de seguridad y sanitización de inputs.
 * Previene desbordamiento de memoria (buffer overflow en buffers/strings de Node),
 * inyección de scripts (XSS) y caracteres de control no válidos.
 */

export const MAX_LENGTHS = {
  SEARCH_QUERY: 100,
  TEXT_INPUT: 150,
  USERNAME: 40,
  EMAIL: 120,
  URL: 500,
} as const;

/**
 * Sanitiza una cadena de texto:
 * - Trunca a maxLength para evitar payloads excesivos (Memory Exhaustion / String buffer limits).
 * - Remueve caracteres de control (incluyendo null bytes \0 que afectan drivers de BD).
 * - Normaliza espacios en blanco.
 * - Escapa caracteres especiales básicos HTML para evitar stored XSS.
 */
export function sanitizeInput(raw: unknown, maxLength: number = MAX_LENGTHS.TEXT_INPUT): string {
  if (typeof raw !== 'string') {
    return '';
  }

  // 1. Truncado inmediato para frenar payloads de gran tamaño
  let clean = raw.slice(0, maxLength);

  // 2. Remover null bytes y caracteres de control ASCII (0x00 - 0x1F, 0x7F) excepto tab y newline
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 3. Normalizar espacios múltiples
  clean = clean.replace(/\s+/g, ' ').trim();

  // 4. Escapar delimitadores potencialmente peligrosos
  clean = clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return clean;
}

/**
 * Sanitiza términos de búsqueda para APIs externas (sin escape HTML para mantener la búsqueda fiel).
 */
export function sanitizeSearchQuery(query: unknown): string {
  if (typeof query !== 'string') return '';
  return query
    .slice(0, MAX_LENGTHS.SEARCH_QUERY)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Valida de forma estricta un nombre de usuario: alfanumérico, puntos, guiones bajos, 3 a 30 caracteres.
 */
export function isValidUsername(username: string): boolean {
  if (!username) return false;
  const regex = /^[a-zA-Z0-9._-]{3,30}$/;
  return regex.test(username);
}

/**
 * Valida URLs seguras para imágenes (deben ser HTTPS o data URI de imagen).
 */
export function sanitizeImageUrl(url: unknown): string | undefined {
  if (typeof url !== 'string' || !url.trim()) return undefined;
  const trimmed = url.trim().slice(0, MAX_LENGTHS.URL);

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
  } catch {
    // Si no es URL válida
  }

  return undefined;
}
