/**
 * ActividadDetailScreen - Detalle de una actividad asignada
 *
 * Muestra información completa de una actividad:
 * - Título, descripción, fechas
 * - Progreso actual (porcentaje)
 * - Lista de bitácoras (entries)
 * - Botones "Registrar Avance" y "Subir Evidencia"
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Linking,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Button, Header, Badge, Card, EmptyState, LoadingSpinner } from '../../components/ui';
import { getMisActividades } from '../../api/actividades';
import { getBitacoras } from '../../api/bitacoras';
import { getEvidencias } from '../../api/evidencias';
import { formatDate } from '../../utils/dateUtils';
import API_CONFIG from '../../config/api';

/**
 * Construye la URL pública de storage a partir de la ruta relativa del archivo.
 * 
 * Por qué no usamos archivo_url del backend?
 * El backend devuelve la URL con el dominio interno (.test) que NO resuelve
 * desde el celular. Construimos la URL usando la misma IP que usa la API.
 */
const getStorageUrl = (archivoRelativo) => {
  if (!archivoRelativo) return null;
  const base = API_CONFIG.BASE_URL.replace(/\/api$/, '');
  return `${base}/storage/${archivoRelativo}`;
};

const ActividadDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { actividadId, fromCalendar } = route.params || {};

  // States
  const [actividad, setActividad] = useState(null);
  const [bitacoras, setBitacoras] = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerImage, setViewerImage] = useState(null); // null = cerrado, { url } = abierto

  /**
   * Carga el detalle de la actividad y sus bitácoras
   */
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Cargar actividades para encontrar la específica
      const actividadesData = await getMisActividades();
      const actividades = Array.isArray(actividadesData)
        ? actividadesData
        : actividadesData.data || [];

      // Buscar la actividad por múltiples posibles IDs
      // (el calendario pasa evento.actividadId/actividad_id, actividades usa id)
      const found = actividades.find(
        (a) =>
          String(a.id) === String(actividadId) ||
          String(a.actividadId) === String(actividadId) ||
          String(a.actividad_id) === String(actividadId)
      );
      setActividad(found || null);

      // ── Cargar bitácoras ───────────────────────────────
      const bitacorasData = await getBitacoras();

      // El backend puede devolver: array directo, { data: [...] }, { bitacoras: [...] }, etc.
      const allBitacoras = Array.isArray(bitacorasData)
        ? bitacorasData
        : bitacorasData?.data || bitacorasData?.bitacoras || bitacorasData?.bitacorasCollection || [];

      // Usar el ID real de la actividad encontrada para filtrar
      const targetId = found?.id || actividadId;

      // Filtrar bitácoras de esta actividad — probar múltiples nombres de campo
      const filtered = allBitacoras.filter((b) => {
        const bid =
          b.actividadId ?? b.actividad_id ?? b.idActividad ?? b.id_actividad ?? b.actividadId;
        return String(bid) === String(targetId);
      });
      setBitacoras(filtered);

      // ── Cargar evidencias ───────────────────────────────
      try {
        const evData = await getEvidencias(targetId);
        const allEvidencias = Array.isArray(evData)
          ? evData
          : evData?.data || evData?.evidencias || [];
        setEvidencias(allEvidencias);
      } catch (evErr) {
        console.error('Error al cargar evidencias:', evErr);
        // No bloqueamos — si falla, simplemente no mostramos evidencias
        setEvidencias([]);
      }
    } catch (err) {
      console.error('Error al cargar detalle de actividad:', err);
      setError('No se pudo cargar el detalle de la actividad.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [actividadId]);

  // Carga inicial y al volver de otras pantallas (ej: subir evidencia, registrar bitácora)
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  /**
   * Pull-to-refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  /**
   * Navega a registrar avance
   */
  const handleRegistrarAvance = useCallback(() => {
    navigation.navigate('Bitacora', { actividadId });
  }, [navigation, actividadId]);

  /**
   * Navega a subir evidencia
   */
  const handleSubirEvidencia = useCallback(() => {
    navigation.navigate('Evidencia', { actividadId });
  }, [navigation, actividadId]);

  /**
   * Obtiene el color del badge según el estado y la fecha límite.
   *
   * REGLA: Si la actividad ya pasó su fechaFin, se pinta ROJO (atraso)
   * sin importar el estado. Si no, colores normales:
   * - en_progreso → naranja
   * - completada/aprobada → verde
   * - pendiente → amarillo
   * - rechazada → rojo
   */
  const getStatusBadgeVariant = useCallback((estado, fechaFin) => {
    // ¿Ya venció?
    if (fechaFin) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const limite = new Date(fechaFin);
      limite.setHours(0, 0, 0, 0);
      if (limite < hoy) {
        return 'error'; // rojo — atrasada
      }
    }

    switch (estado?.toLowerCase()) {
      case 'completada':
      case 'aprobada':
        return 'success';
      case 'en_progreso':
      case 'en progreso':
        return 'orange';
      case 'pendiente':
        return 'warning';
      case 'rechazada':
        return 'error';
      default:
        return 'neutral';
    }
  }, []);

  /**
   * Renderiza la barra de progreso
   */
  const ProgressBar = useCallback(
    ({ porcentaje = 0 }) => (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(Math.max(porcentaje, 0), 100)}%`,
                backgroundColor:
                  porcentaje >= 100
                    ? colors.success
                    : porcentaje >= 50
                    ? colors.secondary
                    : colors.warning,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(porcentaje)}%</Text>
      </View>
    ),
    []
  );

  /**
   * Porcentaje de avance — se calcula desde la bitácora más reciente.
   * Si no hay bitácoras, usa el valor de la actividad como fallback.
   */
  const porcentajeAvance = useMemo(() => {
    if (bitacoras.length === 0) {
      return actividad?.porcentaje ?? actividad?.progreso ?? 0;
    }

    // Ordenar por fecha descendente y tomar la más reciente con porcentaje
    const sorted = [...bitacoras]
      .filter((b) => b.porcentaje !== undefined && b.porcentaje !== null)
      .sort((a, b) => {
        const dateA = new Date(a.fecha || a.created_at || 0);
        const dateB = new Date(b.fecha || b.created_at || 0);
        return dateB - dateA;
      });

    return sorted[0]?.porcentaje ?? actividad?.porcentaje ?? actividad?.progreso ?? 0;
  }, [bitacoras, actividad]);

  /**
   * Renderiza una bitácora en la lista
   */
  const renderBitacoraItem = useCallback(
    ({ item: bitacora, index }) => (
      <Card variant="outlined" style={styles.bitacoraCard}>
        <View style={styles.bitacoraHeader}>
          <Text style={styles.bitacoraIndex}>#{index + 1}</Text>
          <Text style={styles.bitacoraFecha}>
            {formatDate(bitacora.fecha || bitacora.created_at) || 'Sin fecha'}
          </Text>
        </View>

        {bitacora.horasTrabajadas && (
          <Text style={styles.bitacoraHoras}>
            <Ionicons name="time-outline" size={14} color={colors.text} style={{marginRight: 4}} /> {bitacora.horasTrabajadas} horas
          </Text>
        )}

        {bitacora.porcentaje !== undefined && (
          <ProgressBar porcentaje={bitacora.porcentaje} />
        )}

        {bitacora.observacion && (
          <Text style={styles.bitacoraObservacion} numberOfLines={3}>
            {bitacora.observacion}
          </Text>
        )}
      </Card>
    ),
    [ProgressBar]
  );

  // Estado de carga
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Detalle de Actividad" />
        <LoadingSpinner fullScreen message="Cargando actividad..." />
      </View>
    );
  }

  // Estado de error
  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Detalle de Actividad" />
        <EmptyState
          icon={<Ionicons name="alert-circle" size={48} color={colors.error} />}
          title="Error al cargar"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={fetchData}
        />
      </View>
    );
  }

  // Actividad no encontrada
  if (!actividad) {
    return (
      <View style={styles.container}>
        <Header title="Detalle de Actividad" />
        <EmptyState
          icon={<Ionicons name="search-outline" size={48} color={colors.grayMedium} />}
          title="Actividad no encontrada"
          subtitle="La actividad que buscas no existe o fue removida."
          actionLabel="Volver"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Detalle de Actividad" />
      <FlatList
        data={fromCalendar ? [] : bitacoras}
        keyExtractor={(item, index) => String(item.id || item.bitacoraId || item.bitacora_id || index)}
        renderItem={renderBitacoraItem}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Información de la actividad */}
            <Card variant="default" style={styles.section}>
              <Text style={styles.actividadNombre}>
                {actividad.nombre || actividad.titulo || 'Sin nombre'}
              </Text>

              <View style={styles.badgesRow}>
                <Badge
                  variant={getStatusBadgeVariant(actividad.estado, actividad.fechaFin)}
                  size="sm"
                  label={actividad.estado?.replace('_', ' ') || 'Pendiente'}
                />
                {actividad.modalidad && (
                  <Badge variant="info" size="sm" label={actividad.modalidad} />
                )}
              </View>
            </Card>

            {/* Descripción */}
            {actividad.descripcion && (
              <Card variant="outlined" style={styles.section}>
                <Text style={styles.sectionTitle}>Descripción</Text>
                <Text style={styles.sectionContent}>{actividad.descripcion}</Text>
              </Card>
            )}

            {/* Fechas */}
            {(actividad.fechaInicio || actividad.fechaFin) && (
              <Card variant="outlined" style={styles.section}>
                <Text style={styles.sectionTitle}>Período</Text>
                <View style={styles.datesContainer}>
                  {actividad.fechaInicio && (
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>Inicio</Text>
                      <Text style={styles.dateValue}>{formatDate(actividad.fechaInicio)}</Text>
                    </View>
                  )}
                  {actividad.fechaFin && (
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>Fin</Text>
                      <Text style={styles.dateValue}>{formatDate(actividad.fechaFin)}</Text>
                    </View>
                  )}
                </View>
              </Card>
            )}

            {/* Progreso actual */}
            <Card variant="outlined" style={styles.section}>
              <Text style={styles.sectionTitle}>Progreso actual</Text>
              <ProgressBar
                porcentaje={porcentajeAvance}
              />
              <Text style={styles.progresoDetalle}>
                Has completado el{' '}
                {Math.round(porcentajeAvance)}% de esta actividad
              </Text>
            </Card>

            {/* Botones de acción — solo si NO viene del calendario */}
            {!fromCalendar && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={handleRegistrarAvance}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.orange, colors.amber]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtn}
                >
                  <Ionicons name="create-outline" size={16} color={colors.white} />
                  <Text style={styles.actionBtnText}>Bitácora</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubirEvidencia}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.secondary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtn}
                >
                  <Ionicons name="attach-outline" size={16} color={colors.white} />
                  <Text style={styles.actionBtnText}>Evidencia</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            )}

            {/* Evidencias subidas */}
            {!fromCalendar && evidencias.length > 0 && (
              <View style={styles.evidenciasSection}>
                <Text style={styles.bitacorasTitle}>
                  Ver evidencias ({evidencias.length})
                </Text>
                {evidencias.map((ev, idx) => {
                  const esFoto = ev.tipo === 'foto';
                  const tipoEtiqueta = esFoto ? 'Foto' : 'Documento';
                  const evidenciaIconName = esFoto ? 'image-outline' : 'document-outline';

                  return (
                    <TouchableOpacity
                      key={ev.idEvidencia || ev.id || `ev-${idx}`}
                      activeOpacity={0.7}
                      onPress={() => {
                        const imageUrl = getStorageUrl(ev.archivo);
                        if (!imageUrl) return;
                        if (esFoto) {
                          // Abrir imagen dentro de la app con Modal
                          setViewerImage({ url: imageUrl });
                        } else {
                          // Documento: abrir en navegador (RN no renderiza PDF nativamente)
                          Linking.openURL(imageUrl).catch(() =>
                            Alert.alert('Error', 'No se pudo abrir el documento.')
                          );
                        }
                      }}
                    >
                      <Card variant="outlined" style={styles.evidenciaCard}>
                        <View style={styles.evidenciaRow}>
                          <Ionicons name={evidenciaIconName} size={24} color={colors.text} style={styles.evidenciaIcon} />
                          <View style={styles.evidenciaInfo}>
                            <Text style={styles.evidenciaName} numberOfLines={1}>
                              {tipoEtiqueta}
                            </Text>
                            {ev.descripcion ? (
                              <Text style={styles.evidenciaDesc} numberOfLines={2}>
                                {ev.descripcion}
                              </Text>
                            ) : null}
                            {ev.created_at ? (
                              <Text style={styles.evidenciaDate}>
                                {formatDate(ev.created_at)}
                              </Text>
                            ) : null}
                          </View>
                          <Text style={styles.evidenciaArrow}>›</Text>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Lista de bitácoras — solo si NO viene del calendario */}
            {!fromCalendar && (
            <View style={styles.bitacorasHeader}>
              <Text style={styles.bitacorasTitle}>
                Bitácoras ({bitacoras.length})
              </Text>
            </View>
            )}
          </View>
        }
        ListEmptyComponent={
          fromCalendar ? null : (
          <EmptyState
            icon={<Ionicons name="book-outline" size={48} color={colors.grayMedium} />}
            title="Sin bitácoras registradas"
            subtitle="Aún no has registrado avances en esta actividad."
            actionLabel="Registrar primer avance"
            onAction={handleRegistrarAvance}
          />
          )
        }
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

      {/* ── Visor de imagen full-screen (solo fotos) ── */}
      <Modal
        visible={!!viewerImage}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <View style={styles.viewerContainer}>
          <TouchableOpacity
            style={styles.viewerCloseButton}
            onPress={() => setViewerImage(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close-outline" size={20} color={colors.white} />
          </TouchableOpacity>
          {viewerImage?.url && (
            <Image
              source={{ uri: viewerImage.url }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          )}
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
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  listHeader: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  // Actividad
  actividadNombre: {
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
  // Progreso
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: colors.grayLighter,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.primary,
    minWidth: 42,
    textAlign: 'right',
  },
  progresoDetalle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  // Botones de acción
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    minWidth: 130,
  },
  actionBtnText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  // Bitácoras
  bitacorasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bitacorasTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.primary,
  },
  bitacoraCard: {
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  bitacoraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bitacoraIndex: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.secondary,
  },
  bitacoraFecha: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  bitacoraHoras: {
    fontSize: typography.sm,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bitacoraObservacion: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    lineHeight: typography.sm * typography.normal,
  },
  // Evidencias
  evidenciasSection: {
    marginBottom: spacing.xl,
  },
  evidenciaCard: {
    marginBottom: spacing.sm,
  },
  evidenciaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  evidenciaIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    marginTop: 2,
  },
  evidenciaInfo: {
    flex: 1,
  },
  evidenciaName: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  evidenciaDesc: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  evidenciaDate: {
    fontSize: typography.xs,
    color: colors.grayMedium,
  },
  evidenciaArrow: {
    fontSize: 22,
    color: colors.grayMedium,
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  backIcon: {
    fontSize: typography.xl,
    color: colors.textOnPrimary,
  },
  emptyIcon: {
    fontSize: 48,
  },
  // Visor de imagen full-screen
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
});

export default ActividadDetailScreen;
