import apiClient from "./client";

/**
 * Pasante Inscripciones API - Gestión de inscripciones del pasante
 *
 * GET    /pasante/inscripciones           → listar inscripciones del pasante
 * GET    /pasante/inscripciones/:id       → detalle de inscripción
 * POST   /pasante/inscripciones/:id/confirmar → confirmar inscripción aceptada
 * POST   /pasante/inscripciones/:id/rechazar  → rechazar inscripción aceptada
 */

export const getInscripciones = async () => {
  const response = await apiClient.get("/pasante/inscripciones");
  return response.data;
};

export const getInscripcion = async (id) => {
  const response = await apiClient.get(`/pasante/inscripciones/${id}`);
  return response.data;
};

export const confirmarInscripcion = async (id) => {
  const response = await apiClient.post(`/pasante/inscripciones/${id}/confirmar`);
  return response.data;
};

export const rechazarInscripcion = async (id) => {
  const response = await apiClient.post(`/pasante/inscripciones/${id}/rechazar`);
  return response.data;
};
