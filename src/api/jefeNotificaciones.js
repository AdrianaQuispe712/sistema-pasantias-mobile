import apiClient from "./client";

/**
 * Jefe Notificaciones API
 *
 * GET /jefe/notificaciones           → listar notificaciones
 * PUT /jefe/notificaciones/:id/read  → marcar como leída
 * GET /jefe/notificaciones/unread    → conteo de no leídas
 */

export const getNotificaciones = async () => {
  const response = await apiClient.get("/jefe/notificaciones");
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await apiClient.put(`/jefe/notificaciones/${id}/read`);
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await apiClient.get("/jefe/notificaciones/unread");
  return response.data;
};
