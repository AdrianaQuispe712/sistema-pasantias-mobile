/**
 * OfertaDetailScreen - Detalle de una oferta de pasantía
 *
 * Muestra información completa de una oferta:
 * - Datos de la empresa (nombre, dirección)
 * - Descripción, modalidad, fechas, vacantes
 * - Botón "Postularse" con modal de confirmación
 * - Estados de carga y error
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Button, Header, Badge, Card, LoadingSpinner, EmptyState } from '../../components/ui';
import { getOferta, postularse } from '../../api/ofertas';
import { formatDate } from '../../utils/dateUtils';

const OfertaDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { ofertaId, showPostular = false } = route.params || {};

  // States
  const [oferta, setOferta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [postulacionExitosa, setPostulacionExitosa] = useState(false);

  /**
   * Carga el detalle de la oferta
   */
  const fetchOferta = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getOferta(ofertaId);
      setOferta(data);
    } catch (err) {
      console.error('Error al cargar oferta:', err);
      setError('No se pudo cargar el detalle de la oferta.');
    } finally {
      setLoading(false);
    }
  }, [ofertaId]);

  // Carga inicial
  useEffect(() => {
    fetchOferta();
  }, [fetchOferta]);

  // Muestra modal de postulación si se navegó con showPostular
  useEffect(() => {
    if (showPostular && oferta && !postulacionExitosa) {
      setShowConfirmModal(true);
    }
  }, [showPostular, oferta, postulacionExitosa]);

  /**
   * Maneja la postulación a la oferta
   */
  const handlePostularse = useCallback(async () => {
    try {
      setSubmitting(true);
      await postularse(ofertaId);
      setPostulacionExitosa(true);
      setShowConfirmModal(false);
      Alert.alert(
        '¡Postulación exitosa!',
        'Tu postulación ha sido registrada correctamente. Recibirás una notificación cuando sea revisada.',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error al postularse:', err);
      const message =
        err.response?.data?.message || 'No se pudo completar la postulación. Intente nuevamente.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }, [ofertaId, navigation]);

  /**
   * Abre el modal de confirmación
   */
  const openConfirmModal = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  /**
   * Cierra el modal de confirmación
   */
  const closeConfirmModal = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  /**
   * Navega a la pantalla de evidencias
   */
  const handleVerEvidencias = useCallback(() => {
    // Placeholder para futura implementación
  }, []);

  // Estado de carga
  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Detalle de Oferta" />
        <LoadingSpinner fullScreen message="Cargando detalle..." />
      </View>
    );
  }

  // Estado de error
  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Detalle de Oferta" />
        <EmptyState
          icon={<Text style={styles.emptyIcon}>⚠️</Text>}
          title="Error al cargar"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={fetchOferta}
        />
      </View>
    );
  }

  // Oferta no encontrada
  if (!oferta) {
    return (
      <View style={styles.container}>
        <Header title="Detalle de Oferta" />
        <EmptyState
          icon={<Text style={styles.emptyIcon}>🔍</Text>}
          title="Oferta no encontrada"
          subtitle="La oferta que buscas no existe o fue removida."
          actionLabel="Volver"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Detalle de Oferta" />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Empresa */}
        <Card variant="outlined" style={styles.section}>
          <View style={styles.empresaHeader}>
            <View style={styles.empresaAvatar}>
              <Text style={styles.empresaInitials}>
                {oferta.empresa?.nombre
                  ?.split(' ')
                  .map((w) => w.charAt(0))
                  .join('')
                  .substring(0, 2)
                  .toUpperCase() || 'E'}
              </Text>
            </View>
            <View style={styles.empresaInfo}>
              <Text style={styles.empresaNombre}>
                {oferta.empresa?.nombre || 'Empresa'}
              </Text>
              {oferta.empresa?.direccion && (
                <Text style={styles.empresaDireccion}>
                  📍 {oferta.empresa.direccion}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Título y badges */}
        <Card variant="default" style={styles.section}>
          <Text style={styles.ofertaTitulo}>
            {oferta.titulo || 'Sin título'}
          </Text>

          <View style={styles.badgesRow}>
            {oferta.modalidad && (
              <Badge variant="info" size="sm" label={oferta.modalidad} />
            )}
            {oferta.vacantes && (
              <Badge
                variant="neutral"
                size="sm"
                label={`${oferta.vacantes} vacante${oferta.vacantes > 1 ? 's' : ''}`}
              />
            )}
          </View>
        </Card>

        {/* Descripción */}
        <Card variant="default" style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.sectionContent}>
            {oferta.descripcion || 'Sin descripción disponible.'}
          </Text>
        </Card>

        {/* Información de fechas */}
        {(oferta.fechaInicio || oferta.fechaFin) && (
          <Card variant="default" style={styles.section}>
            <Text style={styles.sectionTitle}>Período</Text>
            <View style={styles.datesContainer}>
              {oferta.fechaInicio && (
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Inicio</Text>
                  <Text style={styles.dateValue}>{formatDate(oferta.fechaInicio)}</Text>
                </View>
              )}
              {oferta.fechaFin && (
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Fin</Text>
                  <Text style={styles.dateValue}>{formatDate(oferta.fechaFin)}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Requisitos */}
        {oferta.requisitos && (
          <Card variant="default" style={styles.section}>
            <Text style={styles.sectionTitle}>Requisitos</Text>
            <Text style={styles.sectionContent}>{oferta.requisitos}</Text>
          </Card>
        )}

        {/* Beneficios */}
        {oferta.beneficios && (
          <Card variant="default" style={styles.section}>
            <Text style={styles.sectionTitle}>Beneficios</Text>
            <Text style={styles.sectionContent}>{oferta.beneficios}</Text>
          </Card>
        )}

        {/* Espaciado inferior para el botón fijo */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Botón fijo de postulación */}
      <View style={styles.bottomBar}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          title={postulacionExitosa ? 'Ya te postulaste' : 'Postularse ahora'}
          onPress={openConfirmModal}
          disabled={postulacionExitosa}
        />
      </View>

      {/* Modal de confirmación de postulación */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar postulación</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro que deseas postularte a{' '}
              <Text style={styles.modalHighlight}>{oferta.titulo}</Text>
              {' '}en {oferta.empresa?.nombre || 'la empresa'}?
            </Text>
            <Text style={styles.modalSubtext}>
              Recibirás una notificación cuando tu postulación sea revisada.
            </Text>

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                size="md"
                title="Cancelar"
                onPress={closeConfirmModal}
                style={styles.modalButton}
                disabled={submitting}
              />
              <Button
                variant="primary"
                size="md"
                title="Confirmar"
                onPress={handlePostularse}
                loading={submitting}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  // Empresa
  empresaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empresaAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  empresaInitials: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textOnPrimary,
  },
  empresaInfo: {
    flex: 1,
  },
  empresaNombre: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  empresaDireccion: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Oferta
  ofertaTitulo: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // Secciones
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    fontSize: typography.md,
    color: colors.textSecondary,
    lineHeight: typography.md * typography.normal,
  },
  // Fechas
  datesContainer: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.grayMedium,
    marginBottom: spacing.xs,
  },
  dateValue: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.primary,
  },
  // Botón inferior
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.md,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalMessage: {
    fontSize: typography.md,
    color: colors.text,
    textAlign: 'center',
    lineHeight: typography.md * typography.normal,
    marginBottom: spacing.sm,
  },
  modalHighlight: {
    fontWeight: typography.bold,
    color: colors.primary,
  },
  modalSubtext: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  backIcon: {
    fontSize: typography.xl,
    color: colors.textOnPrimary,
  },
  emptyIcon: {
    fontSize: 48,
  },
});

export default OfertaDetailScreen;
