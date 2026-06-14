import apiClient from "./client";

/**
 * Actividades API - Endpoints de actividades del pasante
 *
 * GET /pasante/actividades/mias   → actividades asignadas al pasante
 * GET /pasante/actividades/estado  → estado general de actividades
 */

export const getMisActividades = async () => {
  const response = await apiClient.get("/pasante/actividades/mias");
  return response.data;
};

export const getEstado = async () => {
  const response = await apiClient.get("/pasante/actividades/estado");
  return response.data;
};
