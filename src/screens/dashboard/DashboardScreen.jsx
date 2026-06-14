import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";

/**
 * DashboardScreen - Pantalla principal post-login
 *
 * Muestra información básica del usuario y su rol.
 * Desde aquí se navega a las funcionalidades específicas de cada rol.
 *
 * Este es un DASHBOARD BASE — cada rol tendrá sus propias pantallas
 * que se agregarán al navigator según el rol del usuario.
 */

const ROLE_LABELS = {
  admin: "Administrador",
  pasante: "Pasante",
  gerente: "Gerente",
  jefepasante: "Jefe de Pasante",
  tutor: "Tutor",
};

const ROLE_COLORS = {
  admin: "#DC2626",
  pasante: "#059669",
  gerente: "#F07020",
  jefepasante: "#D97706",
  tutor: "#2563EB",
};

export default function DashboardScreen() {
  const { user, role, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: ROLE_COLORS[role] || "#6B7280" },
          ]}
        >
          <Text style={styles.roleText}>{ROLE_LABELS[role] || role}</Text>
        </View>
        <Text style={styles.welcome}>
          Hola, {user?.nombre} {user?.apellido}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Stats placeholder — acá van las cards de cada rol */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>—</Text>
          <Text style={styles.statLabel}>Próximamente</Text>
        </View>
      </View>

      {/* Logout */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 20,
  },
  headerCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  roleText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  welcome: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#6B7280",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1E6FD9",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
