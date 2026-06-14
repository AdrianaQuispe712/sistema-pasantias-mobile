import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

/**
 * App.js - Punto de entrada
 *
 * Estructura:
 * - AuthProvider: provee estado de autenticación global
 * - AppNavigator: maneja navegación según estado de auth
 * - StatusBar: estilo consistente
 *
 * Por qué App.js es tan limpio?
 * - Separación de responsabilidades
 * - App.js solo monta providers y navigator
 * - Toda la lógica vive en sus módulos correspondientes
 */

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="light" />
    </AuthProvider>
  );
}
