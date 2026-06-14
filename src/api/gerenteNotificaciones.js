import apiClient from "./client";

/**
 * Gerente Notificaciones API
 *
 * GET /gerente/notificaciones           → listar notificaciones
 * PUT /gerente/notificaciones/:id/read  → marcar como leída
 * GET /gerente/notificaciones/unread    → conteo de no leídas
 */

export const getNotificaciones = async () => {
  const response = await apiClient.get("/gerente/notificaciones");
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await apiClient.put(`/gerente/notificaciones/${id}/read`);
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await apiClient.get("/gerente/notificaciones/unread");
  return response.data;
};
