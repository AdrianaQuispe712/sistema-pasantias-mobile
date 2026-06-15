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
import { Ionicons } from '@expo/vector-icons';
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
 * Badge variant según estado y fecha límite.
 *
 * REGLA: Si la actividad ya pasó su fecha límite, se pinta ROJO (atraso)
 * sin importar el estado. Si no, colores normales:
 * - en_progreso/asignada → naranja
 * - completada → verde
 * - disponible → azul
 */
const getStatusBadge = (estado, fechaLimite) => {
  // ¿Ya venció?
  if (fechaLimite) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(fechaLimite);
    limite.setHours(0, 0, 0, 0);
    if (limite < hoy) {
      return { variant: 'error', label: estado === 'completada' ? 'Completada' : estado === 'disponible' ? 'Disponible' : 'En Progreso' };
    }
  }

  switch (estado) {
    case 'disponible':
      return { variant: 'info', label: 'Disponible' };
    case 'asignada':
    case 'en_progreso':
      return { variant: 'orange', label: 'En Progreso' };
    case 'completada':
      return { variant: 'success', label: 'Completada' };
    default:
      return { variant: 'neutral', label: estado || 'Desconocido' };
  }
};

const ActividadDetailScreen = ({ route, navigation }) => {
  const { actividadId, actividadData } = route?.params || {};

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

      const [actividadDataResp, obsData] = await Promise.all([
        getActividad(actividadId).catch(() => null),
        getObservaciones(actividadId).catch(() => []),
      ]);

      if (actividadDataResp?.data || actividadDataResp) {
        setActividad(actividadDataResp?.data || actividadDataResp);
      } else if (actividadData) {
        setActividad(actividadData);
      } else {
        setError('No se pudo cargar el detalle de la actividad');
      }

      setObservaciones(
        Array.isArray(obsData) ? obsData : obsData?.data || []
      );
    } catch {
      if (actividadData) {
        setActividad(actividadData);
      } else {
        setError('No se pudo cargar el detalle de la actividad');
      }
    } finally {
      setLoading(false);
    }
  }, [actividadId, actividadData]);

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
            Alert.alert('Exito', 'Actividad completada');
            fetchData();
          } catch (err) {
            const msg = err?.response?.data?.message || 'No se pudo completar la actividad';
            Alert.alert('Error', msg);
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
        <LoadingSpinner fullScreen message="Cargando actividad..." />
      </View>
    );
  }

  if (error || !actividad) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon={<Ionicons name="alert-circle" size={48} color={colors.error} />}
          title="Error"
          subtitle={error || 'Actividad no encontrada'}
          actionLabel="Reintentar"
          onAction={fetchData}
        />
      </View>
    );
  }

  const badge = getStatusBadge(actividad.estado, actividad.fecha_limite || actividad.fechaLimite);
  const isCompleted = actividad.estado === 'completada';
  const isDisponible = actividad.estado === 'disponible' || actividad.estado === 'en_espera';
  const isAssigned = !isDisponible && (actividad.pasante_nombre || actividad.pasante);
  const bitacoras = actividad.bitacoras || [];
  const avanceMax = bitacoras.length > 0
    ? Math.max(...bitacoras.map(b => b.porcentajeAvance || b.porcentaje || 0))
    : 0;
  const canDesasignar = !isDisponible && !isCompleted && bitacoras.length === 0;
  const canCompletar = !isDisponible && !isCompleted && bitacoras.length > 0 && avanceMax >= 100;

  return (
    <View style={styles.screen}>

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
                <Text style={styles.infoLabel}>Fecha Limite</Text>
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
            {!isDisponible && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Avance</Text>
                <Text style={styles.infoValue}>{avanceMax}%</Text>
              </View>
            )}
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
        {!isDisponible && (
          <Card variant="default" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Bitácoras del Pasante</Text>
          {bitacoras.length > 0 ? (
            bitacoras.map((bitacora, index) => (
              <View key={bitacora.id || index} style={styles.bitacoraItem}>
                <View style={styles.bitacoraHeader}>
                  <Text style={styles.bitacoraDate}>
                    {bitacora.fecha || bitacora.created_at || ''}
                  </Text>
                  {bitacora.porcentajeAvance != null && (
                    <Badge
                      variant={bitacora.porcentajeAvance >= 100 ? 'success' : 'info'}
                      label={`${bitacora.porcentajeAvance}%`}
                      size="sm"
                    />
                  )}
                </View>
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
        )}

        {/* ── Observaciones Card ── */}
        {!isDisponible && (
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
        )}

        {/* ── Action Buttons ── */}
        {!isDisponible && (
          <Card variant="default" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Acciones</Text>
            <View style={styles.actionsGrid}>
              {canCompletar && (
                <Button
                  variant="primary"
                  title="Completar"
                  loading={actionLoading === 'completar'}
                  disabled={actionLoading !== null}
                  onPress={handleCompletar}
                  fullWidth
                  style={styles.actionButton}
                />
              )}

              {isCompleted && (
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

              {canDesasignar && (
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

              {!isCompleted && !canCompletar && bitacoras.length === 0 && (
                <Text style={styles.actionHint}>
                  Esperando bitacoras del pasante para poder completar.
                </Text>
              )}

              {!isCompleted && !canCompletar && bitacoras.length > 0 && avanceMax < 100 && (
                <Text style={styles.actionHint}>
                  Avance actual: {avanceMax}%. Se necesita 100% para completar.
                </Text>
              )}
            </View>
          </Card>
        )}
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
  bitacoraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
  actionHint: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default ActividadDetailScreen;
