/**
 * OfertasScreen - Listado de ofertas de pasantía (rol Gerente)
 *
 * Muestra todas las ofertas con estado, cantidad de postulantes
 * y botón para ver detalles.
 *
 * @module screens/gerente/OfertasScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Card, Badge, Button, EmptyState, LoadingSpinner } from '../../components/ui';
import { getOfertas } from '../../api/gerenteOfertas';

/**
 * Badge variant según estado de la oferta
 */
const getStatusBadge = (estado) => {
  switch (estado) {
    case 'activa':
    case 'active':
      return { variant: 'success', label: 'Activa' };
    case 'cerrada':
    case 'closed':
      return { variant: 'orange', label: 'Cerrada' };
    case 'terminada':
    case 'finished':
      return { variant: 'neutral', label: 'Terminada' };
    case 'borrador':
    case 'draft':
      return { variant: 'warning', label: 'Borrador' };
    default:
      return { variant: 'info', label: estado || 'Sin estado' };
  }
};

const OfertasScreen = ({ navigation }) => {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOfertas = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      const data = await getOfertas();
      setOfertas(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Error fetching ofertas:', err);
      setError('No se pudieron cargar las ofertas. Intente de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOfertas();
  }, [fetchOfertas]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchOfertas();
    });
    return unsubscribe;
  }, [navigation, fetchOfertas]);

  const navigateToDetail = (oferta) => {
    navigation?.navigate('OfertaDetail', { ofertaId: oferta.id });
  };

  // ─── Render ────────────────────────────────────────────────

  const renderOfertaItem = ({ item }) => {
    const badge = getStatusBadge(item.estado);
    const postulantesCount =
      item.postulantes_count ?? item.postulantesCount ?? item.num_postulantes ?? 0;

    // Color del borde lateral según estado
    const statusBorderColor = {
      activa: colors.success,
      cerrada: colors.orange,
      terminada: colors.grayMedium,
      borrador: colors.warning,
    }[item.estado] || colors.primary;

    return (
      <Card
        variant="default"
        onPress={() => navigateToDetail(item)}
        style={[styles.ofertaCard, { borderLeftColor: statusBorderColor, borderLeftWidth: 4 }]}
      >
        <View style={styles.ofertaHeader}>
          <View style={styles.ofertaTitleRow}>
            <Text style={styles.ofertaTitle} numberOfLines={2}>
              {item.titulo || item.nombre || 'Sin título'}
            </Text>
            <Badge variant={badge.variant} label={badge.label} size="sm" />
          </View>
          {item.descripcion ? (
            <Text style={styles.ofertaDescription} numberOfLines={2}>
              {item.descripcion}
            </Text>
          ) : null}
        </View>

        <View style={styles.ofertaMeta}>
          <Text style={styles.metaText}>👥 {postulantesCount} postulantes</Text>
          {item.empresa && (
            <Text style={styles.metaText}>🏢 {item.empresa}</Text>
          )}
          {item.vacantes && (
            <Text style={styles.metaText}>📋 {item.vacantes} vacantes</Text>
          )}
        </View>

        {/* ── Botón Ver Detalles ── */}
        <View style={styles.ofertaActions}>
          <Button
            variant="primary"
            size="sm"
            title="Ver Detalles"
            onPress={() => navigateToDetail(item)}
            style={styles.detailsBtn}
          />
        </View>
      </Card>
    );
  };

  // ─── Loading ───────────────────────────────────────────────

  if (loading && !refreshing) {
    return (
      <View style={styles.screen}>
        <LoadingSpinner fullScreen message="Cargando ofertas..." />
      </View>
    );
  }

  // ─── Error ─────────────────────────────────────────────────

  if (error && !refreshing && ofertas.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon={<Text style={styles.errorIcon}>⚠️</Text>}
          title="Error"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={() => fetchOfertas()}
        />
      </View>
    );
  }

  // ─── Empty ─────────────────────────────────────────────────

  if (!loading && ofertas.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon={<Text style={styles.emptyIcon}>💼</Text>}
          title="Sin ofertas"
          subtitle="No hay ofertas de pasantía registradas."
          actionLabel="Actualizar"
          onAction={() => fetchOfertas(true)}
        />
      </View>
    );
  }

  // ─── Main List ─────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* Crear Oferta Button */}
      <View style={styles.createButtonContainer}>
        <Button
          variant="primary"
          size="sm"
          title="+ Nueva Oferta"
          onPress={() => navigation?.navigate('OfertaForm')}
          style={styles.createButton}
        />
      </View>

      <FlatList
        data={ofertas}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOfertaItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOfertas(true)}
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  ofertaCard: {
    marginBottom: spacing.md,
    borderLeftColor: colors.primary,
  },
  ofertaHeader: {
    marginBottom: spacing.sm,
  },
  ofertaTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  ofertaTitle: {
    flex: 1,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  ofertaDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.normal,
  },
  ofertaMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: typography.xs,
    color: colors.grayMedium,
  },
  ofertaActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  detailsBtn: {
    minWidth: 120,
  },
  emptyIcon: {
    fontSize: 48,
  },
  errorIcon: {
    fontSize: 48,
  },
  createButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  createButton: {
    alignSelf: 'flex-start',
  },
});

export default OfertasScreen;
