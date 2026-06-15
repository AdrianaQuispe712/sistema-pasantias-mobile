/**
 * JefeDashboardScreen - Dashboard del Jefe de Pasantes
 *
 * Muestra estadísticas clave:
 * - Total de actividades asignadas
 * - Actividades en progreso / completadas / disponibles
 * - Total de pasantes activos
 *
 * @module screens/jefe/DashboardScreen
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Card, LoadingSpinner, EmptyState } from '../../components/ui';
import { getDashboard } from '../../api/jefeDashboard';

const DashboardScreen = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const response = await getDashboard();
      setStats(response?.data || response || {});
    } catch {
      setError('No se pudieron cargar las estadísticas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <LoadingSpinner fullScreen message="Cargando estadísticas..." />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Text style={styles.emptyIcon}>⚠️</Text>}
          title="Error al cargar"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={fetchDashboard}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <Text style={styles.greeting}>
          Hola, {user?.nombre || 'Jefe'}
        </Text>
        <Text style={styles.subtitle}>Resumen de tu gestión</Text>

        {/* Sección: Actividades */}
        <Text style={styles.sectionTitle}>Actividades</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Total" value={stats.totalActividades || 0} color={colors.primary} />
          <StatCard label="Disponibles" value={stats.actividadesDisponibles || 0} color={colors.warning} />
          <StatCard label="En Progreso" value={stats.actividadesEnProgreso || 0} color={colors.secondary} />
          <StatCard label="Completadas" value={stats.actividadesCompletadas || 0} color={colors.success} />
        </View>

        {/* Sección: Pasantes */}
        <Text style={styles.sectionTitle}>Pasantes</Text>
        <View style={styles.statsRow}>
          <View style={styles.statsRowCard}>
            <Text style={styles.statsRowValue}>{stats.totalPasantes || 0}</Text>
            <Text style={styles.statsRowLabel}>Pasantes Activos</Text>
          </View>
          <View style={styles.statsRowCard}>
            <Text style={styles.statsRowValue}>{stats.pasantesActivos || 0}</Text>
            <Text style={styles.statsRowLabel}>Bajo mi Supervisión</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Tarjeta de estadística individual (grid 2x2)
 */
const StatCard = ({ label, value, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  greeting: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  // Grid 2x2
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: typography.xxxl,
    fontWeight: typography.extrabold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  // Row cards (pasantes)
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsRowCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  statsRowValue: {
    fontSize: typography.xxl,
    fontWeight: typography.extrabold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statsRowLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 48,
  },
});

export default DashboardScreen;
