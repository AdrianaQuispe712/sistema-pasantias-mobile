import apiClient from "./client";

/**
 * Gerente Inscripciones API - Gestión de inscripciones (rol gerente)
 *
 * GET /gerente/inscripciones           → listar inscripciones
 * GET /gerente/inscripciones/:id       → detalle de inscripción
 * PUT /gerente/inscripciones/:id/aprobar → aprobar inscripción
 * PUT /gerente/inscripciones/:id/rechazar → rechazar inscripción
 */

export const getInscripciones = async () => {
  const response = await apiClient.get("/gerente/inscripciones");
  return response.data;
};

export const getInscripcion = async (id) => {
  const response = await apiClient.get(`/gerente/inscripciones/${id}`);
  return response.data;
};

export const aprobar = async (id) => {
  const response = await apiClient.put(`/gerente/inscripciones/${id}/aprobar`);
  return response.data;
};

export const rechazar = async (id) => {
  const response = await apiClient.put(`/gerente/inscripciones/${id}/rechazar`);
  return response.data;
};
