/**
 * NotificacionesScreen - Listado de notificaciones (rol Gerente)
 *
 * Muestra solo notificaciones de tipo:
 * - nueva_inscripcion (badge: "Inscripción")
 * - actividad_completada (badge: "Actividad")
 *
 * Al tocar una notificación se marca como leída automáticamente.
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
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import {
  getNotificaciones,
  markAsRead,
} from '../../api/gerenteNotificaciones';
import { getInscripcion } from '../../api/gerenteInscripciones';

/**
 * Formatea fecha ISO a dd/mm/aaaa
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

/**
 * Configuración de tipos permitidos para gerente
 * target: tab name to navigate to when tapped
 */
const NOTIF_CONFIG = {
  nueva_inscripcion: {
    icon: 'create',
    badge: { variant: 'success', label: 'Inscripción' },
    target: 'InscripcionesTab',
    params: { initialFilter: 'pendiente' },
  },
  actividad_completada: {
    icon: 'clipboard',
    badge: { variant: 'info', label: 'Actividad' },
    target: 'DashboardTab',
  },
};

const DEFAULT_CONFIG = { icon: 'pin', badge: { variant: 'neutral', label: 'General' }, target: null };

const NotificacionesScreen = ({ navigation }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotificaciones = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      const data = await getNotificaciones();
      const all = Array.isArray(data) ? data : data?.data || [];
      // Filter: only keep allowed types
      setNotificaciones(all.filter((n) => NOTIF_CONFIG[n.tipo || n.type]));
    } catch (err) {
      console.error('Error fetching notificaciones:', err);
      setError('No se pudieron cargar las notificaciones.');
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

  /**
   * Tocar una notificación → auto mark as read + navigate to target
   */
  const handlePress = async (notificacion) => {
    const tipo = notificacion.tipo || notificacion.type;
    const config = NOTIF_CONFIG[tipo] || DEFAULT_CONFIG;

    // Mark as read if not already
    if (!notificacion.leida && !notificacion.read) {
      try {
        await markAsRead(notificacion.id);
        setNotificaciones((prev) =>
          prev.map((n) =>
            n.id === notificacion.id ? { ...n, leida: true, read: true } : n
          )
        );
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    }

    // Navigate to target tab
    if (config.target && navigation?.navigate) {
      // For nueva_inscripcion, fetch current state to determine filter
      if (tipo === 'nueva_inscripcion' && notificacion.data?.inscripcion_id) {
        try {
          const insc = await getInscripcion(notificacion.data.inscripcion_id);
          const estado = insc?.data?.estado || insc?.estado;
          const filterMap = {
            pendiente: 'pendiente',
            aceptado: 'aceptado',
            rechazado: 'rechazado',
            completado: 'completado',
          };
          const filter = filterMap[estado] || 'pendiente';
          navigation.navigate(config.target, { initialFilter: filter });
          return;
        } catch (err) {
          // Fallback to default filter
          console.error('Error fetching inscripcion:', err);
        }
      }
      navigation.navigate(config.target, config.params || {});
    }
  };

  // ─── Render ────────────────────────────────────────────────

  const renderNotificacionItem = ({ item }) => {
    const isLeida = item.leida || item.read;
    const tipo = item.tipo || item.type;
    const config = NOTIF_CONFIG[tipo] || DEFAULT_CONFIG;

    return (
      <Card
        variant={isLeida ? 'outlined' : 'default'}
        onPress={() => handlePress(item)}
        style={[styles.notifCard, !isLeida && styles.notifCardUnread]}
      >
        <View style={styles.notifRow}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name={config.icon} size={20} color={colors.grayMedium} />
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
              <Badge variant={config.badge.variant} label={config.badge.label} size="sm" />
            </View>

            <Text style={styles.notifMessage} numberOfLines={2}>
              {item.mensaje || item.message || item.descripcion || ''}
            </Text>

            <Text style={styles.notifDate}>
              {formatDate(item.fecha || item.created_at || item.fecha_creacion)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  // ─── Loading ───────────────────────────────────────────────

  if (loading && !refreshing) {
    return (
      <View style={styles.screen}>
        <LoadingSpinner fullScreen message="Cargando notificaciones..." />
      </View>
    );
  }

  // ─── Error ─────────────────────────────────────────────────

  if (error && !refreshing && notificaciones.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon={<Ionicons name="alert-circle" size={48} color={colors.error} />}
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
        <EmptyState
          icon={<Ionicons name="notifications-outline" size={48} color={colors.grayMedium} />}
          title="Sin notificaciones"
          subtitle="No tiene notificaciones nuevas."
          actionLabel="Actualizar"
          onAction={() => fetchNotificaciones(true)}
        />
      </View>
    );
  }

  // ─── Main List ─────────────────────────────────────────────

  return (
    <View style={styles.screen}>
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
  notifDate: {
    fontSize: typography.xs,
    color: colors.textLight,
  },
  emptyIcon: {
    fontSize: 48,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default NotificacionesScreen;
