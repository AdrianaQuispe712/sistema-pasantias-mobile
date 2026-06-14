import apiClient from "./client";

/**
 * Evidencias API - Subida y consulta de evidencias
 *
 * POST /pasante/evidencias           → subir evidencia (multipart/form-data)
 * GET  /pasante/evidencias?idActividad=X → evidencias de una actividad
 *
 * Nota: uploadEvidencia usa FormData para enviar archivos.
 * El Content-Type multipart se establece automáticamente por axios al detectar FormData.
 */

export const uploadEvidencia = async (formData) => {
  const response = await apiClient.post("/pasante/evidencias", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getEvidencias = async (actividadId) => {
  const response = await apiClient.get("/pasante/evidencias", {
    params: { idActividad: actividadId },
  });
  return response.data;
};
