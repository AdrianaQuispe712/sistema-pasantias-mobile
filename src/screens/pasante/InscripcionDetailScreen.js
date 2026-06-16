/**
 * InscripcionDetailScreen - Detalle de una inscripción (rol Pasante)
 *
 * Muestra:
 * - Estado de la inscripción con badge
 * - Información de la oferta (título, empresa, modalidad, fechas)
 * - Tiempo restante para confirmar (si aplica)
 * - Botones de Confirmar/Rechazar (si está en estado 'aceptado')
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Badge, LoadingSpinner, EmptyState } from '../../components/ui';
import { getInscripcion, confirmarInscripcion, rechazarInscripcion } from '../../api/pasanteInscripciones';

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
 * Retorna la variante del Badge según el estado
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

const InscripcionDetailScreen = ({ route }) => {
  const navigation = useNavigation();
  const { inscripcionId } = route?.params || {};

  const [inscripcion, setInscripcion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const fetchInscripcion = useCallback(async () => {
    if (!inscripcionId) {
      setError('ID de inscripción no proporcionado.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getInscripcion(inscripcionId);
      setInscripcion(data?.data || data);
    } catch (err) {
      console.error('Error fetching inscripcion:', err);
      setError('No se pudo cargar la inscripción.');
    } finally {
      setLoading(false);
    }
  }, [inscripcionId]);

  useFocusEffect(
    useCallback(() => {
      fetchInscripcion();
    }, [fetchInscripcion])
  );

  // Countdown timer
  useEffect(() => {
    if (!inscripcion?.confirmar_hasta || inscripcion?.estado !== 'aceptado') {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      setCountdown(getTimeRemaining(inscripcion.confirmar_hasta));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [inscripcion]);

  const handleConfirmar = () => {
    Alert.alert(
      'Confirmar Inscripción',
      '¿Deseas confirmar tu inscripción?\n\nSe eliminarán tus otras inscripciones pendientes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              setActionLoading(true);
              await confirmarInscripcion(inscripcionId);
              fetchInscripcion();
            } catch (err) {
              Alert.alert('Error', 'No se pudo confirmar la inscripción.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRechazar = () => {
    Alert.alert(
      'Rechazar Inscripción',
      '¿Deseas rechazar tu inscripción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await rechazarInscripcion(inscripcionId);
              fetchInscripcion();
            } catch (err) {
              Alert.alert('Error', 'No se pudo rechazar la inscripción.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Cargando inscripción..." />;
  }

  if (error || !inscripcion) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Error"
        subtitle={error || 'Inscripción no encontrada'}
        onAction={fetchInscripcion}
      />
    );
  }

  const badge = getEstadoBadge(inscripcion.estado);
  const canConfirm = inscripcion.estado === 'aceptado' && inscripcion.confirmar_hasta;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with estado */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Inscripción</Text>
          <Badge variant={badge.variant} label={badge.label} />
        </View>
        <Text style={styles.ofertaTitle}>{inscripcion.titulo}</Text>
        <Text style={styles.empresaName}>{inscripcion.empresa}</Text>
      </View>

      {/* Confirmation warning */}
      {canConfirm && (
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={20} color={colors.warning} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Confirmación requerida</Text>
            {countdown && countdown !== 'Expirado' ? (
              <Text style={styles.warningText}>
                Tiempo restante para confirmar: {countdown}
              </Text>
            ) : (
              <Text style={[styles.warningText, { color: colors.error }]}>
                Tiempo expirado — tu inscripción será rechazada automáticamente
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Detail info */}
      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Información de la Inscripción</Text>

        <View style={styles.detailRow}>
          <Ionicons name="document-text-outline" size={16} color={colors.primary} />
          <Text style={styles.detailLabel}>Oferta:</Text>
          <Text style={styles.detailValue}>{inscripcion.titulo}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={16} color={colors.primary} />
          <Text style={styles.detailLabel}>Empresa:</Text>
          <Text style={styles.detailValue}>{inscripcion.empresa}</Text>
        </View>

        {inscripcion.modalidad && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.detailLabel}>Modalidad:</Text>
            <Text style={styles.detailValue}>{inscripcion.modalidad}</Text>
          </View>
        )}

        {inscripcion.fechaInscripcion && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.detailLabel}>Fecha inscripción:</Text>
            <Text style={styles.detailValue}>
              {new Date(inscripcion.fechaInscripcion).toLocaleDateString('es-BO')}
            </Text>
          </View>
        )}

        {inscripcion.jefeNombre && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={colors.primary} />
            <Text style={styles.detailLabel}>Jefe:</Text>
            <Text style={styles.detailValue}>{inscripcion.jefeNombre}</Text>
          </View>
        )}

        {inscripcion.nota != null && (
          <View style={styles.detailRow}>
            <Ionicons name="star-outline" size={16} color={colors.primary} />
            <Text style={styles.detailLabel}>Nota:</Text>
            <Text style={styles.detailValue}>{inscripcion.nota}</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      {canConfirm && (
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={handleConfirmar}
            disabled={actionLoading}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
            <Text style={styles.confirmButtonText}>
              {actionLoading ? 'Procesando...' : 'Confirmar Inscripción'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleRechazar}
            disabled={actionLoading}
          >
            <Ionicons name="close-circle-outline" size={20} color={colors.white} />
            <Text style={styles.rejectButtonText}>
              {actionLoading ? 'Procesando...' : 'Rechazar Inscripción'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

// ── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
  },
  ofertaTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: 4,
  },
  empresaName: {
    fontSize: typography.md,
    color: colors.textSecondary,
  },
  warningCard: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.warning,
    marginBottom: 4,
  },
  warningText: {
    fontSize: typography.sm,
    color: colors.warning,
  },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    minWidth: 100,
  },
  detailValue: {
    fontSize: typography.sm,
    color: colors.text,
    fontWeight: typography.medium,
    flex: 1,
  },
  actionsCard: {
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
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
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
  rejectButtonText: {
    color: colors.white,
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
});

export default InscripcionDetailScreen;
