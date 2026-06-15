/**
 * InscripcionesScreen - Listado de inscripciones (rol Gerente)
 *
 * Muestra todas las inscripciones con filtros por estado,
 * botones de aprobar/rechazar para pendientes.
 *
 * @module screens/gerente/InscripcionesScreen
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Card, Badge, Button, EmptyState, LoadingSpinner } from '../../components/ui';
import {
  getInscripciones,
  aprobar,
  rechazar,
} from '../../api/gerenteInscripciones';

// ─── Date formatting helper ───────────────────────────────
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  // Supports YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, YYYY-MM-DD HH:mm:ss
  const parts = String(dateStr).split(/[/\-T ]/);
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;
  const m = parseInt(month, 10);
  if (isNaN(m) || m < 1 || m > 12) return dateStr;
  return `${parseInt(day, 10)} ${MESES[m - 1]} ${year}`;
};

const FILTER_TABS = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'aceptado', label: 'Aceptadas' },
  { key: 'rechazado', label: 'Rechazadas' },
  { key: 'completado', label: 'Completadas' },
];

/**
 * Badge variant según estado de inscripción
 */
const getStatusBadge = (estado) => {
  switch (estado) {
    case 'aceptado':
    case 'aceptada':
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
    default:
      return { variant: 'neutral', label: estado || 'Sin estado' };
  }
};

const InscripcionesScreen = ({ navigation, route }) => {
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(route?.params?.initialFilter || 'todas');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchInscripciones = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      const data = await getInscripciones();
      setInscripciones(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Error fetching inscripciones:', err);
      setError('No se pudieron cargar las inscripciones. Intente de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInscripciones();
  }, [fetchInscripciones]);

  // Sync filter from route params (e.g., from notification tap)
  useEffect(() => {
    if (route?.params?.initialFilter) {
      setActiveFilter(route.params.initialFilter);
    }
  }, [route?.params?.initialFilter]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchInscripciones();
    });
    return unsubscribe;
  }, [navigation, fetchInscripciones]);

  const filteredInscripciones = useMemo(() => {
    if (activeFilter === 'todas') return inscripciones;
    return inscripciones.filter(
      (insc) =>
        insc.estado === activeFilter ||
        insc.estado?.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [inscripciones, activeFilter]);

  const handleAprobar = (inscripcion) => {
    Alert.alert(
      'Aprobar Inscripción',
      `¿Desea aprobar la inscripción de "${inscripcion.pasante_nombre || inscripcion.pasante?.nombre || 'este pasante'}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: async () => {
            try {
              setActionLoading(inscripcion.id);
              await aprobar(inscripcion.id);
              Alert.alert('Éxito', 'Inscripción aprobada');
              fetchInscripciones();
            } catch (err) {
              Alert.alert('Error', 'No se pudo aprobar la inscripción');
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
      `¿Desea rechazar la inscripción de "${inscripcion.pasante_nombre || inscripcion.pasante?.nombre || 'este pasante'}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(inscripcion.id);
              await rechazar(inscripcion.id);
              Alert.alert('Éxito', 'Inscripción rechazada');
              fetchInscripciones();
            } catch (err) {
              Alert.alert('Error', 'No se pudo rechazar la inscripción');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const navigateToDetail = (inscripcion) => {
    navigation?.navigate('InscripcionDetail', { inscripcionId: inscripcion.id });
  };

  // ─── Render ────────────────────────────────────────────────

  const renderFilterTabs = () => (
    <View style={styles.filterBar}>
      {FILTER_TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
          onPress={() => setActiveFilter(tab.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterTabText,
              activeFilter === tab.key && styles.filterTabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderInscripcionItem = ({ item }) => {
    const badge = getStatusBadge(item.estado);
    const isPending =
      item.estado === 'pendiente' || item.estado?.toLowerCase() === 'pending';
    const isActionLoading = actionLoading === item.id;
    const pasanteName =
      item.pasante_nombre ||
      item.pasante?.nombre ||
      `${item.pasante?.nombre || ''} ${item.pasante?.apellido || ''}`.trim() ||
      'Pasante';
    const ofertaTitle =
      item.oferta_titulo || item.oferta?.titulo || item.titulo || 'Oferta';

    return (
      <Card
        variant="default"
        onPress={() => navigateToDetail(item)}
        style={styles.inscripcionCard}
      >
        <View style={styles.inscripcionHeader}>
          <View style={styles.inscripcionTitleRow}>
            <Text style={styles.inscripcionTitle} numberOfLines={1}>
              {pasanteName}
            </Text>
            <Badge variant={badge.variant} label={badge.label} size="sm" />
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="clipboard-outline" size={14} color={colors.grayMedium} />
            <Text style={styles.ofertaText} numberOfLines={1}>
              {ofertaTitle}
            </Text>
          </View>
          {item.fecha && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.grayMedium} />
              <Text style={styles.dateText}>{formatDate(item.fecha)}</Text>
            </View>
          )}
        </View>

        {isPending && (
          <View style={styles.inscripcionActions}>
            <Button
              variant="primary"
              size="sm"
              title="Aprobar"
              loading={isActionLoading}
              disabled={isActionLoading}
              onPress={() => handleAprobar(item)}
              style={styles.actionBtn}
            />
            <Button
              variant="ghost"
              size="sm"
              title="Rechazar"
              loading={isActionLoading}
              disabled={isActionLoading}
              onPress={() => handleRechazar(item)}
              style={[styles.actionBtn, styles.rejectBtn]}
              textStyle={styles.rejectBtnText}
            />
          </View>
        )}
      </Card>
    );
  };

  // ─── Loading ───────────────────────────────────────────────

  if (loading && !refreshing) {
    return (
      <View style={styles.screen}>
        <LoadingSpinner fullScreen message="Cargando inscripciones..." />
      </View>
    );
  }

  // ─── Error ─────────────────────────────────────────────────

  if (error && !refreshing && inscripciones.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon={<Ionicons name="alert-circle" size={48} color={colors.error} />}
          title="Error"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={() => fetchInscripciones()}
        />
      </View>
    );
  }

  // ─── Empty ─────────────────────────────────────────────────

  if (!loading && inscripciones.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon={<Ionicons name="create-outline" size={48} color={colors.grayMedium} />}
          title="Sin inscripciones"
          subtitle="No hay inscripciones registradas."
          actionLabel="Actualizar"
          onAction={() => fetchInscripciones(true)}
        />
      </View>
    );
  }

  // ─── Main List ─────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {renderFilterTabs()}

      {filteredInscripciones.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="search-outline" size={48} color={colors.grayMedium} />}
          title="Sin resultados"
          subtitle={`No hay inscripciones ${
            activeFilter === 'todas' ? '' : `con estado "${activeFilter}"`
          }`}
          actionLabel="Ver todas"
          onAction={() => setActiveFilter('todas')}
        />
      ) : (
        <FlatList
          data={filteredInscripciones}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderInscripcionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchInscripciones(true)}
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
  filterBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: colors.primary,
  },
  filterTabText: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  inscripcionCard: {
    marginBottom: spacing.md,
  },
  inscripcionHeader: {
    marginBottom: spacing.sm,
  },
  inscripcionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  inscripcionTitle: {
    flex: 1,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  ofertaText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: typography.xs,
    color: colors.textLight,
  },
  inscripcionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    minWidth: 90,
  },
  rejectBtn: {
    borderColor: colors.error,
  },
  rejectBtnText: {
    color: colors.error,
  },
  emptyIcon: {
    fontSize: 48,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default InscripcionesScreen;
