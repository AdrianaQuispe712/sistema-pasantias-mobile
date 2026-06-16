/**
 * PerfilScreen - Pantalla de perfil del usuario
 *
 * Muestra información del usuario logueado, su rol,
 * y opciones como cerrar sesión.
 *
 * @module screens/common/PerfilScreen
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

const ROLE_LABELS = {
  admin: 'Administrador',
  pasante: 'Pasante',
  gerente: 'Gerente',
  jefepasante: 'Jefe de Pasante',
  tutor: 'Tutor',
};

const PerfilScreen = () => {
  const { user, role, logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleEmpresa = () => {
    navigation?.navigate('Empresa');
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={['#F59E0B', '#F97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Ionicons name="person" size={48} color={colors.white} />
        </LinearGradient>
        <Text style={styles.name}>{user?.nombre || 'Usuario'}</Text>
        <Text style={styles.role}>{ROLE_LABELS[role] || role}</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email || '-'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="shield-outline" size={20} color={colors.primary} />
          <Text style={styles.infoLabel}>Rol</Text>
          <Text style={styles.infoValue}>{ROLE_LABELS[role] || role}</Text>
        </View>
      </View>

      {/* Empresa button - only for gerente role */}
      {role === 'gerente' && (
        <TouchableOpacity style={styles.empresaButton} onPress={handleEmpresa}>
          <Ionicons name="business-outline" size={20} color={colors.primary} />
          <Text style={styles.empresaText}>Información de Empresa</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.grayLight} />
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  role: {
    fontSize: typography.md,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.md,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoValue: {
    fontSize: typography.md,
    color: colors.text,
    fontWeight: typography.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.errorLight,
    ...shadows.sm,
  },
  empresaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  empresaText: {
    fontSize: typography.md,
    color: colors.primary,
    fontWeight: typography.medium,
    marginLeft: spacing.sm,
    flex: 1,
  },
  logoutText: {
    fontSize: typography.md,
    color: colors.error,
    fontWeight: typography.semibold,
    marginLeft: spacing.sm,
  },
});

export default PerfilScreen;
