/**
 * ActividadDetailScreen - Detalle de una actividad (rol Jefe)
 *
 * Muestra información completa de la actividad, su asignado,
 * bitácoras del pasante y permite agregar observaciones.
 *
 * @module screens/jefe/ActividadDetailScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import {
  Header,
  Card,
  Badge,
  Button,
  Avatar,
  EmptyState,
  LoadingSpinner,
} from '../../components/ui';
import {
  getActividad,
  completar,
  descompletar,
  desasignar,
} from '../../api/jefeActividades';
import { getObservaciones } from '../../api/jefeObservaciones';

/**
 * Badge variant según estado
 */
const getStatusBadge = (estado) => {
  switch (estado) {
    case 'disponible':
      return { variant: 'info', label: 'Disponible' };
    case 'asignada':
    case 'en_progreso':
      return { variant: 'warning', label: 'En Progreso' };
    case 'completada':
      return { variant: 'success', label: 'Completada' };
    default:
      return { variant: 'neutral', label: estado || 'Desconocido' };
  }
};

const ActividadDetailScreen = ({ route, navigation }) => {
  const { actividadId } = route?.params || {};

  const [actividad, setActividad] = useState(null);
  const [observaciones, setObservaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async () => {
    if (!actividadId) {
      setError('ID de actividad no proporcionado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [actividadData, obsData] = await Promise.all([
        getActividad(actividadId),
        getObservaciones(actividadId).catch(() => []),
      ]);

      setActividad(actividadData?.data || actividadData);
      setObservaciones(
        Array.isArray(obsData) ? obsData : obsData?.data || []
      );
    } catch (err) {
      console.error('Error fetching activity detail:', err);
      setError('No se pudo cargar el detalle de la actividad');
    } finally {
      setLoading(false);
    }
  }, [actividadId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCompletar = () => {
    Alert.alert('Completar Actividad', '¿Marcar esta actividad como completada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Completar',
        onPress: async () => {
          try {
            setActionLoading('completar');
            await completar(actividadId);
            Alert.alert('Éxito', 'Actividad completada');
            fetchData();
          } catch (err) {
            Alert.alert('Error', 'No se pudo completar la actividad');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleDescompletar = () => {
    Alert.alert('Revertir Completado', '¿Deshacer el estado de completada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Revertir',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading('descompletar');
            await descompletar(actividadId);
            Alert.alert('Éxito', 'Estado revertido');
            fetchData();
          } catch (err) {
            Alert.alert('Error', 'No se pudo revertir el estado');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleDesasignar = () => {
    Alert.alert(
      'Desasignar Actividad',
      '¿Desea desasignar esta actividad del pasante actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desasignar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading('desasignar');
              await desasignar(actividadId);
              Alert.alert('Éxito', 'Actividad desasignada');
              navigation?.goBack();
            } catch (err) {
              Alert.alert('Error', 'No se pudo desasignar la actividad');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const navigateToAddObservation = () => {
    navigation?.navigate('Observacion', { actividadId });
  };

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header
          title="Detalle"
          subtitle="Actividad"
          leftIcon={<Text style={styles.backIcon}>←</Text>}
          onLeftPress={() => navigation?.goBack()}
        />
        <LoadingSpinner fullScreen message="Cargando actividad..." />
      </View>
    );
  }

  if (error || !actividad) {
    return (
      <View style={styles.screen}>
        <Header
          title="Detalle"
          subtitle="Actividad"
          leftIcon={<Text style={styles.backIcon}>←</Text>}
          onLeftPress={() => navigation?.goBack()}
        />
        <EmptyState
          icon={<Text style={styles.errorIcon}>⚠️</Text>}
          title="Error"
          subtitle={error || 'Actividad no encontrada'}
          actionLabel="Reintentar"
          onAction={fetchData}
        />
      </View>
    );
  }

  const badge = getStatusBadge(actividad.estado);
  const isCompleted = actividad.estado === 'completada';
  const isAssigned = actividad.pasante_nombre || actividad.pasante;

  return (
    <View style={styles.screen}>
      <Header
        title="Detalle Actividad"
        subtitle={actividad.titulo || actividad.nombre || ''}
        leftIcon={<Text style={styles.backIcon}>←</Text>}
        onLeftPress={() => navigation?.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Info Card ── */}
        <Card variant="default" style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {actividad.titulo || actividad.nombre || 'Sin título'}
            </Text>
            <Badge variant={badge.variant} label={badge.label} size="sm" />
          </View>

          {actividad.descripcion ? (
            <Text style={styles.description}>{actividad.descripcion}</Text>
          ) : null}

          <View style={styles.infoGrid}>
            {actividad.fecha_limite || actividad.fechaLimite ? (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fecha Límite</Text>
                <Text style={styles.infoValue}>
                  {actividad.fecha_limite || actividad.fechaLimite}
                </Text>
              </View>
            ) : null}
            {actividad.empresa ? (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Empresa</Text>
                <Text style={styles.infoValue}>{actividad.empresa}</Text>
              </View>
            ) : null}
            {actividad.horas ? (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Horas</Text>
                <Text style={styles.infoValue}>{actividad.horas}h</Text>
              </View>
            ) : null}
          </View>
        </Card>

        {/* ── Asignado Card ── */}
        {isAssigned && (
          <Card variant="default" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Asignado a</Text>
            <View style={styles.assigneeRow}>
              <Avatar
                name={actividad.pasante_nombre || actividad.pasante || ''}
                size="lg"
              />
              <View style={styles.assigneeInfo}>
                <Text style={styles.assigneeName}>
                  {actividad.pasante_nombre || actividad.pasante}
                </Text>
                {actividad.pasante_email && (
                  <Text style={styles.assigneeEmail}>
                    {actividad.pasante_email}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* ── Bitácoras Card ── */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Bitácoras del Pasante</Text>
          {actividad.bitacoras && actividad.bitacoras.length > 0 ? (
            actividad.bitacoras.map((bitacora, index) => (
              <View key={bitacora.id || index} style={styles.bitacoraItem}>
                <Text style={styles.bitacoraDate}>
                  {bitacora.fecha || bitacora.created_at || ''}
                </Text>
                <Text style={styles.bitacoraContent}>
                  {bitacora.contenido || bitacora.descripcion || bitacora.texto || ''}
                </Text>
                {bitacora.horas ? (
                  <Text style={styles.bitacoraHours}>
                    Horas: {bitacora.horas}
                  </Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No hay bitácoras registradas</Text>
          )}
        </Card>

        {/* ── Observaciones Card ── */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Observaciones</Text>
          {observaciones.length > 0 ? (
            observaciones.map((obs, index) => (
              <View key={obs.id || index} style={styles.obsItem}>
                <Text style={styles.obsContent}>
                  {obs.contenido || obs.texto || obs.observacion || ''}
                </Text>
                {obs.satisfaccion !== undefined && obs.satisfaccion !== null && (
                  <View style={styles.obsSatisfaction}>
                    <Text style={styles.obsSatisfactionLabel}>Satisfacción:</Text>
                    <Text style={styles.obsSatisfactionValue}>
                      {obs.satisfaccion}%
                    </Text>
                  </View>
                )}
                <Text style={styles.obsDate}>
                  {obs.fecha || obs.created_at || ''}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No hay observaciones aún</Text>
          )}

          <Button
            variant="secondary"
            size="sm"
            title="Agregar Observación"
            onPress={navigateToAddObservation}
            style={styles.addObsButton}
          />
        </Card>

        {/* ── Action Buttons ── */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          <View style={styles.actionsGrid}>
            {!isCompleted ? (
              <Button
                variant="primary"
                title="Completar"
                loading={actionLoading === 'completar'}
                disabled={actionLoading !== null}
                onPress={handleCompletar}
                fullWidth
                style={styles.actionButton}
              />
            ) : (
              <Button
                variant="outline"
                title="Descompletar"
                loading={actionLoading === 'descompletar'}
                disabled={actionLoading !== null}
                onPress={handleDescompletar}
                fullWidth
                style={styles.actionButton}
              />
            )}

            {isAssigned && (
              <Button
                variant="ghost"
                title="Desasignar"
                loading={actionLoading === 'desasignar'}
                disabled={actionLoading !== null}
                onPress={handleDesasignar}
                fullWidth
                style={[styles.actionButton, styles.dangerButton]}
                textStyle={styles.dangerText}
              />
            )}
          </View>
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
  sectionCard: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  description: {
    fontSize: typography.md,
    color: colors.textSecondary,
    lineHeight: typography.md * typography.normal,
    marginBottom: spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  infoItem: {
    minWidth: 100,
  },
  infoLabel: {
    fontSize: typography.xs,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  assigneeName: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  assigneeEmail: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  bitacoraItem: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  bitacoraDate: {
    fontSize: typography.xs,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  bitacoraContent: {
    fontSize: typography.sm,
    color: colors.text,
    lineHeight: typography.sm * typography.normal,
  },
  bitacoraHours: {
    fontSize: typography.xs,
    color: colors.secondary,
    marginTop: spacing.xs,
    fontWeight: typography.medium,
  },
  noDataText: {
    fontSize: typography.sm,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  obsItem: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  obsContent: {
    fontSize: typography.sm,
    color: colors.text,
    lineHeight: typography.sm * typography.normal,
  },
  obsSatisfaction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  obsSatisfactionLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  obsSatisfactionValue: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.secondary,
  },
  obsDate: {
    fontSize: typography.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  addObsButton: {
    marginTop: spacing.md,
  },
  actionsGrid: {
    gap: spacing.sm,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  dangerButton: {
    borderColor: colors.error,
  },
  dangerText: {
    color: colors.error,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default ActividadDetailScreen;
