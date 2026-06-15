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
  Modal,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Card, Badge, Button, Avatar, EmptyState, LoadingSpinner } from '../../components/ui';
import {
  getDisponibles,
  getMias,
  getCompletadas,
  asignar,
  completar,
} from '../../api/jefeActividades';
import { getPasantes } from '../../api/jefePasantes';

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
  const [pasantes, setPasantes] = useState([]);
  const [showPasanteModal, setShowPasanteModal] = useState(false);
  const [actividadToAsignar, setActividadToAsignar] = useState(null);

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

      const rawList = Array.isArray(data) ? data : data?.data || [];

      // Filtrado defensivo client-side para asegurar consistencia
      // de estados entre pestañas (excluye completadas de "En Progreso"
      // y solo incluye completadas en la pestaña "Completadas")
      const filtered =
        activeTab === 'progreso'
          ? rawList.filter((a) => a.estado !== 'completada')
          : activeTab === 'completadas'
          ? rawList.filter((a) => a.estado === 'completada')
          : rawList;

      setActividades(filtered);
    } catch {
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

  // Cargar pasantes del jefe
  useEffect(() => {
    const fetchPasantes = async () => {
      try {
        const data = await getPasantes();
        setPasantes(Array.isArray(data) ? data : data?.data || []);
      } catch {
        // Silently fail - pasantes list is supplementary
      }
    };
    fetchPasantes();
  }, []);

  const handleRefresh = () => {
    fetchActividades(true);
  };

  const handleAsignar = (actividad) => {
    if (pasantes.length === 0) {
      Alert.alert('Sin pasantes', 'No hay pasantes disponibles para asignar.');
      return;
    }
    setActividadToAsignar(actividad);
    setShowPasanteModal(true);
  };

  const handleSelectPasante = async (pasante) => {
    setShowPasanteModal(false);
    const actividad = actividadToAsignar;
    setActividadToAsignar(null);

    if (!actividad) return;

    Alert.alert(
      'Asignar Actividad',
      `¿Desea asignar "${actividad.titulo || actividad.nombre}" a ${pasante.nombre || pasante.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Asignar',
          onPress: async () => {
            try {
              setActionLoading(actividad.id);
              await asignar(actividad.id, { idPasante: pasante.id });
              Alert.alert('Exito', 'Actividad asignada correctamente');
              fetchActividades();
            } catch {
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
              Alert.alert('Exito', 'Actividad completada');
              fetchActividades();
            } catch (err) {
              const msg = err?.response?.data?.message || 'No se pudo completar la actividad';
              Alert.alert('Aviso', msg);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const navigateToDetail = (actividad) => {
    navigation?.navigate('ActividadDetail', {
      actividadId: actividad.id,
      actividadData: {
        id: actividad.id,
        titulo: actividad.titulo || actividad.nombre,
        descripcion: actividad.descripcion,
        estado: actividad.estado,
        fecha_limite: actividad.fecha_limite || actividad.fechaLimite,
        empresa: actividad.empresa,
      },
    });
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
        <LoadingSpinner fullScreen message="Cargando actividades..." />
      </View>
    );
  }

  if (error && !refreshing && actividades.length === 0) {
    return (
      <View style={styles.screen}>
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

      {/* Modal para seleccionar pasante */}
      <Modal
        visible={showPasanteModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPasanteModal(false);
          setActividadToAsignar(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Pasante</Text>
            <Text style={styles.modalSubtitle}>
              {actividadToAsignar?.titulo || actividadToAsignar?.nombre}
            </Text>

            <FlatList
              data={pasantes}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const nombre = item.nombre || item.name || `${item.nombre || ''} ${item.apellido || ''}`.trim();
                return (
                  <TouchableOpacity
                    style={styles.pasanteItem}
                    onPress={() => handleSelectPasante(item)}
                    activeOpacity={0.7}
                  >
                    <Avatar name={nombre} uri={item.avatar || item.foto} size="md" />
                    <View style={styles.pasanteItemInfo}>
                      <Text style={styles.pasanteItemName}>{nombre || 'Sin nombre'}</Text>
                      {item.email ? (
                        <Text style={styles.pasanteItemEmail}>{item.email}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.noDataText}>No hay pasantes disponibles</Text>
              }
            />

            <Button
              variant="ghost"
              title="Cancelar"
              onPress={() => {
                setShowPasanteModal(false);
                setActividadToAsignar(null);
              }}
              style={styles.modalCancelButton}
            />
          </View>
        </View>
      </Modal>
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  pasanteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
  },
  pasanteItemInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  pasanteItemName: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  pasanteItemEmail: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  modalCancelButton: {
    marginTop: spacing.md,
  },
  noDataText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});

export default ActividadesScreen;
