/**
 * avatarColors - Paleta de colores para avatares con iniciales
 *
 * Asigna un color CONSISTENTE basado en el nombre del usuario.
 * Mismo nombre → mismo color siempre (no es aleatorio cada render).
 *
 * Colores de la paleta del proyecto, respetando teoría del color:
 * - Celeste saturado, Azul medio, Naranja, Ámbar, Verde
 * - Todos con buen contraste (≥4.5:1) sobre texto blanco
 *
 * @module utils/avatarColors
 */

import { colors } from '../theme';

const AVATAR_PALETTE = [
  { bg: colors.accent,      text: colors.white },  // Celeste (#3DA0F0)
  { bg: colors.secondary,   text: colors.white },  // Azul (#1E6FD9)
  { bg: colors.orange,      text: colors.white },  // Naranja (#F07020)
  { bg: colors.amber,       text: colors.grayDark },// Ámbar (#F5A623) — texto oscuro por contraste
  { bg: colors.success,     text: colors.white },  // Verde (#10B981)
];

/**
 * Genera un hash simple y positivo a partir de un string.
 * Usa djb2 — rápido, distribuido, determinístico.
 */
const hashString = (str) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convertir a 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Retorna { bg, text } para un nombre dado.
 * @param {string} name - Nombre completo del usuario
 * @returns {{ bg: string, text: string }}
 */
export const getAvatarColor = (name) => {
  if (!name) return AVATAR_PALETTE[0];
  const index = hashString(name.toLowerCase().trim()) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
};
