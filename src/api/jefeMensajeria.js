import apiClient from "./client";

// Conversaciones
export const getConversaciones = async () => {
  const response = await apiClient.get("/jefe/conversaciones");
  return response.data;
};

export const createConversacion = async (data) => {
  const response = await apiClient.post("/jefe/conversaciones", data);
  return response.data;
};

export const getConversacion = async (id) => {
  const response = await apiClient.get(`/jefe/conversaciones/${id}`);
  return response.data;
};

export const sendTyping = async (id, typingBy = 'jefe') => {
  const response = await apiClient.post(`/jefe/conversaciones/${id}/typing`, {
    typing_by: typingBy,
  });
  return response.data;
};

export const markConversationRead = async (id) => {
  const response = await apiClient.post(`/jefe/conversaciones/${id}/read`);
  return response.data;
};

// Mensajes
export const pollMensajes = async () => {
  const response = await apiClient.get("/jefe/mensajes/poll");
  return response.data;
};

export const sendMensaje = async (data) => {
  const response = await apiClient.post("/jefe/mensajes", data);
  return response.data;
};
