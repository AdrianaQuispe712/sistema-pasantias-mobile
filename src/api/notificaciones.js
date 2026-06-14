import apiClient from "./client";

/**
 * Notificaciones API - Gestión de notificaciones del pasante
 *
 * GET /pasante/notificaciones           → listar notificaciones
 * PUT /pasante/notificaciones/:id/read  → marcar como leída
 * GET /pasante/notificaciones/unread    → conteo de no leídas
 */

export const getNotificaciones = async () => {
  const response = await apiClient.get("/pasante/notificaciones");
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await apiClient.put(`/pasante/notificaciones/${id}/read`);
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await apiClient.get("/pasante/notificaciones/unread");
  return response.data;
};
