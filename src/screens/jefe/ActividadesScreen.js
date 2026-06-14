/**
 * ActividadesScreen - Pantalla de gestión de actividades (rol Jefe)
 *
 * Vista con tab de tres paneles: Disponibles, En Progreso, Completadas.
 * Permite asignar actividades disponibles y marcar en-progreso como completadas.
 *
 * @module screens/jefe/ActividadesScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Header, Card, Badge, Button, EmptyState, LoadingSpinner } from '../../components/ui';
import {
  getDisponibles,
  getMias,
  getCompletadas,
  asignar,
  completar,
} from '../../api/jefeActividades';

const TABS = [
  { key: 'disponibles', label: 'Disponibles' },
  { key: 'progreso', label: 'En Progreso' },
  { key: 'completadas', label: 'Completadas' },
];

/**
 * Obtiene el badge variant según el estado de la actividad
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
      return { variant: 'neutral', label: estado || 'Sin estado' };
  }
};

const ActividadesScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('disponibles');
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchActividades = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      let data;
      switch (activeTab) {
        case 'disponibles':
          data = await getDisponibles();
          break;
        case 'progreso':
          data = await getMias();
          break;
        case 'completadas':
          data = await getCompletadas();
          break;
        default:
          data = [];
      }

      setActividades(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Error fetching actividades:', err);
      setError('No se pudieron cargar las actividades. Intente de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchActividades();
  }, [fetchActividades]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchActividades();
    });
    return unsubscribe;
  }, [navigation, fetchActividades]);

  const handleRefresh = () => {
    fetchActividades(true);
  };

  const handleAsignar = (actividad) => {
    Alert.alert(
      'Asignar Actividad',
      `¿Desea asignar "${actividad.titulo || actividad.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Asignar',
          onPress: async () => {
            try {
              setActionLoading(actividad.id);
              await asignar(actividad.id);
              Alert.alert('Éxito', 'Actividad asignada correctamente');
              fetchActividades();
            } catch (err) {
              console.error('Error assigning:', err);
              Alert.alert('Error', 'No se pudo asignar la actividad');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleCompletar = (actividad) => {
    Alert.alert(
      'Completar Actividad',
      `¿Marcar "${actividad.titulo || actividad.nombre}" como completada?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: async () => {
            try {
              setActionLoading(actividad.id);
              await completar(actividad.id);
              Alert.alert('Éxito', 'Actividad completada');
              fetchActividades();
            } catch (err) {
              console.error('Error completing:', err);
              Alert.alert('Error', 'No se pudo completar la actividad');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const navigateToDetail = (actividad) => {
    navigation?.navigate('ActividadDetail', { actividadId: actividad.id });
  };

  // ─── Render Helpers ────────────────────────────────────────

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          onPress={() => setActiveTab(tab.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderActividadItem = ({ item }) => {
    const badge = getStatusBadge(item.estado);
    const isActionLoading = actionLoading === item.id;

    return (
      <Card
        variant="default"
        onPress={() => navigateToDetail(item)}
        style={styles.activityCard}
      >
        <View style={styles.activityHeader}>
          <View style={styles.activityTitleRow}>
            <Text style={styles.activityTitle} numberOfLines={2}>
              {item.titulo || item.nombre || 'Sin título'}
            </Text>
            <Badge variant={badge.variant} label={badge.label} size="sm" />
          </View>
          {item.descripcion ? (
            <Text style={styles.activityDescription} numberOfLines={2}>
              {item.descripcion}
            </Text>
          ) : null}
        </View>

        <View style={styles.activityMeta}>
          {item.fecha_limite || item.fechaLimite ? (
            <Text style={styles.metaText}>
              📅 {item.fecha_limite || item.fechaLimite}
            </Text>
          ) : null}
          {item.pasante_nombre || item.pasanteNombre ? (
            <Text style={styles.metaText}>
              👤 {item.pasante_nombre || item.pasanteNombre}
            </Text>
          ) : null}
        </View>

        {activeTab === 'disponibles' && (
          <View style={styles.activityActions}>
            <Button
              variant="primary"
              size="sm"
              title="Asignar"
              loading={isActionLoading}
              disabled={isActionLoading}
              onPress={() => handleAsignar(item)}
            />
          </View>
        )}

        {activeTab === 'progreso' && (
          <View style={styles.activityActions}>
            <Button
              variant="primary"
              size="sm"
              title="Completar"
              loading={isActionLoading}
              disabled={isActionLoading}
              onPress={() => handleCompletar(item)}
            />
          </View>
        )}
      </Card>
    );
  };

  // ─── Main Render ───────────────────────────────────────────

  if (loading && !refreshing) {
    return (
      <View style={styles.screen}>
        <Header title="Actividades" subtitle="Gestión de actividades" />
        <LoadingSpinner fullScreen message="Cargando actividades..." />
      </View>
    );
  }

  if (error && !refreshing && actividades.length === 0) {
    return (
      <View style={styles.screen}>
        <Header title="Actividades" subtitle="Gestión de actividades" />
        <EmptyState
          icon={<Text style={styles.errorIcon}>⚠️</Text>}
          title="Error"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={() => fetchActividades()}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="Actividades" subtitle="Gestión de actividades" />

      {renderTabBar()}

      {actividades.length === 0 ? (
        <EmptyState
          icon={<Text style={styles.emptyIcon}>📋</Text>}
          title="Sin actividades"
          subtitle={
            activeTab === 'disponibles'
              ? 'No hay actividades disponibles para asignar.'
              : activeTab === 'progreso'
              ? 'No tiene actividades en progreso.'
              : 'No hay actividades completadas.'
          }
          actionLabel="Actualizar"
          onAction={handleRefresh}
        />
      ) : (
        <FlatList
          data={actividades}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderActividadItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
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
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  activityCard: {
    marginBottom: spacing.md,
  },
  activityHeader: {
    marginBottom: spacing.sm,
  },
  activityTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  activityTitle: {
    flex: 1,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  activityDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.normal,
  },
  activityMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: typography.xs,
    color: colors.grayMedium,
  },
  activityActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default ActividadesScreen;
