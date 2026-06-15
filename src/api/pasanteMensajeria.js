import apiClient from "./client";

/**
 * Pasante Mensajería API - Chat entre pasante y jefe de pasante
 *
 * GET  /pasante/conversaciones              → listar conversaciones
 * POST /pasante/conversaciones              → crear/obtener conversación con jefe
 * GET  /pasante/conversaciones/:id          → obtener conversación con mensajes
 * POST /pasante/conversaciones/:id/typing   → indicador de escritura
 * POST /pasante/conversaciones/:id/read     → marcar como leído
 * GET  /pasante/mensajes/poll               → pollear nuevos mensajes
 * POST /pasante/mensajes                    → enviar mensaje
 */

// ─── Conversaciones ──────────────────────────────────────────

export const getConversaciones = async () => {
  const response = await apiClient.get("/pasante/conversaciones");
  return response.data;
};

export const createConversacion = async (data) => {
  const response = await apiClient.post("/pasante/conversaciones", data);
  return response.data;
};

export const getConversacion = async (id) => {
  const response = await apiClient.get(`/pasante/conversaciones/${id}`);
  return response.data;
};

export const sendTyping = async (id, typingBy = 'pasante') => {
  const response = await apiClient.post(`/pasante/conversaciones/${id}/typing`, {
    typing_by: typingBy,
  });
  return response.data;
};

export const markConversationRead = async (id) => {
  const response = await apiClient.post(`/pasante/conversaciones/${id}/read`);
  return response.data;
};

// ─── Mensajes ────────────────────────────────────────────────

export const pollMensajes = async () => {
  const response = await apiClient.get("/pasante/mensajes/poll");
  return response.data;
};

export const sendMensaje = async (data) => {
  const response = await apiClient.post("/pasante/mensajes", data);
  return response.data;
};
