import apiClient from "./client";

/**
 * Bitácoras API - CRUD de bitácoras del pasante
 *
 * GET    /pasante/bitacoras      → listar bitácoras
 * POST   /pasante/bitacoras      → crear bitácora
 * PUT    /pasante/bitacoras/:id  → actualizar bitácora
 * DELETE /pasante/bitacoras/:id  → eliminar bitácora
 */

export const getBitacoras = async () => {
  const response = await apiClient.get("/pasante/bitacoras");
  return response.data;
};

export const createBitacora = async (data) => {
  const response = await apiClient.post("/pasante/bitacoras", data);
  return response.data;
};

export const updateBitacora = async (id, data) => {
  const response = await apiClient.put(`/pasante/bitacoras/${id}`, data);
  return response.data;
};

export const deleteBitacora = async (id) => {
  const response = await apiClient.delete(`/pasante/bitacoras/${id}`);
  return response.data;
};
