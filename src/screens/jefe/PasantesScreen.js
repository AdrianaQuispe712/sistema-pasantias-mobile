/**
 * PasantesScreen - Listado de pasantes asignados (rol Jefe)
 *
 * Muestra todos los pasantes con avatar, nombre, email,
 * cantidad de actividades activas y estado.
 *
 * @module screens/jefe/PasantesScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Card, Avatar, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { getPasantes } from '../../api/jefePasantes';

/**
 * Badge variant según estado del pasante
 * Estados reales del monolito: pendiente, aceptado, completado, abandono, rechazado
 * Nota: el backend retorna 'activo' hardcodeado — mapeamos a 'aceptado'
 * porque todos los pasantes de este endpoint tienen inscripción aceptada
 */
const getStatusBadge = (estado) => {
  switch (estado) {
    case 'aceptado':
    case 'activo':   // backend hardcodea 'activo' para inscripciones aceptadas
      return { variant: 'success', label: 'Aceptado' };
    case 'pendiente':
      return { variant: 'warning', label: 'Pendiente' };
    case 'completado':
      return { variant: 'info', label: 'Completado' };
    case 'abandono':
      return { variant: 'error', label: 'Abandono' };
    case 'rechazado':
      return { variant: 'error', label: 'Rechazado' };
    default:
      return { variant: 'neutral', label: estado || 'Sin estado' };
  }
};

const PasantesScreen = ({ navigation }) => {
  const [pasantes, setPasantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPasantes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      const data = await getPasantes();
      setPasantes(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setError('No se pudieron cargar los pasantes. Intente de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPasantes();
  }, [fetchPasantes]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchPasantes();
    });
    return unsubscribe;
  }, [navigation, fetchPasantes]);

  const navigateToDetail = (pasante) => {
    navigation?.navigate('PasanteDetail', { pasanteId: pasante.id });
  };

  // ─── Render ────────────────────────────────────────────────

  const renderPasanteItem = ({ item }) => {
    const badge = getStatusBadge(item.estado);
    const nombre = item.nombre || item.name || `${item.nombre || ''} ${item.apellido || ''}`.trim();
    const email = item.email || item.correo || '';
    const actividadesCount =
      item.actividades_count ?? item.actividadesCount ?? item.actividades_activas ?? 0;

    return (
      <Card
        variant="default"
        onPress={() => navigateToDetail(item)}
        style={styles.pasanteCard}
      >
        <View style={styles.pasanteRow}>
          <Avatar name={nombre} uri={item.avatar || item.foto} size="lg" />

          <View style={styles.pasanteInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.pasanteName} numberOfLines={1}>
                {nombre || 'Sin nombre'}
              </Text>
              <Badge variant={badge.variant} label={badge.label} size="sm" />
            </View>

            {email ? (
              <Text style={styles.pasanteEmail} numberOfLines={1}>
                {email}
              </Text>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{actividadesCount}</Text>
                <Text style={styles.statLabel}>
                  {actividadesCount === 1 ? 'Actividad' : 'Actividades'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  // ─── Loading State ─────────────────────────────────────────

  if (loading && !refreshing) {
    return (
      <View style={styles.screen}>
        <View style={styles.statusBarSpacer} />
        <Text style={styles.screenSubtitle}>Pasantes asignados</Text>
        <LoadingSpinner fullScreen message="Cargando pasantes..." />
      </View>
    );
  }

  // ─── Error State ───────────────────────────────────────────

  if (error && !refreshing && pasantes.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.statusBarSpacer} />
        <Text style={styles.screenSubtitle}>Pasantes asignados</Text>
        <EmptyState
          icon={<Text style={styles.errorIcon}>⚠️</Text>}
          title="Error"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={() => fetchPasantes()}
        />
      </View>
    );
  }

  // ─── Empty State ───────────────────────────────────────────

  if (!loading && pasantes.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.statusBarSpacer} />
        <Text style={styles.screenSubtitle}>Pasantes asignados</Text>
        <EmptyState
          icon={<Text style={styles.emptyIcon}>👥</Text>}
          title="Sin pasantes"
          subtitle="No hay pasantes asignados actualmente."
          actionLabel="Actualizar"
          onAction={() => fetchPasantes(true)}
        />
      </View>
    );
  }

  // ─── Main List ─────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <View style={styles.statusBarSpacer} />
      <Text style={styles.screenSubtitle}>Pasantes asignados</Text>

      <FlatList
        data={pasantes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPasanteItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPasantes(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  statusBarSpacer: {
    height: Platform.OS === 'ios' ? spacing.xxxl : 40,
  },
  screenSubtitle: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  pasanteCard: {
    marginBottom: spacing.md,
  },
  pasanteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pasanteInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pasanteName: {
    flex: 1,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  pasanteEmail: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.secondary,
    marginRight: spacing.xs,
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  emptyIcon: {
    fontSize: 48,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default PasantesScreen;
