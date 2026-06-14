/**
 * DashboardScreen - Pantalla principal del Gerente
 *
 * Reportes rápidos con estadísticas básicas:
 * - Ofertas (total, activas, cerradas, terminadas)
 * - Inscripciones (total, pendientes, aceptadas, rechazadas)
 * - Pasantes y Jefes
 *
 * @module screens/gerente/DashboardScreen
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
import { getDashboard } from '../../api/gerenteDashboard';

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
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
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
        {/* Sección: Ofertas */}
        <Text style={styles.sectionTitle}>Ofertas de Pasantía</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Total" value={stats.totalOfertas || 0} color={colors.primary} />
          <StatCard label="Activas" value={stats.ofertasActivas || 0} color={colors.success} />
          <StatCard label="Cerradas" value={stats.ofertasCerradas || 0} color={colors.orange} />
          <StatCard label="Terminadas" value={stats.ofertasTerminadas || 0} color={colors.grayMedium} />
        </View>

        {/* Sección: Inscripciones */}
        <Text style={styles.sectionTitle}>Inscripciones</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Total" value={stats.totalInscripciones || 0} color={colors.primary} />
          <StatCard label="Pendientes" value={stats.inscripcionesPendientes || 0} color={colors.warning} />
          <StatCard label="Aceptadas" value={stats.inscripcionesAceptadas || 0} color={colors.success} />
          <StatCard label="Rechazadas" value={stats.inscripcionesRechazadas || 0} color={colors.error} />
        </View>

        {/* Sección: Equipo */}
        <Text style={styles.sectionTitle}>Equipo</Text>
        <View style={styles.statsRow}>
          <View style={styles.statsRowCard}>
            <Text style={styles.statsRowValue}>{stats.totalPasantes || 0}</Text>
            <Text style={styles.statsRowLabel}>Pasantes</Text>
          </View>
          <View style={styles.statsRowCard}>
            <Text style={styles.statsRowValue}>{stats.totalJefes || 0}</Text>
            <Text style={styles.statsRowLabel}>Jefes de Pasante</Text>
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
  // Row cards (pasantes + jefes)
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
