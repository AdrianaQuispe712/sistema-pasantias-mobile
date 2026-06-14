import apiClient from "./client";

/**
 * Jefe Observaciones API - Gestión de observaciones sobre bitácoras (rol jefe)
 *
 * GET  /jefe/actividades/:id/observaciones  → observaciones de una actividad
 * POST /jefe/actividades/:id/observaciones  → agregar observación
 */

export const getObservaciones = async (actividadId) => {
  const response = await apiClient.get(
    `/jefe/actividades/${actividadId}/observaciones`
  );
  return response.data;
};

export const createObservacion = async (actividadId, data) => {
  const response = await apiClient.post(
    `/jefe/actividades/${actividadId}/observaciones`,
    data
  );
  return response.data;
};
