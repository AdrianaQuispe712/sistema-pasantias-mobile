import axios from "axios";
import API_CONFIG from "../config/api";
import { getToken, clearAll } from "../storage/tokenStorage";

/**
 * API Client - Axios instance configurada para Sanctum
 *
 * Interceptores:
 * 1. Request: inyecta Bearer token automáticamente
 * 2 Response: maneja 401 (token expirado/inválido) → limpiar sesión
 *
 * Por qué Axios y no fetch?
 * - Interceptores nativos (fetch no los tiene)
 * - Mejor manejo de errores
 * - Interceptors de request/response son CRÍTICOS para auth
 */

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// REQUEST INTERCEPTOR: inyectar token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: manejar errores de auth
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado → limpiar todo
      await clearAll();
      // No hacemos navigate aquí porque no tenemos acceso al navigator
      // El AuthContext se encargará de detectar que no hay token
    }
    return Promise.reject(error);
  }
);

export default apiClient;
