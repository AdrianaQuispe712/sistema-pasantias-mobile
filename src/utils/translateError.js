/**
 * Traduce mensajes de error del backend (inglés → español)
 *
 * El monolito Laravel devuelve mensajes en inglés.
 * Esta función mapea frases comunes a español.
 */
export const translateError = (message) => {
  if (!message) return 'Error desconocido.';

  let translated = message;

  // Reemplazos de frases comunes
  const replacements = [
    ['is required', 'es obligatorio'],
    ['must be a number', 'debe ser un número'],
    ['must be at least', 'debe ser al menos'],
    ['must be a valid date', 'debe ser una fecha válida'],
    ['has already been taken', 'ya está en uso'],
    ['The given data was invalid', 'Los datos enviados no son válidos'],
    ['field is required', 'es obligatorio'],
    ['field must be', 'debe ser'],
  ];

  for (const [eng, esp] of replacements) {
    translated = translated.replace(new RegExp(eng, 'gi'), esp);
  }

  // Traducir nombres de campos comunes
  const fieldNames = [
    ['idActividad', 'ID de actividad'],
    ['actividadId', 'ID de actividad'],
    ['actividad_id', 'ID de actividad'],
    ['fecha', 'Fecha'],
    ['porcentaje', 'Porcentaje'],
    ['horasTrabajadas', 'Horas trabajadas'],
    ['horas_trabajadas', 'Horas trabajadas'],
    ['observacion', 'Observación'],
    ['descripcion', 'Descripción'],
    ['archivo', 'Archivo'],
    ['tipo', 'Tipo'],
    ['contenido', 'Contenido'],
  ];

  for (const [eng, esp] of fieldNames) {
    translated = translated.replace(new RegExp(`\\b${eng}\\b`, 'gi'), esp);
  }

  // Limpiar "The" inicial
  translated = translated.replace(/^The /i, 'El campo ');
  translated = translated.replace(/^the /i, 'el campo ');

  return translated.charAt(0).toUpperCase() + translated.slice(1);
};

export default translateError;
