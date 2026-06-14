import apiClient from "./client";

/**
 * Gerente Ofertas API - Gestión de ofertas (rol gerente)
 *
 * GET    /gerente/ofertas               → listar ofertas
 * POST   /gerente/ofertas               → crear oferta
 * GET    /gerente/ofertas/:id           → detalle de oferta
 * PUT    /gerente/ofertas/:id           → actualizar oferta
 * DELETE /gerente/ofertas/:id           → eliminar oferta
 * PUT    /gerente/ofertas/:id/cerrar    → toggle cerrar oferta
 * PUT    /gerente/ofertas/:id/activar   → toggle activar oferta
 * PUT    /gerente/ofertas/:id/terminar  → toggle terminar oferta
 * GET    /gerente/ofertas/:id/postulantes → postulantes de una oferta
 * GET    /gerente/ofertas/:id/check-informes → verificar si puede terminar
 * GET    /gerente/ofertas/vacantes/list → listar vacantes
 *
 * Validación de eliminación: se usa GET /postulantes para verificar
 * que no haya inscripciones aceptadas antes de permitir la eliminación.
 */

export const getOfertas = async () => {
  const response = await apiClient.get("/gerente/ofertas");
  return response.data;
};

export const getOferta = async (id) => {
  const response = await apiClient.get(`/gerente/ofertas/${id}`);
  return response.data;
};

export const toggleCerrar = async (id) => {
  const response = await apiClient.put(`/gerente/ofertas/${id}/cerrar`);
  return response.data;
};

export const toggleActivar = async (id) => {
  const response = await apiClient.put(`/gerente/ofertas/${id}/activar`);
  return response.data;
};

export const toggleTerminar = async (id) => {
  const response = await apiClient.put(`/gerente/ofertas/${id}/terminar`);
  return response.data;
};

export const getPostulantes = async (id) => {
  const response = await apiClient.get(`/gerente/ofertas/${id}/postulantes`);
  return response.data;
};

/**
 * Verificar si una oferta puede ser terminada.
 * Retorna { puede_terminar: boolean, total: number, sin_informe: number }
 */
export const checkInformes = async (id) => {
  const response = await apiClient.get(`/gerente/ofertas/${id}/check-informes`);
  return response.data;
};

export const getVacantes = async () => {
  const response = await apiClient.get("/gerente/ofertas/vacantes/list");
  return response.data;
};

export const createOferta = async (data) => {
  const response = await apiClient.post("/gerente/ofertas", data);
  return response.data;
};

export const updateOferta = async (id, data) => {
  const response = await apiClient.put(`/gerente/ofertas/${id}`, data);
  return response.data;
};

export const deleteOferta = async (id) => {
  const response = await apiClient.delete(`/gerente/ofertas/${id}`);
  return response.data;
};
