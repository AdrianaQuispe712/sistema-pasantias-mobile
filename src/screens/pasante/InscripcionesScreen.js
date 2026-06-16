/**
 * InscripcionesScreen - Pantalla de inscripciones del pasante
 *
 * Muestra las inscripciones del pasante con:
 * - Tabs: Activas (pendiente/aceptado) e Historial (completado/rechazado/abandonado)
 * - Botón de "Confirmar" cuando la inscripción está en estado 'aceptado' con confirmar_hasta
 * - Botón de "Rechazar" para rechazar una inscripción aceptada
 * - Countdown del tiempo restante para confirmar
 * - Pull-to-refresh
 * - Navegación al detalle
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { getInscripciones, confirmarInscripcion, rechazarInscripcion } from '../../api/pasanteInscripciones';

/**
 * Calcula el tiempo restante hasta confirmar_hasta
 */
const getTimeRemaining = (confirmarHasta) => {
  if (!confirmarHasta) return null;

  const now = Math.floor(Date.now() / 1000);
  const diff = confirmarHasta - now;

  if (diff <= 0) return 'Expirado';

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
};

/**
 * Retorna la variante del Badge según el estado de la inscripción
 */
const getEstadoBadge = (estado) => {
  switch (estado) {
    case 'pendiente':
      return { variant: 'warning', label: 'Pendiente' };
    case 'aceptado':
      return { variant: 'success', label: 'Aceptado' };
    case 'completado':
      return { variant: 'info', label: 'Completado' };
    case 'rechazado':
      return { variant: 'error', label: 'Rechazado' };
    case 'abandonado':
      return { variant: 'error', label: 'Abandonado' };
    default:
      return { variant: 'neutral', label: estado };
  }
};

