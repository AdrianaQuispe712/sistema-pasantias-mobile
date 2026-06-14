import apiClient from "./client";

/**
 * Jefe Actividades API - Gestión de actividades (rol jefe)
 *
 * GET  /jefe/actividades              → todas las actividades
 * GET  /jefe/actividades/disponibles  → actividades disponibles para asignar
 * GET  /jefe/actividades/mias         → actividades del jefe
 * GET  /jefe/actividades/completadas  → actividades completadas
 * GET  /jefe/actividades/:id          → detalle de actividad
 * POST /jefe/actividades              → crear actividad
 * POST /jefe/actividades/:id/asignar  → asignar actividad a pasante
 * POST /jefe/actividades/:id/completar → marcar como completada
 * POST /jefe/actividades/:id/descompletar → revertir completada
 * POST /jefe/actividades/:id/desasignar  → desasignar actividad
 */

export const getActividades = async () => {
  const response = await apiClient.get("/jefe/actividades");
  return response.data;
};

export const getDisponibles = async () => {
  const response = await apiClient.get("/jefe/actividades/disponibles");
  return response.data;
};

export const getMias = async () => {
  const response = await apiClient.get("/jefe/actividades/mias");
  return response.data;
};

export const getCompletadas = async () => {
  const response = await apiClient.get("/jefe/actividades/completadas");
  return response.data;
};

export const getActividad = async (id) => {
  const response = await apiClient.get(`/jefe/actividades/${id}`);
  return response.data;
};

export const createActividad = async (data) => {
  const response = await apiClient.post("/jefe/actividades", data);
  return response.data;
};

export const asignar = async (id, data) => {
  const response = await apiClient.post(`/jefe/actividades/${id}/asignar`, data);
  return response.data;
};

export const completar = async (id) => {
  const response = await apiClient.post(`/jefe/actividades/${id}/completar`);
  return response.data;
};

export const descompletar = async (id) => {
  const response = await apiClient.post(`/jefe/actividades/${id}/descompletar`);
  return response.data;
};

export const desasignar = async (id) => {
  const response = await apiClient.post(`/jefe/actividades/${id}/desasignar`);
  return response.data;
};
