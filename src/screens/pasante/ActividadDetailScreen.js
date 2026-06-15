/**
 * ActividadDetailScreen - Detalle de una actividad asignada
 *
 * Muestra información completa de una actividad:
 * - Título, descripción, fechas
 * - Progreso actual (porcentaje)
 * - Lista de bitácoras (entries)
 * - Botones "Registrar Avance" y "Subir Evidencia"
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Button, Header, Badge, Card, EmptyState, LoadingSpinner } from '../../components/ui';
import { getMisActividades } from '../../api/actividades';
import { getBitacoras } from '../../api/bitacoras';
import { formatDate } from '../../utils/dateUtils';

const ActividadDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { actividadId } = route.params || {};

  // States
  const [actividad, setActividad] = useState(null);
  const [bitacoras, setBitacoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Carga el detalle de la actividad y sus bitácoras
   */
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Cargar actividades para encontrar la específica
      const actividadesData = await getMisActividades();
      const actividades = Array.isArray(actividadesData)
        ? actividadesData
        : actividadesData.data || [];

      // Buscar la actividad por múltiples posibles IDs
      // (el calendario pasa evento.actividadId/actividad_id, actividades usa id)
      const found = actividades.find(
        (a) =>
          String(a.id) === String(actividadId) ||
          String(a.actividadId) === String(actividadId) ||
          String(a.actividad_id) === String(actividadId)
      );
      setActividad(found || null);

      // Cargar bitácoras
      const bitacorasData = await getBitacoras();
      const allBitacoras = Array.isArray(bitacorasData)
        ? bitacorasData
        : bitacorasData.data || [];
      // Filtrar bitácoras de esta actividad
      const filtered = allBitacoras.filter(
        (b) => String(b.actividadId || b.actividad_id) === String(actividadId)
      );
      setBitacoras(filtered);
    } catch (err) {
      console.error('Error al cargar detalle de actividad:', err);
      setError('No se pudo cargar el detalle de la actividad.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [actividadId]);

  // Carga inicial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Pull-to-refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  /**
   * Navega a registrar avance
   */
  const handleRegistrarAvance = useCallback(() => {
    navigation.navigate('Bitacora', { actividadId });
  }, [navigation, actividadId]);

  /**
   * Navega a subir evidencia
   */
  const handleSubirEvidencia = useCallback(() => {
    navigation.navigate('Evidencia', { actividadId });
  }, [navigation, actividadId]);

  /**
   * Obtiene el color del badge según el estado
   */
  const getStatusBadgeVariant = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'completada':
      case 'aprobada':
        return 'success';
      case 'en_progreso':
      case 'en progreso':
        return 'info';
      case 'pendiente':
        return 'warning';
      case 'rechazada':
        return 'error';
      default:
        return 'neutral';
    }
  }, []);

  /**
   * Renderiza la barra de progreso
   */
  const ProgressBar = useCallback(
    ({ porcentaje = 0 }) => (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(Math.max(porcentaje, 0), 100)}%`,
                backgroundColor:
                  porcentaje >= 100
                    ? colors.success
                    : porcentaje >= 50
                    ? colors.secondary
                    : colors.warning,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(porcentaje)}%</Text>
      </View>
    ),
    []
  );

  /**
   * Renderiza una bitácora en la lista
   */
  const renderBitacoraItem = useCallback(
    ({ item: bitacora, index }) => (
      <Card variant="outlined" style={styles.bitacoraCard}>
        <View style={styles.bitacoraHeader}>
          <Text style={styles.bitacoraIndex}>#{index + 1}</Text>
          <Text style={styles.bitacoraFecha}>
            {formatDate(bitacora.fecha || bitacora.created_at) || 'Sin fecha'}
          </Text>
        </View>

        {bitacora.horasTrabajadas && (
          <Text style={styles.bitacoraHoras}>
            ⏱️ {bitacora.horasTrabajadas} horas
          </Text>
        )}

        {bitacora.porcentaje !== undefined && (
          <ProgressBar porcentaje={bitacora.porcentaje} />
        )}

        {bitacora.observacion && (
          <Text style={styles.bitacoraObservacion} numberOfLines={3}>
            {bitacora.observacion}
          </Text>
        )}
      </Card>
    ),
    [ProgressBar]
  );

  // Estado de carga
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Detalle de Actividad" />
        <LoadingSpinner fullScreen message="Cargando actividad..." />
      </View>
    );
  }

  // Estado de error
  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Detalle de Actividad" />
        <EmptyState
          icon={<Text style={styles.emptyIcon}>⚠️</Text>}
          title="Error al cargar"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={fetchData}
        />
      </View>
    );
  }

  // Actividad no encontrada
  if (!actividad) {
    return (
      <View style={styles.container}>
        <Header title="Detalle de Actividad" />
        <EmptyState
          icon={<Text style={styles.emptyIcon}>🔍</Text>}
          title="Actividad no encontrada"
          subtitle="La actividad que buscas no existe o fue removida."
          actionLabel="Volver"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Detalle de Actividad" />
      <FlatList
        data={bitacoras}
        keyExtractor={(item, index) => String(item.id || item.bitacoraId || item.bitacora_id || index)}
        renderItem={renderBitacoraItem}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Información de la actividad */}
            <Card variant="default" style={styles.section}>
              <Text style={styles.actividadNombre}>
                {actividad.nombre || actividad.titulo || 'Sin nombre'}
              </Text>

              <View style={styles.badgesRow}>
                <Badge
                  variant={getStatusBadgeVariant(actividad.estado)}
                  size="sm"
                  label={actividad.estado?.replace('_', ' ') || 'Pendiente'}
                />
                {actividad.modalidad && (
                  <Badge variant="info" size="sm" label={actividad.modalidad} />
                )}
              </View>
            </Card>

            {/* Descripción */}
            {actividad.descripcion && (
              <Card variant="outlined" style={styles.section}>
                <Text style={styles.sectionTitle}>Descripción</Text>
                <Text style={styles.sectionContent}>{actividad.descripcion}</Text>
              </Card>
            )}

            {/* Fechas */}
            {(actividad.fechaInicio || actividad.fechaFin) && (
              <Card variant="outlined" style={styles.section}>
                <Text style={styles.sectionTitle}>Período</Text>
                <View style={styles.datesContainer}>
                  {actividad.fechaInicio && (
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>Inicio</Text>
                      <Text style={styles.dateValue}>{formatDate(actividad.fechaInicio)}</Text>
                    </View>
                  )}
                  {actividad.fechaFin && (
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>Fin</Text>
                      <Text style={styles.dateValue}>{formatDate(actividad.fechaFin)}</Text>
                    </View>
                  )}
                </View>
              </Card>
            )}

            {/* Progreso actual */}
            <Card variant="outlined" style={styles.section}>
              <Text style={styles.sectionTitle}>Progreso actual</Text>
              <ProgressBar
                porcentaje={actividad.porcentaje || actividad.progreso || 0}
              />
              <Text style={styles.progresoDetalle}>
                Has completado el{' '}
                {Math.round(actividad.porcentaje || actividad.progreso || 0)}% de esta actividad
              </Text>
            </Card>

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                title="Registrar Bitácora"
                onPress={handleRegistrarAvance}
                leftIcon={<Text style={styles.buttonIcon}>📝</Text>}
              />
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                title="Subir Evidencia"
                onPress={handleSubirEvidencia}
                leftIcon={<Text style={styles.buttonIcon}>📎</Text>}
                style={styles.secondaryButton}
              />
            </View>

            {/* Lista de bitácoras */}
            <View style={styles.bitacorasHeader}>
              <Text style={styles.bitacorasTitle}>
                Bitácoras ({bitacoras.length})
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Text style={styles.emptyIcon}>📓</Text>}
            title="Sin bitácoras registradas"
            subtitle="Aún no has registrado avances en esta actividad."
            actionLabel="Registrar primer avance"
            onAction={handleRegistrarAvance}
          />
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  listHeader: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  // Actividad
  actividadNombre: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // Secciones
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    fontSize: typography.md,
    color: colors.textSecondary,
    lineHeight: typography.md * typography.normal,
  },
  // Fechas
  datesContainer: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.grayMedium,
    marginBottom: spacing.xs,
  },
  dateValue: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.primary,
  },
  // Progreso
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: colors.grayLighter,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.primary,
    minWidth: 42,
    textAlign: 'right',
  },
  progresoDetalle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  // Botones de acción
  actionButtons: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  secondaryButton: {
    marginTop: 0,
  },
  buttonIcon: {
    fontSize: typography.md,
    marginRight: spacing.xs,
  },
  // Bitácoras
  bitacorasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bitacorasTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.primary,
  },
  bitacoraCard: {
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  bitacoraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bitacoraIndex: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.secondary,
  },
  bitacoraFecha: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  bitacoraHoras: {
    fontSize: typography.sm,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bitacoraObservacion: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    lineHeight: typography.sm * typography.normal,
  },
  backIcon: {
    fontSize: typography.xl,
    color: colors.textOnPrimary,
  },
  emptyIcon: {
    fontSize: 48,
  },
});

export default ActividadDetailScreen;
