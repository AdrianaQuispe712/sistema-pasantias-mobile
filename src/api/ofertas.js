import apiClient from "./client";

/**
 * Ofertas API - Endpoints de ofertas de pasantía (rol pasante)
 *
 * GET  /pasante/ofertas          → listar ofertas disponibles
 * GET  /pasante/ofertas/:id      → detalle de una oferta
 * POST /pasante/ofertas/:id/postular → postularse a una oferta
 */

export const getOfertas = async () => {
  const response = await apiClient.get("/pasante/ofertas");
  return response.data;
};

export const getOferta = async (id) => {
  const response = await apiClient.get(`/pasante/ofertas/${id}`);
  return response.data;
};

export const postularse = async (id) => {
  const response = await apiClient.post(`/pasante/ofertas/${id}/postular`);
  return response.data;
};
