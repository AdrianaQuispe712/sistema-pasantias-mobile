import apiClient from "./client";

/**
 * Auth API - Endpoints de autenticación
 *
 * POST /api/login  → { email, password } → { user, token, token_type, role }
 * POST /api/logout → invalida token Sanctum
 * GET  /api/user   → retorna usuario autenticado
 */

export const login = async (email, password) => {
  const response = await apiClient.post("/login", { email, password });
  return response.data;
};

export const logout = async () => {
  try {
    await apiClient.post("/logout");
  } catch (error) {
    // Aunque falle el logout server-side, limpiamos local
    console.warn("Logout server falló, limpiando local:", error.message);
  }
};

export const getMe = async () => {
  const response = await apiClient.get("/user");
  return response.data;
};
