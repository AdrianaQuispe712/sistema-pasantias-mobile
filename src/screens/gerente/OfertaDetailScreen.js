/**
 * OfertaDetailScreen - Detalle de una oferta de pasantía (rol Gerente)
 *
 * Muestra información completa de la oferta, lista de postulantes,
 * vacantes y botones de toggle de estado.
 *
 * @module screens/gerente/OfertaDetailScreen
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  Card,
  Badge,
  Button,
  Avatar,
  EmptyState,
  LoadingSpinner,
} from '../../components/ui';
import {
  getOferta,
  getPostulantes,
  toggleCerrar,
  toggleActivar,
  toggleTerminar,
  checkInformes,
  deleteOferta,
} from '../../api/gerenteOfertas';

/**
 * Badge variant según estado
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

/**
 * Badge para estado de postulante
 */
const getPostulanteBadge = (estado) => {
  switch (estado) {
    case 'aceptado':
    case 'aceptada':
      return { variant: 'success', label: 'Aceptado' };
    case 'completado':
    case 'completada':
      return { variant: 'info', label: 'Completado' };
    default:
      return { variant: 'neutral', label: estado || 'Sin estado' };
  }
};

const OfertaDetailScreen = ({ route, navigation }) => {
  const { ofertaId } = route?.params || {};

  const [oferta, setOferta] = useState(null);
  const [postulantes, setPostulantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = useCallback(async () => {
    if (!ofertaId) {
      setError('ID de oferta no proporcionado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [ofertaData, postulantesData] = await Promise.all([
        getOferta(ofertaId),
        getPostulantes(ofertaId).catch(() => []),
      ]);

      setOferta(ofertaData?.data || ofertaData);
      setPostulantes(
        Array.isArray(postulantesData) ? postulantesData : postulantesData?.data || []
      );
    } catch (err) {
      console.error('Error fetching oferta detail:', err);
      setError('No se pudo cargar el detalle de la oferta');
    } finally {
      setLoading(false);
    }
  }, [ofertaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrar postulantes: solo aceptado y completado (ANTES de los returns condicionales)
  const postulantesFiltrados = useMemo(() => {
    return postulantes.filter((p) => {
      const estado = p.estado?.toLowerCase();
      return estado === 'aceptado' || estado === 'aceptada' ||
             estado === 'completado' || estado === 'completada';
    });
  }, [postulantes]);

  const handleCerrar = () => {
    Alert.alert(
      'Cerrar Oferta',
      '¿Desea cerrar esta oferta?\n\n' +
      'Nota: Todos los pasantes aceptados deben tener un jefe asignado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading('cerrar');
              await toggleCerrar(ofertaId);
              Alert.alert('Éxito', 'Oferta cerrada');
              fetchData();
            } catch (err) {
              const message =
                err?.response?.data?.message ||
                'No se pudo cerrar la oferta. Verifique que todos los pasantes aceptados tengan un jefe asignado.';
              Alert.alert('Error', message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleReabrir = () => {
    Alert.alert(
      'Reabrir Oferta',
      '¿Desea reabrir esta oferta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reabrir',
          style: 'default',
          onPress: async () => {
            try {
              setActionLoading('reabrir');
              await toggleActivar(ofertaId);
              Alert.alert('Éxito', 'Oferta reabierta');
              fetchData();
            } catch (err) {
              const message =
                err?.response?.data?.message ||
                'No se pudo reabrir la oferta';
              Alert.alert('Error', message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleTerminar = async () => {
    // Primero verificar si todos los informes están subidos
    try {
      setActionLoading('verificar');
      const informesData = await checkInformes(ofertaId);
      const informes = informesData?.data || informesData;

      if (!informes?.puede_terminar) {
        const sinInforme = informes?.sin_informe || 0;
        Alert.alert(
          'No se puede terminar',
          `Hay ${sinInforme} pasante(s) sin informe final.\n\n` +
          'Todos los pasantes aceptados o completados deben tener su informe final subido antes de terminar la oferta.'
        );
        setActionLoading(null);
        return;
      }

      setActionLoading(null);
    } catch (err) {
      setActionLoading(null);
      Alert.alert('Error', 'No se pudo verificar el estado de los informes');
      return;
    }

    // Si todo está bien, preguntar confirmación
    Alert.alert(
      'Terminar Oferta',
      '¿Desea marcar esta oferta como terminada?\n\n' +
      'Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading('terminar');
              await toggleTerminar(ofertaId);
              Alert.alert('Éxito', 'Oferta terminada');
              fetchData();
            } catch (err) {
              const message =
                err?.response?.data?.message ||
                'No se pudo terminar la oferta';
              Alert.alert('Error', message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    // Verificar que no haya postulantes aceptados/completados
    try {
      setActionLoading('verificar');
      const postulantesResponse = await getPostulantes(ofertaId);
      const postulantes = postulantesResponse?.data || postulantesResponse || [];
      const bloqueados = postulantes.filter((p) => {
        const estado = p.estado?.toLowerCase();
        return (
          estado === 'aceptada' ||
          estado === 'aceptado' ||
          estado === 'completada' ||
          estado === 'completado'
        );
      });

      if (bloqueados.length > 0) {
        Alert.alert(
          'No se puede eliminar',
          'Esta oferta tiene inscripciones aceptadas o completadas y no puede ser eliminada.'
        );
        setActionLoading(null);
        return;
      }
    } catch (err) {
      console.error('Error checking postulantes:', err);
      // If we can't check, allow the delete attempt (backend will validate)
    }

    // Resetear loading ANTES de mostrar el diálogo
    setActionLoading(null);

    Alert.alert(
      'Eliminar Oferta',
      '¿Está seguro que desea eliminar esta oferta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading('eliminar');
              await deleteOferta(ofertaId);
              Alert.alert('Éxito', 'Oferta eliminada', [
                { text: 'OK', onPress: () => navigation?.goBack() },
              ]);
            } catch (err) {
              console.error('Error deleting oferta:', err);
              const message =
                err?.response?.data?.message ||
                'No se pudo eliminar la oferta';
              Alert.alert('Error', message);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.screen}>
        <LoadingSpinner fullScreen message="Cargando oferta..." />
      </View>
    );
  }

  if (error || !oferta) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon={<Ionicons name="alert-circle" size={48} color={colors.error} />}
          title="Error"
          subtitle={error || 'Oferta no encontrada'}
          actionLabel="Reintentar"
          onAction={fetchData}
        />
      </View>
    );
  }

  const badge = getStatusBadge(oferta.estado);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Info Card ── */}
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {oferta.titulo || oferta.nombre || 'Sin título'}
            </Text>
            <Badge variant={badge.variant} label={badge.label} size="sm" />
          </View>

          {oferta.descripcion ? (
            <Text style={styles.description}>{oferta.descripcion}</Text>
          ) : null}

          <View style={styles.infoGrid}>
            {oferta.empresa && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Empresa</Text>
                <Text style={styles.infoValue}>{oferta.empresa}</Text>
              </View>
            )}
            {oferta.fechaInicio && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fecha Inicio</Text>
                <Text style={styles.infoValue}>{oferta.fechaInicio}</Text>
              </View>
            )}
            {oferta.fechaFinal && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fecha Final</Text>
                <Text style={styles.infoValue}>{oferta.fechaFinal}</Text>
              </View>
            )}
            {oferta.salario && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Remuneración</Text>
                <Text style={styles.infoValue}>{oferta.salario}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* ── Vacancy Info ── */}
        {oferta.vacante && (
          <Card variant="default" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Vacante</Text>
            <Text style={styles.vacancyText}>
              {typeof oferta.vacante === 'string'
                ? oferta.vacante
                : oferta.vacante.nombre || JSON.stringify(oferta.vacante)}
            </Text>
          </Card>
        )}

        {/* ── Postulantes ── */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Postulantes ({postulantesFiltrados.length})
          </Text>
          {postulantesFiltrados.length > 0 ? (
            postulantesFiltrados.map((postulante, index) => {
              const pBadge = getPostulanteBadge(postulante.estado);
              const nombre =
                postulante.nombre ||
                postulante.name ||
                `${postulante.nombre || ''} ${postulante.apellido || ''}`.trim();

              return (
                <View key={postulante.id || index} style={styles.postulanteItem}>
                  <Avatar name={nombre} size="md" />
                  <View style={styles.postulanteInfo}>
                    <Text style={styles.postulanteName} numberOfLines={1}>
                      {nombre || 'Sin nombre'}
                    </Text>
                    {postulante.email && (
                      <Text style={styles.postulanteEmail} numberOfLines={1}>
                        {postulante.email}
                      </Text>
                    )}
                  </View>
                  <Badge variant={pBadge.variant} label={pBadge.label} size="sm" />
                </View>
              );
            })
          ) : (
            <Text style={styles.noDataText}>No hay postulantes aún</Text>
          )}
        </Card>

        {/* ── Actions ── */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Acciones</Text>

          {/* ACTIVA: Editar + Cerrar en una fila */}
          {oferta.estado === 'activa' && (
            <View style={styles.actionsRow}>
              <Button
                variant="primary"
                size="sm"
                title="Editar"
                onPress={() => navigation?.navigate('OfertaForm', {
                  ofertaId: oferta.id || oferta.idOferta,
                  ofertaData: {
                    titulo: oferta.titulo,
                    descripcion: oferta.descripcion,
                    modalidad: oferta.modalidad,
                    fechaInicio: oferta.fechaInicio,
                    fechaFinal: oferta.fechaFinal,
                    vacantes: oferta.vacantes,
                  },
                })}
                style={styles.actionFlex}
              />
              <Button
                variant="outline"
                size="sm"
                title="Cerrar"
                loading={actionLoading === 'cerrar'}
                disabled={actionLoading !== null}
                onPress={handleCerrar}
                style={[styles.actionFlex, styles.orangeButton]}
                textStyle={styles.orangeButtonText}
              />
            </View>
          )}

          {/* CERRADA: Editar + Reabrir + Terminar en una fila */}
          {oferta.estado === 'cerrada' && (
            <View style={styles.actionsRow}>
              <Button
                variant="primary"
                size="sm"
                title="Editar"
                onPress={() => navigation?.navigate('OfertaForm', {
                  ofertaId: oferta.id || oferta.idOferta,
                  ofertaData: {
                    titulo: oferta.titulo,
                    descripcion: oferta.descripcion,
                    modalidad: oferta.modalidad,
                    fechaInicio: oferta.fechaInicio,
                    fechaFinal: oferta.fechaFinal,
                    vacantes: oferta.vacantes,
                  },
                })}
                style={styles.actionFlex}
              />
              <Button
                variant="outline"
                size="sm"
                title="Reabrir"
                loading={actionLoading === 'reabrir'}
                disabled={actionLoading !== null}
                onPress={handleReabrir}
                style={[styles.actionFlex, styles.greenButton]}
                textStyle={styles.greenButtonText}
              />
              <Button
                variant="outline"
                size="sm"
                title="Terminar"
                loading={actionLoading === 'terminar' || actionLoading === 'verificar'}
                disabled={actionLoading !== null}
                onPress={handleTerminar}
                style={[styles.actionFlex, styles.blueButton]}
                textStyle={styles.blueButtonText}
              />
            </View>
          )}

          {/* BORRADOR / TERMINADA: Solo Editar */}
          {(oferta.estado === 'borrador' || oferta.estado === 'terminada') && (
            <View style={styles.actionsRow}>
              <Button
                variant="primary"
                size="sm"
                title="Editar"
                onPress={() => navigation?.navigate('OfertaForm', {
                  ofertaId: oferta.id || oferta.idOferta,
                  ofertaData: {
                    titulo: oferta.titulo,
                    descripcion: oferta.descripcion,
                    modalidad: oferta.modalidad,
                    fechaInicio: oferta.fechaInicio,
                    fechaFinal: oferta.fechaFinal,
                    vacantes: oferta.vacantes,
                  },
                })}
                style={styles.actionFlex}
              />
            </View>
          )}

          {/* ELIMINAR: disponible en todos los estados */}
          <View style={styles.deleteRow}>
            <Button
              variant="ghost"
              size="sm"
              title="Eliminar Oferta"
              loading={actionLoading === 'eliminar' || actionLoading === 'verificar'}
              disabled={actionLoading !== null}
              onPress={handleDelete}
              style={styles.deleteButton}
              textStyle={styles.deleteButtonText}
            />
          </View>
        </Card>
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
  sectionCard: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  description: {
    fontSize: typography.md,
    color: colors.textSecondary,
    lineHeight: typography.md * typography.normal,
    marginBottom: spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  infoItem: {
    minWidth: 100,
  },
  infoLabel: {
    fontSize: typography.xs,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  vacancyText: {
    fontSize: typography.sm,
    color: colors.text,
    lineHeight: typography.sm * typography.normal,
  },
  postulanteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  postulanteInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  postulanteName: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  postulanteEmail: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  noDataText: {
    fontSize: typography.sm,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionFlex: {
    flex: 1,
  },
  // Botón naranja - Cerrar
  orangeButton: {
    borderColor: colors.orange,
  },
  orangeButtonText: {
    color: colors.orange,
  },
  // Botón verde - Reabrir
  greenButton: {
    borderColor: colors.success,
  },
  greenButtonText: {
    color: colors.success,
  },
  // Botón azul - Terminar
  blueButton: {
    borderColor: colors.info,
  },
  blueButtonText: {
    color: colors.info,
  },
  // Botón eliminar
  deleteRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  deleteButtonText: {
    color: colors.error,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default OfertaDetailScreen;
