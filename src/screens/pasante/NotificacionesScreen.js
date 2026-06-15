/**
 * NotificacionesScreen - Pantalla de notificaciones del pasante
 *
 * Lista de notificaciones con:
 * - Iconos según tipo de notificación
 * - Indicador de no leído (punto + texto en negrita)
 * - Tap para marcar como leída
 * - Pull-to-refresh
 * - Estados vacío y de carga
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
import { Card, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { getNotificaciones, markAsRead } from '../../api/notificaciones';
import { formatDate } from '../../utils/dateUtils';

const NotificacionesScreen = () => {
  const navigation = useNavigation();

  // States
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Carga las notificaciones desde la API
   */
  const fetchNotificaciones = useCallback(async () => {
    try {
      setError(null);
      const data = await getNotificaciones();
      setNotificaciones(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
      setError('No se pudieron cargar las notificaciones.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  /**
   * Pull-to-refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  /**
   * Marca una notificación como leída
   */
  const handleMarkAsRead = useCallback(
    async (notif) => {
      if (notif.leida || notif.read) return;

      try {
        await markAsRead(notif.id);

        // Actualiza el estado local
        setNotificaciones((prev) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, leida: true, read: true } : n
          )
        );
      } catch (err) {
        console.error('Error al marcar como leída:', err);
      }
    },
    []
  );

  /**
   * Obtiene el icono según el tipo de notificación
   */
  const getNotificationIcon = useCallback((tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'asignacion':
      case 'asignación':
        return '📋';
      case 'completada':
      case 'aprobada':
        return '✅';
      case 'rechazada':
        return '❌';
      case 'recordatorio':
        return '⏰';
      case 'sistema':
        return 'ℹ️';
      case 'mensaje':
        return '💬';
      case 'alerta':
        return '⚠️';
      default:
        return '🔔';
    }
  }, []);

  /**
   * Obtiene el badge variant según el tipo
   */
  const getNotificationBadgeVariant = useCallback((tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'completada':
      case 'aprobada':
        return 'success';
      case 'rechazada':
        return 'error';
      case 'recordatorio':
      case 'alerta':
        return 'warning';
      case 'asignacion':
      case 'asignación':
        return 'info';
      default:
        return 'neutral';
    }
  }, []);

  /**
   * Renderiza una notificación
   */
  const renderNotificacionItem = useCallback(
    ({ item: notif }) => {
      const isUnread = !notif.leida && !notif.read;

      return (
        <TouchableOpacity
          style={[
            styles.notifCard,
            isUnread && styles.notifCardUnread,
          ]}
          onPress={() => handleMarkAsRead(notif)}
          activeOpacity={0.7}
        >
          {/* Icono de la notificación */}
          <View style={styles.notifIconContainer}>
            <Text style={styles.notifIcon}>
              {getNotificationIcon(notif.tipo || notif.type)}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>

          {/* Contenido de la notificación */}
          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              <Text
                style={[
                  styles.notifTitle,
                  isUnread && styles.notifTitleUnread,
                ]}
                numberOfLines={1}
              >
                {notif.titulo || notif.title || 'Notificación'}
              </Text>
            </View>

            <Text
              style={[
                styles.notifMessage,
                isUnread && styles.notifMessageUnread,
              ]}
              numberOfLines={3}
            >
              {notif.mensaje || notif.message || notif.descripcion || ''}
            </Text>

            <Text style={styles.notifDate}>
              {formatDate(notif.fecha || notif.created_at || notif.fechaCreacion) || ''}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleMarkAsRead, getNotificationIcon, getNotificationBadgeVariant]
  );

  /**
   * Renderiza el estado vacío
   */
  const renderEmpty = () => {
    if (loading) return null;

    return (
      <EmptyState
        icon={<Text style={styles.emptyIcon}>🔔</Text>}
        title="Sin notificaciones"
        subtitle="No tienes notificaciones nuevas en este momento."
      />
    );
  };

  // Estado de carga inicial
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <LoadingSpinner fullScreen message="Cargando notificaciones..." />
      </View>
    );
  }

  // Estado de error
  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Text style={styles.emptyIcon}>⚠️</Text>}
          title="Error al cargar"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={fetchNotificaciones}
        />
      </View>
    );
  }

  // Contar no leídas
  const unreadCount = notificaciones.filter(
    (n) => !n.leida && !n.read
  ).length;

  return (
    <View style={styles.container}>
      {/* Contador de no leídas */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            Tienes {unreadCount} notificación{unreadCount > 1 ? 'es' : ''} sin leer
          </Text>
        </View>
      )}

      <FlatList
        data={notificaciones}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotificacionItem}
        ListEmptyComponent={renderEmpty}
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
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  // Banner de no leídas
  unreadBanner: {
    backgroundColor: colors.infoLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.info,
  },
  unreadBannerText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.info,
    textAlign: 'center',
  },
  // Tarjeta de notificación
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  notifCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  // Icono
  notifIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grayBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  notifIcon: {
    fontSize: typography.xl,
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  // Contenido
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notifTitle: {
    fontSize: typography.md,
    fontWeight: typography.medium,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  notifTitleUnread: {
    fontWeight: typography.bold,
    color: colors.primary,
  },
  notifMessage: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.normal,
    marginBottom: spacing.xs,
  },
  notifMessageUnread: {
    color: colors.text,
  },
  notifDate: {
    fontSize: typography.xs,
    color: colors.grayLight,
  },
  emptyIcon: {
    fontSize: 48,
  },
});

export default NotificacionesScreen;
