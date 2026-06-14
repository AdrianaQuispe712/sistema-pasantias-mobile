import apiClient from "./client";

/**
 * Calendario API - Eventos del calendario del pasante
 *
 * GET /pasante/calendario → eventos del calendario
 */

export const getCalendario = async () => {
  const response = await apiClient.get("/pasante/calendario");
  return response.data;
};
