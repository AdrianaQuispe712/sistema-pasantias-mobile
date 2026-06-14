/**
 * NotificacionesScreen - Listado de notificaciones (rol Gerente)
 *
 * Muestra todas las notificaciones con icono según tipo,
 * permite marcar como leídas individualmente.
 *
 * @module screens/gerente/NotificacionesScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Header, Card, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import {
  getNotificaciones,
  markAsRead,
} from '../../api/gerenteNotificaciones';

/**
 * Icono según tipo de notificación
 */
const getNotificationIcon = (tipo) => {
  switch (tipo) {
    case 'actividad':
    case 'activity':
      return '📋';
    case 'inscripcion':
    case 'inscription':
      return '📝';
    case 'oferta':
    case 'offer':
      return '💼';
    case 'bitacora':
    case 'log':
      return '📖';
    case 'sistema':
    case 'system':
      return '⚙️';
    case 'alerta':
    case 'alert':
      return '🔔';
    case 'mensaje':
    case 'message':
      return '💬';
    default:
      return '📌';
  }
};

/**
 * Badge variant según tipo
 */
const getTypeBadge = (tipo) => {
  switch (tipo) {
    case 'actividad':
    case 'activity':
      return { variant: 'info', label: 'Actividad' };
    case 'inscripcion':
    case 'inscription':
      return { variant: 'success', label: 'Inscripción' };
    case 'oferta':
    case 'offer':
      return { variant: 'warning', label: 'Oferta' };
    case 'bitacora':
    case 'log':
      return { variant: 'neutral', label: 'Bitácora' };
    case 'sistema':
    case 'system':
      return { variant: 'info', label: 'Sistema' };
    case 'alerta':
    case 'alert':
      return { variant: 'error', label: 'Alerta' };
    default:
      return { variant: 'neutral', label: tipo || 'General' };
  }
};

const NotificacionesScreen = ({ navigation }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [markingId, setMarkingId] = useState(null);

  const fetchNotificaciones = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      const data = await getNotificaciones();
      setNotificaciones(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Error fetching notificaciones:', err);
      setError('No se pudieron cargar las notificaciones. Intente de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchNotificaciones();
    });
    return unsubscribe;
  }, [navigation, fetchNotificaciones]);

  const handleMarkAsRead = async (notificacion) => {
    if (notificacion.leida || notificacion.read) return;

    try {
      setMarkingId(notificacion.id);
      await markAsRead(notificacion.id);

      // Update local state immediately
      setNotificaciones((prev) =>
        prev.map((n) =>
          n.id === notificacion.id ? { ...n, leida: true, read: true } : n
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    } finally {
      setMarkingId(null);
    }
  };

  // ─── Render ────────────────────────────────────────────────

  const renderNotificacionItem = ({ item }) => {
    const isLeida = item.leida || item.read;
    const icon = getNotificationIcon(item.tipo);
    const typeBadge = getTypeBadge(item.tipo);

    return (
      <Card
        variant={isLeida ? 'outlined' : 'default'}
        onPress={() => handleMarkAsRead(item)}
        style={[styles.notifCard, !isLeida && styles.notifCardUnread]}
      >
        <View style={styles.notifRow}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.notifIcon}>{icon}</Text>
            {!isLeida && <View style={styles.unreadDot} />}
          </View>

          {/* Content */}
          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              <Text
                style={[styles.notifTitle, !isLeida && styles.notifTitleUnread]}
                numberOfLines={2}
              >
                {item.titulo || item.title || 'Notificación'}
              </Text>
              <Badge variant={typeBadge.variant} label={typeBadge.label} size="sm" />
            </View>

            <Text style={styles.notifMessage} numberOfLines={3}>
              {item.mensaje || item.message || item.descripcion || ''}
            </Text>

            <View style={styles.notifFooter}>
              <Text style={styles.notifDate}>
                {item.fecha || item.created_at || item.fecha_creacion || ''}
              </Text>
              {!isLeida && (
                <TouchableOpacity
                  onPress={() => handleMarkAsRead(item)}
                  disabled={markingId === item.id}
                  style={styles.markReadButton}
                >
                  <Text style={styles.markReadText}>
                    {markingId === item.id ? '...' : 'Marcar leído'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Card>
    );
  };

  // ─── Loading ───────────────────────────────────────────────

  if (loading && !refreshing) {
    return (
      <View style={styles.screen}>
        <Header title="Notificaciones" subtitle="Centro de notificaciones" />
        <LoadingSpinner fullScreen message="Cargando notificaciones..." />
      </View>
    );
  }

  // ─── Error ─────────────────────────────────────────────────

  if (error && !refreshing && notificaciones.length === 0) {
    return (
      <View style={styles.screen}>
        <Header title="Notificaciones" subtitle="Centro de notificaciones" />
        <EmptyState
          icon={<Text style={styles.errorIcon}>⚠️</Text>}
          title="Error"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={() => fetchNotificaciones()}
        />
      </View>
    );
  }

  // ─── Empty ─────────────────────────────────────────────────

  if (!loading && notificaciones.length === 0) {
    return (
      <View style={styles.screen}>
        <Header title="Notificaciones" subtitle="Centro de notificaciones" />
        <EmptyState
          icon={<Text style={styles.emptyIcon}>🔔</Text>}
          title="Sin notificaciones"
          subtitle="No tiene notificaciones nuevas."
          actionLabel="Actualizar"
          onAction={() => fetchNotificaciones(true)}
        />
      </View>
    );
  }

  // ─── Main List ─────────────────────────────────────────────

  const unreadCount = notificaciones.filter(
    (n) => !n.leida && !n.read
  ).length;

  return (
    <View style={styles.screen}>
      <Header
        title="Notificaciones"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} sin leer`
            : 'Centro de notificaciones'
        }
      />

      <FlatList
        data={notificaciones}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotificacionItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchNotificaciones(true)}
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
  notifCard: {
    marginBottom: spacing.md,
  },
  notifCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  notifRow: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notifIcon: {
    fontSize: typography.xl,
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  notifTitle: {
    flex: 1,
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.text,
    marginRight: spacing.sm,
  },
  notifTitleUnread: {
    fontWeight: typography.semibold,
    color: colors.primary,
  },
  notifMessage: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.normal,
    marginBottom: spacing.sm,
  },
  notifFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifDate: {
    fontSize: typography.xs,
    color: colors.textLight,
  },
  markReadButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markReadText: {
    fontSize: typography.xs,
    color: colors.secondary,
    fontWeight: typography.medium,
  },
  emptyIcon: {
    fontSize: 48,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default NotificacionesScreen;
