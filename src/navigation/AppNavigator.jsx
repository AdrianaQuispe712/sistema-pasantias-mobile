import { ActivityIndicator, View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography } from "../theme";

// Screens
import LoginScreen from "../screens/auth/LoginScreen";

// Role Navigators
import PasanteNavigator from "./PasanteNavigator";
import JefeNavigator from "./JefeNavigator";
import GerenteNavigator from "./GerenteNavigator";

/**
 * AppNavigator - Navegación basada en estado de autenticación
 *
 * Flujo:
 * 1. isLoading → Splash/Loading screen with branding
 * 2. No autenticado → AuthStack (Login)
 * 3. Autenticado → RoleStack:
 *    - pasante / jefepasante → PasanteNavigator
 *    - jefepasante → JefeNavigator
 *    - gerente → GerenteNavigator
 *    - admin → fallback to PasanteNavigator
 *
 * Structure:
 * - Single NavigationContainer (React Navigation requirement)
 * - AuthStack for unauthenticated users
 * - Role-specific navigators for authenticated users
 */

const Stack = createNativeStackNavigator();

/**
 * Splash / Loading screen shown during auth state resolution
 */
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingCard}>
      <Image
        source={require("../../assets/logo.png")}
        style={styles.loadingLogo}
        resizeMode="contain"
      />
      <Text style={styles.loadingSubtitle}>Cargando...</Text>
    </View>
    <ActivityIndicator
      size="large"
      color={colors.white}
      style={styles.spinner}
    />
  </View>
);

/**
 * Auth stack — shown when user is NOT authenticated
 */
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

/**
 * Maps role strings to their corresponding navigator components.
 * ONLY pasante, jefepasante, and gerente are supported on mobile.
 */
const ROLE_NAVIGATORS = {
  pasante: PasanteNavigator,
  jefepasante: JefeNavigator,
  gerente: GerenteNavigator,
};

/**
 * Unsupported role screen — shown when admin/tutor tries to use the mobile app
 */
const UnsupportedRoleScreen = () => {
  const { user, role, logout } = useAuth();

  const roleNames = {
    admin: "Administrador",
    tutor: "Tutor",
  };

  return (
    <View style={styles.unsupportedContainer}>
      <Ionicons name="phone-portrait-outline" size={64} color={colors.primary} />
      <Text style={styles.unsupportedTitle}>Acceso no disponible</Text>
      <Text style={styles.unsupportedText}>
        Hola {user?.nombre}, tu rol es{" "}
        <Text style={styles.unsupportedRole}>
          {roleNames[role] || role}
        </Text>
        .
      </Text>
      <Text style={styles.unsupportedSubtext}>
        La app móvil solo está disponible para Pasantes, Jefes de Pasante y Gerentes.{"\n"}
        Usá la plataforma web para acceder con tu rol.
      </Text>
      <TouchableOpacity style={styles.unsupportedButton} onPress={logout}>
        <Text style={styles.unsupportedButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * App stack — renders the correct navigator based on user role
 */
const AppStack = () => {
  const { role } = useAuth();

  const RoleNavigator = ROLE_NAVIGATORS[role];

  if (!RoleNavigator) {
    return <UnsupportedRoleScreen />;
  }

  return <RoleNavigator />;
};

export default function AppNavigator() {
  const { isAuthenticated, isLoading, role, user } = useAuth();

  // DEBUG: verify correct navigator and code version
  console.warn('[AppNavigator v2] isAuth:', isAuthenticated, 'role:', role, 'user:', user?.email);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.accent,
  },
  loadingCard: {
    alignItems: "center",
    marginBottom: 32,
  },
  loadingLogo: {
    width: 320,
    height: 320,
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: typography.title,
    fontWeight: typography.bold,
    color: colors.primary,
    marginTop: 16,
    letterSpacing: 1,
  },
  loadingSubtitle: {
    fontSize: typography.md,
    color: colors.white,
    marginTop: 8,
  },
  spinner: {
    marginTop: 16,
  },
  // Unsupported role screen
  unsupportedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 32,
  },
  unsupportedTitle: {
    fontSize: 22,
    fontWeight: typography.bold,
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  unsupportedText: {
    fontSize: typography.md,
    color: colors.text,
    textAlign: "center",
    lineHeight: 24,
  },
  unsupportedRole: {
    fontWeight: typography.bold,
    color: colors.primary,
  },
  unsupportedSubtext: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
  unsupportedButton: {
    marginTop: 32,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  unsupportedButtonText: {
    color: colors.white,
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
});
