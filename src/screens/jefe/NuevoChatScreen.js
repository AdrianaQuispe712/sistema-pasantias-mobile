/**
 * NuevoChatScreen - Seleccionar pasante para iniciar conversación
 *
 * Muestra la lista de pasantes asignados al jefe.
 * Al tocar un pasante, crea o obtiene la conversación y navega al Chat.
 *
 * @module screens/jefe/NuevoChatScreen
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
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Avatar, EmptyState, LoadingSpinner } from '../../components/ui';
import { getPasantes } from '../../api/jefePasantes';
import { createConversacion } from '../../api/jefeMensajeria';

const NuevoChatScreen = ({ navigation }) => {
  const [pasantes, setPasantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [creatingId, setCreatingId] = useState(null);

  const fetchPasantes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      const data = await getPasantes();
      setPasantes(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setError('No se pudieron cargar los pasantes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPasantes();
  }, [fetchPasantes]);

  const handleSelectPasante = async (pasante) => {
    if (creatingId) return;

    setCreatingId(pasante.id);

    try {
      const result = await createConversacion({ idPasante: pasante.id });
      navigation.replace('Chat', {
        conversationId: result.id,
        pasanteId: pasante.id,
        pasanteName: pasante.nombre || pasante.name || 'Pasante',
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'No se pudo crear la conversación.';
      Alert.alert('Error', msg);
    } finally {
      setCreatingId(null);
    }
  };

  // ─── Render ────────────────────────────────────────────────

  const renderPasanteItem = ({ item }) => {
    const nombre = item.nombre || item.name || 'Pasante';
    const email = item.email || item.correo || '';
    const initials = nombre
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    const isCreating = creatingId === item.id;

    return (
      <TouchableOpacity
        style={[styles.card, isCreating && styles.cardCreating]}
        onPress={() => handleSelectPasante(item)}
        activeOpacity={0.7}
        disabled={!!creatingId}
      >
        <View style={styles.cardRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {isCreating ? 'Creando conversación...' : nombre}
            </Text>
            {email ? (
              <Text style={styles.cardEmail} numberOfLines={1}>
                {email}
              </Text>
            ) : null}
          </View>

          {!isCreating && (
            <Text style={styles.chatIcon}>💬</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Loading ───────────────────────────────────────────────

  if (loading && !refreshing) {
    return (
      <View style={styles.screen}>
        <LoadingSpinner fullScreen message="Cargando pasantes..." />
      </View>
    );
  }

  // ─── Error ─────────────────────────────────────────────────

  if (error && !refreshing && pasantes.length === 0) {
    return (
      <View style={styles.screen}>
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

  // ─── Empty ─────────────────────────────────────────────────

  if (!loading && pasantes.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon={<Text style={styles.emptyIcon}>👥</Text>}
          title="Sin pasantes"
          subtitle="No tienes pasantes asignados para iniciar una conversación."
          actionLabel="Actualizar"
          onAction={() => fetchPasantes(true)}
        />
      </View>
    );
  }

  // ─── Main List ─────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <Text style={styles.hint}>Elige un pasante para iniciar el chat</Text>

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
  hint: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cardCreating: {
    backgroundColor: colors.infoLight,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.white,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: typography.md,
    fontWeight: typography.medium,
    color: colors.text,
  },
  cardEmail: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chatIcon: {
    fontSize: 20,
    marginLeft: spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default NuevoChatScreen;
