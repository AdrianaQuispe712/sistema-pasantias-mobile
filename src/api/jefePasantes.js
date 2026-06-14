import apiClient from "./client";

/**
 * Jefe Pasantes API - Consulta de pasantes (rol jefe)
 *
 * GET /jefe/pasantes     → listar pasantes
 * GET /jefe/pasantes/:id → detalle de un pasante
 */

export const getPasantes = async () => {
  const response = await apiClient.get("/jefe/pasantes");
  return response.data;
};

export const getPasante = async (id) => {
  const response = await apiClient.get(`/jefe/pasantes/${id}`);
  return response.data;
};