const InscripcionesScreen = () => {
  const navigation = useNavigation();

  // ── States ──────────────────────────────────────────────
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('activas');
  const [actionLoading, setActionLoading] = useState(null);
  const [countdowns, setCountdowns] = useState({});

  // ── API ──────────────────────────────────────────────────

  const fetchInscripciones = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      const data = await getInscripciones();
      setInscripciones(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Error al cargar inscripciones:', err);
      setError('No se pudieron cargar las inscripciones. Intente de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchInscripciones();
    }, [fetchInscripciones])
  );

  // ── Countdown timer ──────────────────────────────────────

  useEffect(() => {
    const inscripcionesConDeadline = inscripciones.filter(
      (insc) => insc.estado === 'aceptado' && insc.confirmar_hasta
    );

    if (inscripcionesConDeadline.length === 0) return;

    const interval = setInterval(() => {
      const newCountdowns = {};
      inscripcionesConDeadline.forEach((insc) => {
        newCountdowns[insc.id] = getTimeRemaining(insc.confirmar_hasta);
      });
      setCountdowns(newCountdowns);
    }, 60000); // Update every minute

    // Initial update
    const initialCountdowns = {};
    inscripcionesConDeadline.forEach((insc) => {
      initialCountdowns[insc.id] = getTimeRemaining(insc.confirmar_hasta);
    });
    setCountdowns(initialCountdowns);

    return () => clearInterval(interval);
  }, [inscripciones]);

  // ── Filtered data ──────────────────────────────────────

  const filteredInscripciones = useMemo(() => {
    if (activeTab === 'activas') {
      return inscripciones.filter((insc) =>
        ['pendiente', 'aceptado'].includes(insc.estado)
      );
    }
    return inscripciones.filter((insc) =>
      ['completado', 'rechazado', 'abandonado'].includes(insc.estado)
    );
  }, [inscripciones, activeTab]);

  // ── Actions ──────────────────────────────────────────────

  const handleConfirmar = (inscripcion) => {
    Alert.alert(
      'Confirmar Inscripción',
      `¿Deseas confirmar tu inscripción en "${inscripcion.titulo}"?\n\nSe eliminarán tus otras inscripciones pendientes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              setActionLoading(inscripcion.id);
              await confirmarInscripcion(inscripcion.id);
              fetchInscripciones();
            } catch (err) {
              console.error('Error confirmando inscripción:', err);
              Alert.alert('Error', 'No se pudo confirmar la inscripción. Intente de nuevo.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleRechazar = (inscripcion) => {
    Alert.alert(
      'Rechazar Inscripción',
      `¿Deseas rechazar tu inscripción en "${inscripcion.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(inscripcion.id);
              await rechazarInscripcion(inscripcion.id);
              fetchInscripciones();
            } catch (err) {
              console.error('Error rechazando inscripción:', err);
              Alert.alert('Error', 'No se pudo rechazar la inscripción. Intente de nuevo.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  // ── Render ──────────────────────────────────────────────

  const renderInscripcionItem = ({ item }) => {
    const badge = getEstadoBadge(item.estado);
    const canConfirm = item.estado === 'aceptado' && item.confirmar_hasta;
    const countdown = countdowns[item.id];
    const isLoading = actionLoading === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation?.navigate('InscripcionDetail', { inscripcionId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.titulo}
            </Text>
            <Badge variant={badge.variant} size="small" label={badge.label} />
          </View>
          <Text style={styles.empresa}>{item.empresa}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={14} color={colors.grayMedium} />
            <Text style={styles.infoText}>{item.empresa}</Text>
          </View>
          {item.modalidad && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color={colors.grayMedium} />
              <Text style={styles.infoText}>{item.modalidad}</Text>
            </View>
          )}
          {item.fechaInscripcion && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.grayMedium} />
              <Text style={styles.infoText}>
                Inscrito: {new Date(item.fechaInscripcion).toLocaleDateString('es-BO')}
              </Text>
            </View>
          )}
        </View>

        {/* Confirm/Reject buttons for accepted inscriptions */}
        {canConfirm && (
          <View style={styles.cardActions}>
            {countdown && countdown !== 'Expirado' && (
              <View style={styles.countdownContainer}>
                <Ionicons name="time-outline" size={14} color={colors.warning} />
                <Text style={styles.countdownText}>
                  Confirma en: {countdown}
                </Text>
              </View>
            )}
            {countdown === 'Expirado' && (
              <View style={styles.countdownContainer}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                <Text style={[styles.countdownText, { color: colors.error }]}>
                  Tiempo expirado
                </Text>
              </View>
            )}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => handleConfirmar(item)}
                disabled={isLoading}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
                <Text style={styles.confirmButtonText}>
                  {isLoading ? '...' : 'Confirmar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRechazar(item)}
                disabled={isLoading}
              >
                <Ionicons name="close-circle-outline" size={16} color={colors.white} />
                <Text style={styles.rejectButtonText}>
                  {isLoading ? '...' : 'Rechazar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── Loading state ──────────────────────────────────────

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Cargando inscripciones..." />;
  }

  // ── Error state ──────────────────────────────────────

  if (error && !refreshing && inscripciones.length === 0) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Error"
        subtitle={error}
        onAction={() => fetchInscripciones()}
      />
    );
  }

  // ── Empty state ──────────────────────────────────────

  if (!loading && inscripciones.length === 0) {
    return (
      <EmptyState
        icon="document-text-outline"
        title="Sin inscripciones"
        subtitle="Aún no te has inscrito a ninguna oferta de pasantía."
        onAction={() => fetchInscripciones(true)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activas' && styles.activeTab]}
          onPress={() => setActiveTab('activas')}
        >
          <Text style={[styles.tabText, activeTab === 'activas' && styles.activeTabText]}>
            Activas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'historial' && styles.activeTab]}
          onPress={() => setActiveTab('historial')}
        >
          <Text style={[styles.tabText, activeTab === 'historial' && styles.activeTabText]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {filteredInscripciones.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="Sin inscripciones"
          subtitle={
            activeTab === 'activas'
              ? 'No tienes inscripciones activas.'
              : 'No hay inscripciones en el historial.'
          }
        />
      ) : (
        <FlatList
          data={filteredInscripciones}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderInscripcionItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchInscripciones(true)}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLighter,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.md,
    color: colors.grayMedium,
    fontWeight: typography.medium,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  empresa: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  cardBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  cardActions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.grayLighter,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  countdownText: {
    fontSize: typography.sm,
    color: colors.warning,
    fontWeight: typography.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  confirmButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  rejectButtonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
});

export default InscripcionesScreen;
