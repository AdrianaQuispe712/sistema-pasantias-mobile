/**
 * MensajesScreen - Lista de conversaciones (rol Pasante)
 *
 * Muestra todas las conversaciones activas con el jefe de pasante,
 * incluyendo último mensaje, badge de no leídos, y nombre del jefe.
 *
 * Al tocar una conversación se navega al ChatScreen.
 *
 * @module screens/pasante/MensajesScreen
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
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { Card, EmptyState, LoadingSpinner } from '../../components/ui';
import { getConversaciones } from '../../api/pasanteMensajeria';

/**
 * Formatea fecha ISO a un formato legible (dd/mm hh:mm)
 */
const formatMessageDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  } catch {
    return '';
  }
};

const MensajesScreen = ({ navigation }) => {
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchConversaciones = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      const data = await getConversaciones();
      setConversaciones(data?.conversaciones || []);
    } catch {
      setError('No se pudieron cargar las conversaciones.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversaciones();
  }, [fetchConversaciones]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchConversaciones();
    });
    return unsubscribe;
  }, [navigation, fetchConversaciones]);

  const handleConversationPress = (conversacion) => {
    navigation.navigate('PasanteChat', {
      conversationId: conversacion.id,
      jefeId: conversacion.jefe?.idJefe,
      jefeName: conversacion.jefe?.user
        ? `${conversacion.jefe.user.nombre} ${conversacion.jefe.user.apellido}`
        : 'Jefe de Pasante',
    });
  };

  // ─── Render ────────────────────────────────────────────────

  const renderConversationItem = ({ item: conv }) => {
    const jefeName = conv.jefe?.user
      ? `${conv.jefe.user.nombre} ${conv.jefe.user.apellido}`
      : 'Jefe de Pasante';
    const initials = jefeName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    const lastMessage = conv.lastMessage?.contenido || '';
    const unread = conv.unread_count || 0;
    const hasUnread = unread > 0;

    return (
      <TouchableOpacity
        style={[styles.convCard, hasUnread && styles.convCardUnread]}
        onPress={() => handleConversationPress(conv)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={[styles.avatar, hasUnread && styles.avatarUnread]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Content */}
        <View style={styles.convContent}>
          <View style={styles.convHeader}>
            <Text
              style={[styles.convName, hasUnread && styles.convNameUnread]}
              numberOfLines={1}
            >
              {jefeName}
            </Text>
            <Text style={styles.convDate}>
              {formatMessageDate(conv.ultimo_mensaje_at)}
            </Text>
          </View>

          <View style={styles.convFooter}>
            <Text
              style={[styles.convLastMessage, hasUnread && styles.convLastMessageUnread]}
              numberOfLines={1}
            >
              {lastMessage || 'Sin mensajes'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Loading ───────────────────────────────────────────────

  if (loading && !refreshing) {
    return (
      <View style={styles.screen}>
        <LoadingSpinner fullScreen message="Cargando conversaciones..." />
      </View>
    );
  }

  // ─── Error ─────────────────────────────────────────────────

  if (error && !refreshing && conversaciones.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon={<Ionicons name="alert-circle" size={48} color={colors.error} />}
          title="Error"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={() => fetchConversaciones()}
        />
      </View>
    );
  }

  // ─── Empty ─────────────────────────────────────────────────

  if (!loading && conversaciones.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon={<Ionicons name="chatbubbles-outline" size={48} color={colors.grayMedium} />}
          title="Sin conversaciones"
          subtitle="No hay conversaciones activas con tu jefe de pasante."
          actionLabel="Actualizar"
          onAction={() => fetchConversaciones(true)}
        />
      </View>
    );
  }

  // ─── Main List ─────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <FlatList
        data={conversaciones}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderConversationItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchConversaciones(true)}
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
    paddingBottom: spacing.xxxl,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  convCardUnread: {
    backgroundColor: colors.infoLight,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grayBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarUnread: {
    backgroundColor: colors.secondary,
  },
  avatarText: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.white,
  },
  convContent: {
    flex: 1,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  convName: {
    fontSize: typography.md,
    fontWeight: typography.medium,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  convNameUnread: {
    fontWeight: typography.bold,
    color: colors.primary,
  },
  convDate: {
    fontSize: typography.xs,
    color: colors.textLight,
  },
  convFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convLastMessage: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  convLastMessageUnread: {
    color: colors.text,
    fontWeight: typography.medium,
  },
  unreadBadge: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  unreadBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.white,
  },
  emptyIcon: {
    fontSize: 48,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default MensajesScreen;
