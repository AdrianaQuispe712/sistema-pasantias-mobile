/**
 * InscripcionDetailScreen - Detalle de una inscripción (rol Gerente)
 *
 * Muestra información completa de la inscripción, datos del pasante,
 * oferta asociada y botones de aprobar/rechazar para pendientes.
 *
 * @module screens/gerente/InscripcionDetailScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  Header,
  Card,
  Badge,
  Button,
  Avatar,
  EmptyState,
  LoadingSpinner,
} from '../../components/ui';
import {
  getInscripcion,
  aprobar,
  rechazar,
} from '../../api/gerenteInscripciones';

/**
 * Badge variant según estado
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
    default:
      return { variant: 'neutral', label: estado || 'Sin estado' };
  }
};

const InscripcionDetailScreen = ({ route, navigation }) => {
  const { inscripcionId } = route?.params || {};

  const [inscripcion, setInscripcion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchInscripcion = useCallback(async () => {
    if (!inscripcionId) {
      setError('ID de inscripción no proporcionado');
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
      setError('No se pudo cargar la inscripción');
    } finally {
      setLoading(false);
    }
  }, [inscripcionId]);

  useEffect(() => {
    fetchInscripcion();
  }, [fetchInscripcion]);

  const handleAprobar = () => {
    Alert.alert('Aprobar Inscripción', '¿Desea aprobar esta inscripción?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprobar',
        onPress: async () => {
          try {
            setActionLoading('aprobar');
            await aprobar(inscripcionId);
            Alert.alert('Éxito', 'Inscripción aprobada');
            fetchInscripcion();
          } catch (err) {
            Alert.alert('Error', 'No se pudo aprobar la inscripción');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleRechazar = () => {
    Alert.alert('Rechazar Inscripción', '¿Desea rechazar esta inscripción?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rechazar',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading('rechazar');
            await rechazar(inscripcionId);
            Alert.alert('Éxito', 'Inscripción rechazada');
            fetchInscripcion();
          } catch (err) {
            Alert.alert('Error', 'No se pudo rechazar la inscripción');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.screen}>
        <Header
          title="Detalle"
          subtitle="Inscripción"
          leftIcon={<Text style={styles.backIcon}>←</Text>}
          onLeftPress={() => navigation?.goBack()}
        />
        <LoadingSpinner fullScreen message="Cargando inscripción..." />
      </View>
    );
  }

  if (error || !inscripcion) {
    return (
      <View style={styles.screen}>
        <Header
          title="Detalle"
          subtitle="Inscripción"
          leftIcon={<Text style={styles.backIcon}>←</Text>}
          onLeftPress={() => navigation?.goBack()}
        />
        <EmptyState
          icon={<Text style={styles.errorIcon}>⚠️</Text>}
          title="Error"
          subtitle={error || 'Inscripción no encontrada'}
          actionLabel="Reintentar"
          onAction={fetchInscripcion}
        />
      </View>
    );
  }

  const badge = getStatusBadge(inscripcion.estado);
  const isPending =
    inscripcion.estado === 'pendiente' ||
    inscripcion.estado?.toLowerCase() === 'pending';

  // Pasante info
  const pasante = inscripcion.pasante || {};
  const pasanteName =
    inscripcion.pasante_nombre ||
    pasante.nombre ||
    `${pasante.nombre || ''} ${pasante.apellido || ''}`.trim();
  const pasanteEmail = inscripcion.pasante_email || pasante.email || '';
  const pasanteTelefono = inscripcion.pasante_telefono || pasante.telefono || '';

  // Oferta info
  const oferta = inscripcion.oferta || {};
  const ofertaTitle =
    inscripcion.oferta_titulo || oferta.titulo || 'Sin título';
  const ofertaEmpresa = inscripcion.oferta_empresa || oferta.empresa || '';
  const ofertaDescripcion = inscripcion.oferta_descripcion || oferta.descripcion || '';

  return (
    <View style={styles.screen}>
      <Header
        title="Detalle Inscripción"
        subtitle={pasanteName || 'Inscripción'}
        leftIcon={<Text style={styles.backIcon}>←</Text>}
        onLeftPress={() => navigation?.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status Card ── */}
        <Card variant="elevated" style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Estado</Text>
            <Badge variant={badge.variant} label={badge.label} size="md" />
          </View>
          {inscripcion.fecha && (
            <Text style={styles.dateText}>📅 {inscripcion.fecha}</Text>
          )}
        </Card>

        {/* ── Pasante Info ── */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Información del Pasante</Text>
          <View style={styles.pasanteRow}>
            <Avatar name={pasanteName} size="lg" />
            <View style={styles.pasanteInfo}>
              <Text style={styles.pasanteName}>
                {pasanteName || 'Sin nombre'}
              </Text>
              {pasanteEmail ? (
                <Text style={styles.pasanteEmail}>{pasanteEmail}</Text>
              ) : null}
              {pasanteTelefono ? (
                <Text style={styles.pasantePhone}>{pasanteTelefono}</Text>
              ) : null}
            </View>
          </View>

          {/* Extra pasante data */}
          {pasante.carrera && (
            <View style={styles.extraInfo}>
              <Text style={styles.extraLabel}>Carrera</Text>
              <Text style={styles.extraValue}>{pasante.carrera}</Text>
            </View>
          )}
          {pasante.universidad && (
            <View style={styles.extraInfo}>
              <Text style={styles.extraLabel}>Universidad</Text>
              <Text style={styles.extraValue}>{pasante.universidad}</Text>
            </View>
          )}
        </Card>

        {/* ── Oferta Info ── */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Oferta Asociada</Text>
          <Text style={styles.ofertaTitle}>{ofertaTitle}</Text>
          {ofertaEmpresa ? (
            <Text style={styles.ofertaEmpresa}>🏢 {ofertaEmpresa}</Text>
          ) : null}
          {ofertaDescripcion ? (
            <Text style={styles.ofertaDescripcion}>{ofertaDescripcion}</Text>
          ) : null}
        </Card>

        {/* ── Actions (only for pending) ── */}
        {isPending && (
          <Card variant="default" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Acciones</Text>
            <View style={styles.actionsColumn}>
              <Button
                variant="primary"
                size="lg"
                title="Aprobar Inscripción"
                loading={actionLoading === 'aprobar'}
                disabled={actionLoading !== null}
                onPress={handleAprobar}
                fullWidth
                style={styles.actionButton}
              />
              <Button
                variant="ghost"
                size="lg"
                title="Rechazar Inscripción"
                loading={actionLoading === 'rechazar'}
                disabled={actionLoading !== null}
                onPress={handleRechazar}
                fullWidth
                style={[styles.actionButton, styles.dangerButton]}
                textStyle={styles.dangerText}
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  backIcon: {
    color: colors.textOnPrimary,
    fontSize: typography.xl,
  },
  statusCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusLabel: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  dateText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  pasanteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pasanteInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  pasanteName: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  pasanteEmail: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  pasantePhone: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  extraInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  extraLabel: {
    fontSize: typography.xs,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  extraValue: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.text,
  },
  ofertaTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  ofertaEmpresa: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  ofertaDescripcion: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.normal,
  },
  actionsColumn: {
    gap: spacing.sm,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  dangerButton: {
    borderColor: colors.error,
  },
  dangerText: {
    color: colors.error,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default InscripcionDetailScreen;
