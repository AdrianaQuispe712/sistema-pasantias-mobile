/**
 * PasanteDetailScreen - Perfil detallado de un pasante (rol Jefe)
 *
 * Muestra información del pasante, inscripciones activas,
 * actividades asignadas y resumen de rendimiento.
 *
 * @module screens/jefe/PasanteDetailScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import {
  Header,
  Card,
  Avatar,
  Badge,
  EmptyState,
  LoadingSpinner,
} from '../../components/ui';
import { getPasante } from '../../api/jefePasantes';

/**
 * Badge variant para estados de inscripción/actividad/pasante
 * Inscripciones: pendiente, aceptado, rechazado, completado
 * Pasantes: pendiente, aceptado, completado, abandono, rechazado
 * Actividades: asignada, en_progreso, completada
 * Nota: el backend retorna 'activo' hardcodeado — mapeamos a 'aceptado'
 */
const getStatusBadge = (estado) => {
  switch (estado) {
    case 'aceptado':
    case 'aceptada':
    case 'activo':   // backend hardcodea 'activo' para inscripciones aceptadas
      return { variant: 'success', label: 'Aceptado' };
    case 'pendiente':
    case 'pending':
      return { variant: 'warning', label: 'Pendiente' };
    case 'rechazado':
    case 'rechazada':
      return { variant: 'error', label: 'Rechazado' };
    case 'completado':
    case 'completada':
      return { variant: 'info', label: 'Completado' };
    case 'abandono':
      return { variant: 'error', label: 'Abandono' };
    case 'en_progreso':
    case 'en progreso':
    case 'asignada':
      return { variant: 'warning', label: 'En Progreso' };
    default:
      return { variant: 'neutral', label: estado || 'Sin estado' };
  }
};

const PasanteDetailScreen = ({ route, navigation }) => {
  const { pasanteId } = route?.params || {};

  const [pasante, setPasante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPasante = useCallback(async () => {
    if (!pasanteId) {
      setError('ID de pasante no proporcionado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getPasante(pasanteId);
      setPasante(data?.data || data);
    } catch {
      setError('No se pudo cargar la información del pasante');
    } finally {
      setLoading(false);
    }
  }, [pasanteId]);

  useEffect(() => {
    fetchPasante();
  }, [fetchPasante]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchPasante();
    });
    return unsubscribe;
  }, [navigation, fetchPasante]);

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header
          title="Perfil"
          subtitle="Pasante"
          leftIcon={<Text style={styles.backIcon}>←</Text>}
          onLeftPress={() => navigation?.goBack()}
        />
        <LoadingSpinner fullScreen message="Cargando perfil..." />
      </View>
    );
  }

  if (error || !pasante) {
    return (
      <View style={styles.screen}>
        <Header
          title="Perfil"
          subtitle="Pasante"
          leftIcon={<Text style={styles.backIcon}>←</Text>}
          onLeftPress={() => navigation?.goBack()}
        />
        <EmptyState
          icon={<Text style={styles.errorIcon}>⚠️</Text>}
          title="Error"
          subtitle={error || 'Pasante no encontrado'}
          actionLabel="Reintentar"
          onAction={fetchPasante}
        />
      </View>
    );
  }

  const nombre =
    pasante.nombre ||
    pasante.name ||
    `${pasante.nombre || ''} ${pasante.apellido || ''}`.trim();
  const email = pasante.email || pasante.correo || '';
  const telefono = pasante.telefono || pasante.phone || '';
  const estado = pasante.estado || 'pendiente';
  const badge = getStatusBadge(estado);

  // Rendimiento
  const rendimiento = pasante.rendimiento || pasante.performance || {};
  const actividadesCompletadas =
    rendimiento.actividades_completadas ?? pasante.actividades_completadas ?? 0;
  const actividadesTotales =
    rendimiento.actividades_totales ?? pasante.actividades_totales ?? 0;

  // Actividades
  const actividades = pasante.actividades || pasante.actividades_asignadas || [];
  const actividadesEnProgreso = actividades.filter(
    (a) => a.estado === 'en_progreso' || a.estado === 'asignada'
  ).length;

  return (
    <View style={styles.screen}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header ── */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar name={nombre} uri={pasante.avatar || pasante.foto} size="xl" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{nombre || 'Sin nombre'}</Text>
              {email ? <Text style={styles.profileEmail}>{email}</Text> : null}
              {telefono ? <Text style={styles.profilePhone}>{telefono}</Text> : null}
              <Badge variant={badge.variant} label={badge.label} size="sm" />
            </View>
          </View>
        </Card>

        {/* ── Performance Summary ── */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Rendimiento</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{actividadesCompletadas}</Text>
              <Text style={styles.statLabel}>Completadas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{actividadesEnProgreso}</Text>
              <Text style={styles.statLabel}>En Progreso</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{actividadesTotales}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </Card>

        {/* ── Actividades Asignadas ── */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Actividades Asignadas</Text>
          {actividades.length > 0 ? (
            actividades.map((actividad, index) => {
              const actBadge = getStatusBadge(actividad.estado);
              return (
                <View key={actividad.id || index} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle} numberOfLines={1}>
                      {actividad.titulo || actividad.nombre || 'Actividad'}
                    </Text>
                    {actividad.fecha_limite && (
                      <Text style={styles.listItemSubtitle}>
                        📅 {actividad.fecha_limite}
                      </Text>
                    )}
                  </View>
                  <Badge variant={actBadge.variant} label={actBadge.label} size="sm" />
                </View>
              );
            })
          ) : (
            <Text style={styles.noDataText}>No hay actividades asignadas</Text>
          )}
        </Card>
      </ScrollView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  backIcon: {
    color: colors.textOnPrimary,
    fontSize: typography.xl,
  },
  profileCard: {
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  profileName: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  profilePhone: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
  },
  statNumber: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.secondary,
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listItemContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  listItemTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  listItemSubtitle: {
    fontSize: typography.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  noDataText: {
    fontSize: typography.sm,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default PasanteDetailScreen;
