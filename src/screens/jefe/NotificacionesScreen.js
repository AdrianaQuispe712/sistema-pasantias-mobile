/**
 * NotificacionesScreen - Notificaciones computadas desde APIs (rol Jefe)
 *
 * Calcula notificaciones en tiempo real desde:
 * 1. Mensajes sin leer → "Tienes mensajes sin leer" (se descarta al tocar)
 * 2. Actividades en atraso → "Actividad atrasada: {titulo}" (NUNCA se descarta, persiste mientras siga atrasada)
 * 3. Actividades completadas → "Se marcó una actividad como completada" (se descarta al tocar)
 *
 * Delayed activities are state-based: they appear/disappear based on actual state, not user taps.
 * Unread messages and completed activities are dismissed on tap (stored in AsyncStorage).
 *
 * @module screens/jefe/NotificacionesScreen
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Card, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { getConversaciones } from '../../api/jefeMensajeria';
import { getMias, getCompletadas } from '../../api/jefeActividades';

const STORAGE_KEY_COMPLETED = '@jefe_completed_activities';
const STORAGE_KEY_DISMISSED = '@jefe_dismissed_notifs';

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
 * Parse a date string as LOCAL midnight (not UTC).
 * "2026-06-15" → June 15 at 00:00 in local timezone.
 * This prevents timezone bugs where UTC midnight is already the next day.
 */
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  // If it's a datetime like "2026-06-15 14:30:00", split and parse
  const dateOnly = String(dateStr).split('T')[0].split(' ')[0];
  const parts = dateOnly.split('-');
  if (parts.length !== 3) return new Date(dateStr); // fallback
  const [year, month, day] = parts.map(Number);
  return new Date(year, month - 1, day, 23, 59, 59); // end of day, local time
};

/**
 * Check if an activity is delayed: fecha_limite < now (using LOCAL dates)
 * NOTE: We do NOT filter by estado — a delayed activity stays delayed
 * even if later completed. The notification persists.
 */
const isActivityDelayed = (actividad) => {
  const fechaLimite = actividad.fecha_limite || actividad.fechaLimite;
  if (!fechaLimite) return false;

  const now = new Date();
  const limite = parseLocalDate(fechaLimite);
  return limite < now;
};

/**
 * Load dismissed notification IDs from AsyncStorage
 */
const loadDismissed = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_DISMISSED);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Save a notification ID to dismissed list
 */
const saveDismissed = async (id) => {
  try {
    const current = await loadDismissed();
    if (!current.includes(id)) {
      current.push(id);
      await AsyncStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(current));
    }
  } catch {}
};

