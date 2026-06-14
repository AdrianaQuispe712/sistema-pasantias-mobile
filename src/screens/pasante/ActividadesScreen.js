/**
 * ActividadesScreen - Pantalla de actividades del pasante
 *
 * Vista con tabs: "Mis Actividades" | "Estado"
 * - Lista de actividades asignadas con progreso
 * - Badges de estado (en_progreso, completada)
 * - Barra de progreso con porcentaje
 * - Navegación al detalle de actividad
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Card, Header, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { getMisActividades, getEstado } from '../../api/actividades';

const ActividadesScreen = () => {
  const navigation = useNavigation();

  // States
  const [activeTab, setActiveTab] = useState('actividades');
  const [actividades, setActividades] = useState([]);
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Carga las actividades y el estado general
   */
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [actividadesData, estadoData] = await Promise.all([
        getMisActividades(),
        getEstado(),
      ]);
      setActividades(
        Array.isArray(actividadesData) ? actividadesData : actividadesData.data || []
      );
      setEstado(estadoData);
    } catch (err) {
      console.error('Error al cargar actividades:', err);
      setError('No se pudieron cargar las actividades.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
   * Navega al detalle de una actividad
   */
  const handleActividadPress = useCallback(
    (actividad) => {
      navigation.navigate('ActividadDetail', { actividadId: actividad.id });
    },
    [navigation]
  );

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
   * Renderiza un ítem de actividad
   */
  const renderActividadItem = useCallback(
    ({ item: actividad }) => (
      <Card
        variant="default"
        padding="none"
        onPress={() => handleActividadPress(actividad)}
        style={styles.actividadCard}
      >
        <View style={styles.actividadContent}>
          {/* Header de la actividad */}
          <View style={styles.actividadHeader}>
            <Text style={styles.actividadNombre} numberOfLines={2}>
              {actividad.nombre || actividad.titulo || 'Sin nombre'}
            </Text>
            <Badge
              variant={getStatusBadgeVariant(actividad.estado)}
              size="sm"
              label={actividad.estado?.replace('_', ' ') || 'Pendiente'}
            />
          </View>

          {/* Descripción breve */}
          {actividad.descripcion && (
            <Text style={styles.actividadDescripcion} numberOfLines={2}>
              {actividad.descripcion}
            </Text>
          )}

          {/* Fechas */}
          <View style={styles.actividadFechas}>
            {actividad.fechaInicio && (
              <Text style={styles.fechaText}>
                📅 {actividad.fechaInicio}
              </Text>
            )}
            {actividad.fechaFin && (
              <Text style={styles.fechaText}>
                → {actividad.fechaFin}
              </Text>
            )}
          </View>

          {/* Barra de progreso */}
          <ProgressBar porcentaje={actividad.porcentaje || actividad.progreso || 0} />
        </View>
      </Card>
    ),
    [handleActividadPress, getStatusBadgeVariant, ProgressBar]
  );

  /**
   * Renderiza el contenido de la pestaña "Estado"
   */
  const renderEstadoContent = () => {
    if (!estado) {
      return (
        <EmptyState
          icon={<Text style={styles.emptyIcon}>📊</Text>}
          title="Sin datos de estado"
          subtitle="Aún no hay información de estado disponible."
        />
      );
    }

    return (
      <View style={styles.estadoContainer}>
        {/* Resumen general */}
        <Card variant="outlined" style={styles.estadoCard}>
          <Text style={styles.estadoCardTitle}>Resumen general</Text>
          <View style={styles.estadoStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{estado.total || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={[styles.statNumber, { color: colors.success }]}>
                {estado.completadas || 0}
              </Text>
              <Text style={styles.statLabel}>Completadas</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={[styles.statNumber, { color: colors.secondary }]}>
                {estado.enProgreso || 0}
              </Text>
              <Text style={styles.statLabel}>En progreso</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={[styles.statNumber, { color: colors.warning }]}>
                {estado.pendientes || 0}
              </Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
          </View>
        </Card>

        {/* Porcentaje de avance */}
        {estado.porcentajeGeneral !== undefined && (
          <Card variant="outlined" style={styles.estadoCard}>
            <Text style={styles.estadoCardTitle}>Avance total</Text>
            <ProgressBar porcentaje={estado.porcentajeGeneral} />
            <Text style={styles.estadoAvanceText}>
              Has completado el {Math.round(estado.porcentajeGeneral || 0)}% de tus actividades
            </Text>
          </Card>
        )}

        {/* Próximos vencimientos */}
        {estado.proximosVencimientos && estado.proximosVencimientos.length > 0 && (
          <Card variant="outlined" style={styles.estadoCard}>
            <Text style={styles.estadoCardTitle}>Próximos vencimientos</Text>
            {estado.proximosVencimientos.map((item, index) => (
              <View key={index} style={styles.vencimientoItem}>
                <Text style={styles.vencimientoNombre}>{item.nombre}</Text>
                <Badge
                  variant="warning"
                  size="sm"
                  label={`Vence: ${item.fechaFin}`}
                />
              </View>
            ))}
          </Card>
        )}
      </View>
    );
  };

  // Estado de carga inicial
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header
          title="Actividades"
          subtitle="Gestión de actividades"
        />
        <LoadingSpinner fullScreen message="Cargando actividades..." />
      </View>
    );
  }

  // Estado de error
  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header
          title="Actividades"
          subtitle="Gestión de actividades"
        />
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

  return (
    <View style={styles.container}>
      <Header
        title="Actividades"
        subtitle="Gestión de actividades"
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'actividades' && styles.tabActive]}
          onPress={() => setActiveTab('actividades')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'actividades' && styles.tabTextActive,
            ]}
          >
            Mis Actividades
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'estado' && styles.tabActive]}
          onPress={() => setActiveTab('estado')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'estado' && styles.tabTextActive,
            ]}
          >
            Estado
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido según tab activo */}
      {activeTab === 'actividades' ? (
        <FlatList
          data={actividades}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderActividadItem}
          ListEmptyComponent={
            <EmptyState
              icon={<Text style={styles.emptyIcon}>📋</Text>}
              title="Sin actividades asignadas"
              subtitle="Aún no tienes actividades asignadas. Espera a que tu supervisor las cree."
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
      ) : (
        <FlatList
          data={[{ key: 'estado' }]}
          keyExtractor={(item) => item.key}
          renderItem={renderEstadoContent}
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.md,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  // Lista
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  // Tarjeta de actividad
  actividadCard: {
    marginBottom: spacing.md,
  },
  actividadContent: {
    padding: spacing.lg,
  },
  actividadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  actividadNombre: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  actividadDescripcion: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.normal,
    marginBottom: spacing.sm,
  },
  actividadFechas: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fechaText: {
    fontSize: typography.sm,
    color: colors.grayMedium,
  },
  // Progreso
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.grayLighter,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.primary,
    minWidth: 36,
    textAlign: 'right',
  },
  // Estado
  estadoContainer: {
    gap: spacing.md,
  },
  estadoCard: {
    marginBottom: spacing.sm,
  },
  estadoCardTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  estadoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: spacing.lg,
  },
  statNumber: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  estadoAvanceText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  vencimientoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  vencimientoNombre: {
    fontSize: typography.sm,
    color: colors.text,
    flex: 1,
  },
  emptyIcon: {
    fontSize: 48,
  },
});

export default ActividadesScreen;
