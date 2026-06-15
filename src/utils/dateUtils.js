/**
 * Utilidades de formateo de fechas
 *
 * Centraliza todo el formateo de fechas en un solo lugar.
 * Soporta: ISO strings, timestamps, Date objects.
 * Si falla el parseo, devuelve el valor original como fallback.
 */

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Formatea una fecha a formato dd/mm/aaaa
 *
 * @param {string|Date|number} value - Fecha en cualquier formato (ISO, timestamp, Date)
 * @returns {string} Fecha formateada (ej. "14/06/2026") o string vacío si es null/undefined
 *
 * Ejemplos:
 *   formatDate("2026-06-14")          → "14/06/2026"
 *   formatDate("2026-06-14T15:30:00") → "14/06/2026"
 *   formatDate(null)                  → ""
 */
export const formatDate = (value) => {
  if (!value) return '';

  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return String(value);
  }
};

/**
 * Formatea una fecha a formato largo: "14 de Junio, 2026"
 *
 * @param {string|Date|number} value - Fecha en cualquier formato
 * @returns {string} Fecha formateada en formato largo
 */
export const formatDateLong = (value) => {
  if (!value) return '';

  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);

    const day = d.getDate();
    const month = MESES[d.getMonth()];
    const year = d.getFullYear();

    if (!month) return formatDate(value);

    return `${day} de ${month}, ${year}`;
  } catch {
    return String(value);
  }
};

/**
 * Formatea una fecha a "dd de Mes, aaaa" (sin coma antes del año)
 *
 * @param {string|Date|number} value - Fecha en cualquier formato
 * @returns {string} Fecha formateada (ej. "14 de Junio 2026")
 */
export const formatDateReadable = (value) => {
  if (!value) return '';

  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);

    const day = d.getDate();
    const month = MESES[d.getMonth()];
    const year = d.getFullYear();

    if (!month) return formatDate(value);

    return `${day} de ${month} ${year}`;
  } catch {
    return String(value);
  }
};

export default formatDate;