const NotificacionesScreen = ({ navigation }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Build notifications from multiple API sources
   */
  const fetchNotificaciones = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      // Fetch all sources in parallel
      const [conversaciones, actividadesMias, actividadesCompletadas, dismissedIds] = await Promise.all([
        getConversaciones().catch(() => ({ conversaciones: [] })),
        getMias().catch(() => ({ data: [] })),
        getCompletadas().catch(() => ({ data: [] })),
        loadDismissed(),
      ]);

      const dismissedSet = new Set(dismissedIds);
      const convs = conversaciones?.conversaciones || [];
      const mias = Array.isArray(actividadesMias) ? actividadesMias : actividadesMias?.data || [];
      const completadas = Array.isArray(actividadesCompletadas)
        ? actividadesCompletadas
        : actividadesCompletadas?.data || [];

      const now = new Date();
      const notifs = [];

      // ─── 1. Unread messages (dismissable on tap) ─────────
      const totalUnread = convs.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      if (totalUnread > 0 && !dismissedSet.has('unread-messages')) {
        const convsWithUnread = convs.filter((c) => c.unread_count > 0);
        notifs.push({
          id: 'unread-messages',
          tipo: 'mensajes_sin_leer',
          icon: '💬',
          titulo: 'Tienes mensajes sin leer',
          descripcion: `${totalUnread} mensaje${totalUnread > 1 ? 's' : ''} sin leer en ${convsWithUnread.length} conversación${convsWithUnread.length > 1 ? 'es' : ''}`,
          badge: { variant: 'info', label: `${totalUnread} nuevo${totalUnread > 1 ? 's' : ''}` },
          target: 'Mensajes',
          timestamp: now.toISOString(),
          dismissable: true,
        });
      }

      // ─── 2. Delayed activities (NEVER dismissed, state-based) ──
      const delayed = mias.filter(isActivityDelayed);
      for (const act of delayed) {
        const titulo = act.titulo || act.nombre || 'Sin título';
        const pasante = act.pasante_nombre || act.pasanteNombre || '';
        const fechaLimite = act.fecha_limite || act.fechaLimite;
        const actId = act.id || act.idActividad;

        notifs.push({
          id: `delayed-${actId}`,
          tipo: 'actividad_atrasada',
          icon: '🔴',
          titulo: `Actividad atrasada: ${titulo}`,
          descripcion: pasante ? `Asignada a ${pasante} — venció ${formatDate(fechaLimite)}` : `Venció ${formatDate(fechaLimite)}`,
          badge: { variant: 'error', label: 'Atraso' },
          target: 'ActividadesTab',
          timestamp: now.toISOString(),
          dismissable: false, // ← NEVER dismissed
        });
      }

      // ─── 3. Completed activities (dismissable on tap) ─────
      const currentCompletedIds = completadas.map((a) => String(a.id || a.idActividad)).sort();

      // Load previously known completed IDs
      let prevCompletedIds = [];
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_COMPLETED);
        if (stored) prevCompletedIds = JSON.parse(stored);
      } catch {}

      // Detect newly completed (in current but not in previous)
      const prevSet = new Set(prevCompletedIds);
      const newCompleted = completadas.filter(
        (a) => !prevSet.has(String(a.id || a.idActividad))
      );

      for (const act of newCompleted) {
        const titulo = act.titulo || act.nombre || 'Sin título';
        const pasante = act.pasante_nombre || act.pasanteNombre || '';
        const actId = act.id || act.idActividad;
        const notifId = `completed-${actId}`;

        if (!dismissedSet.has(notifId)) {
          notifs.push({
            id: notifId,
            tipo: 'actividad_completada',
            icon: '✅',
            titulo: 'Se marcó una actividad como completada',
            descripcion: pasante ? `${titulo} — ${pasante}` : titulo,
            badge: { variant: 'error', label: 'Completada' },
            target: 'ActividadesTab',
            timestamp: now.toISOString(),
            dismissable: true,
          });
        }
      }

      // Save current completed IDs for next comparison
      try {
        await AsyncStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(currentCompletedIds));
      } catch {}

      // Sort by timestamp descending
      notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setNotificaciones(notifs);
    } catch {
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
   * Tocar una notificación:
   * - If dismissable: save to dismissed → removes from list
   * - If NOT dismissable (delayed): just navigate, never dismiss
   */
  const handlePress = async (notificacion) => {
    // Dismiss first (if allowed)
    if (notificacion.dismissable) {
      await saveDismissed(notificacion.id);
      setNotificaciones((prev) => prev.filter((n) => n.id !== notificacion.id));
    }

    // Navigate to target
    if (notificacion.target && navigation?.navigate) {
      navigation.navigate(notificacion.target);
    }
  };

  // ─── Render ────────────────────────────────────────────────

  const renderNotificacionItem = ({ item }) => {
    return (
      <Card
        variant="default"
        onPress={() => handlePress(item)}
        style={styles.notifCard}
      >
        <View style={styles.notifRow}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.notifIcon}>{item.icon}</Text>
          </View>

          {/* Content */}
          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle} numberOfLines={2}>
                {item.titulo}
              </Text>
              <Badge variant={item.badge.variant} label={item.badge.label} size="sm" />
            </View>

            <Text style={styles.notifMessage} numberOfLines={2}>
              {item.descripcion}
            </Text>

            {!item.dismissable && (
              <Text style={styles.persistentHint}>Se mantiene mientras siga atrasada</Text>
            )}
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
        <EmptyState
          icon={<Text style={styles.emptyIcon}>🔔</Text>}
          title="Sin notificaciones"
          subtitle="No tienes notificaciones nuevas."
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
    fontWeight: typography.semibold,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  notifMessage: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.normal,
  },
  persistentHint: {
    fontSize: typography.xs,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  emptyIcon: {
    fontSize: 48,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default NotificacionesScreen;
