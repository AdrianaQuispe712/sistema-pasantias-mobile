import { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, logout as apiLogout } from "../api/auth";
import {
  saveToken,
  getToken,
  saveUser,
  getUser,
  clearAll,
} from "../storage/tokenStorage";
import API_CONFIG from "../config/api";

/**
 * AuthContext - Estado global de autenticación
 *
 * Flujo:
 * 1. App inicia → checkAuth() busca token guardado
 * 2. Si hay token → valida con /api/user → restaura sesión
 * 3. Si no hay token → muestra LoginScreen
 * 4. Login → guarda token + user → navega a Dashboard
 * 5. Logout → invalida token server → limpia storage → navega a Login
 *
 * Por qué Context y no Redux/Zustand?
 * - Auth es un caso de uso simple: login/logout/state
 * - Context + useReducer es suficiente para esto
 * - No necesitás un state manager completo para auth
 * - Menos dependencias = menos mantenimiento
 */

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sesión al iniciar la app
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = await getToken();
      if (savedToken) {
        const savedUser = await getUser();
        if (savedUser) {
          // Validate token against server before restoring session
          try {
            const response = await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/api/user`, {
              headers: {
                Authorization: `Bearer ${savedToken}`,
                Accept: 'application/json',
              },
            });

            if (response.ok) {
              const userData = await response.json();
              // Update user data from server (in case role changed)
              const freshUser = { ...userData, role: userData.role || savedUser.role };
              setToken(savedToken);
              setUser(freshUser);
              setRole(freshUser.role);
              await saveUser(freshUser);
            } else {
              // Token invalid/expired → clear everything
              console.log('Token inválido, limpiando sesión...');
              await clearAll();
            }
          } catch (networkError) {
            // Server unreachable → use cached data as fallback
            console.warn('Servidor no disponible, usando datos en caché:', networkError.message);
            setToken(savedToken);
            setUser(savedUser);
            setRole(savedUser.role);
          }
        }
      }
    } catch (error) {
      console.error("Error verificando auth:", error);
      await clearAll();
    } finally {
      setIsLoading(false);
    }
  };

  // Solo estos roles pueden usar la app móvil
  const ALLOWED_ROLES = ["pasante", "jefepasante", "gerente"];

  const login = async (email, password) => {
    try {
      const data = await apiLogin(email, password);

      // Validar que el rol esté permitido en la app móvil
      if (!ALLOWED_ROLES.includes(data.role)) {
        const roleNames = {
          admin: "Administrador",
          tutor: "Tutor",
        };
        const roleName = roleNames[data.role] || data.role;
        return {
          success: false,
          message: `La app móvil solo está disponible para Pasantes, Jefes de Pasante y Gerentes. Tu rol (${roleName}) no tiene acceso desde el celular. Usá la plataforma web.`,
        };
      }

      // Guardar en storage
      await saveToken(data.token);
      await saveUser({ ...data.user, role: data.role });

      // Actualizar estado
      setToken(data.token);
      setUser({ ...data.user, role: data.role });
      setRole(data.role);

      return { success: true, role: data.role };
    } catch (error) {
      console.error("LOGIN ERROR:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Traducir errores técnicos a mensajes amigables
      let message;

      if (error.response?.status === 401 || error.response?.status === 422) {
        // Credenciales incorrectas
        message = 'Credenciales incorrectas. Verificá tu email y contraseña.';
      } else if (error.message?.includes('Network') || error.code === 'ERR_NETWORK') {
        message = 'Error de conexión. Verificá tu internet.';
      } else {
        message = error.response?.data?.message || error.message || 'Error al iniciar sesión';
        // Si el mensaje viene en inglés del backend, dar uno genérico
        if (message.includes('credentials') || message.includes('Credentials')) {
          message = 'Credenciales incorrectas. Verificá tu email y contraseña.';
        }
      }

      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      await clearAll();
      setToken(null);
      setUser(null);
      setRole(null);
    }
  };

  const value = {
    user,
    token,
    role,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
