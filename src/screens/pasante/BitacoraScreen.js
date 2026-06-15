/**
 * BitacoraScreen - Formulario para registrar avance en una actividad
 *
 * Formulario con:
 * - Selector de actividad (si no se pasa como parámetro)
 * - Selector de fecha
 * - Slider de porcentaje (0-100%)
 * - Input de horas trabajadas
 * - Textarea de observaciones
 * - Validación de campos
 * - Botón de envío
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Button, Header, Card, Input, LoadingSpinner, EmptyState } from '../../components/ui';
import { getMisActividades } from '../../api/actividades';
import { createBitacora } from '../../api/bitacoras';
import { formatDate } from '../../utils/dateUtils';

const BitacoraScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { actividadId: initialActividadId } = route.params || {};

  // States
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [selectedActividadId, setSelectedActividadId] = useState(initialActividadId || null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [porcentaje, setPorcentaje] = useState(0);
  const [horasTrabajadas, setHorasTrabajadas] = useState('');
  const [observacion, setObservacion] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({});

  /**
   * Carga las actividades disponibles
   */
  const fetchActividades = useCallback(async () => {
    try {
      setError(null);
      const data = await getMisActividades();
      const list = Array.isArray(data) ? data : data.data || [];
      // Filtrar solo actividades no completadas
      const pending = list.filter(
        (a) => a.estado?.toLowerCase() !== 'completada' && a.estado?.toLowerCase() !== 'aprobada'
      );
      setActividades(pending);
    } catch (err) {
      console.error('Error al cargar actividades:', err);
      setError('No se pudieron cargar las actividades.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchActividades();
  }, [fetchActividades]);

  /**
   * Valida el formulario
   * @returns {boolean} true si es válido
   */
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!selectedActividadId) {
      newErrors.actividad = 'Selecciona una actividad.';
    }

    if (!fecha) {
      newErrors.fecha = 'La fecha es obligatoria.';
    }

    if (!horasTrabajadas || isNaN(Number(horasTrabajadas)) || Number(horasTrabajadas) <= 0) {
      newErrors.horas = 'Ingresa las horas trabajadas (número mayor a 0).';
    }

    if (porcentaje < 0 || porcentaje > 100) {
      newErrors.porcentaje = 'El porcentaje debe estar entre 0 y 100.';
    }

    if (!observacion.trim()) {
      newErrors.observacion = 'La observación es obligatoria.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedActividadId, fecha, horasTrabajadas, porcentaje, observacion]);

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        actividadId: selectedActividadId,
        fecha,
        porcentaje: Number(porcentaje),
        horasTrabajadas: Number(horasTrabajadas),
        observacion: observacion.trim(),
      };

      await createBitacora(payload);

      Alert.alert(
        '¡Registro exitoso!',
        'Tu avance ha sido registrado correctamente.',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error al crear bitácora:', err);
      const message =
        err.response?.data?.message || 'No se pudo registrar el avance. Intente nuevamente.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  }, [
    validateForm,
    selectedActividadId,
    fecha,
    porcentaje,
    horasTrabajadas,
    observacion,
    navigation,
  ]);

  /**
   * Renderiza el selector de actividad
   */
  const renderActividadSelector = () => (
    <Card variant="outlined" style={styles.selectorCard}>
      <Text style={styles.selectorLabel}>Actividad *</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selectorScroll}
      >
        {actividades.map((actividad) => (
          <TouchableOpacity
            key={actividad.id}
            style={[
              styles.selectorChip,
              selectedActividadId === String(actividad.id) && styles.selectorChipActive,
            ]}
            onPress={() => setSelectedActividadId(String(actividad.id))}
          >
            <Text
              style={[
                styles.selectorChipText,
                selectedActividadId === String(actividad.id) && styles.selectorChipTextActive,
              ]}
              numberOfLines={1}
            >
              {actividad.nombre || actividad.titulo}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {errors.actividad && (
        <Text style={styles.errorText}>{errors.actividad}</Text>
      )}
    </Card>
  );

  /**
   * Renderiza el selector de fecha (simplificado)
   */
  const renderFechaSelector = () => (
    <Card variant="outlined" style={styles.selectorCard}>
      <Text style={styles.selectorLabel}>Fecha *</Text>
      <View style={styles.fechaContainer}>
        {/* Selector simplificado - en producción se usaría un DatePicker */}
        <TouchableOpacity
          style={styles.fechaButton}
          onPress={() => {
            // Placeholder: en producción abriría un DatePicker
            Alert.alert(
              'Seleccionar fecha',
              'Funcionalidad de DatePicker pendiente de implementar.',
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.fechaText}>📅 {formatDate(fecha) || 'Seleccionar fecha'}</Text>
        </TouchableOpacity>
      </View>
      {errors.fecha && (
        <Text style={styles.errorText}>{errors.fecha}</Text>
      )}
    </Card>
  );

  /**
   * Renderiza el slider de porcentaje
   */
  const renderPorcentajeSlider = () => (
    <Card variant="outlined" style={styles.selectorCard}>
      <Text style={styles.selectorLabel}>Porcentaje de avance: {porcentaje}%</Text>
      <View style={styles.sliderContainer}>
        {/* Controles de incremento/decremento */}
        <TouchableOpacity
          style={styles.sliderButton}
          onPress={() => setPorcentaje(Math.max(0, porcentaje - 5))}
        >
          <Text style={styles.sliderButtonText}>-</Text>
        </TouchableOpacity>

        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              {
                width: `${porcentaje}%`,
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

        <TouchableOpacity
          style={styles.sliderButton}
          onPress={() => setPorcentaje(Math.min(100, porcentaje + 5))}
        >
          <Text style={styles.sliderButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Presets rápidos */}
      <View style={styles.presetsContainer}>
        {[25, 50, 75, 100].map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.presetChip,
              porcentaje === value && styles.presetChipActive,
            ]}
            onPress={() => setPorcentaje(value)}
          >
            <Text
              style={[
                styles.presetChipText,
                porcentaje === value && styles.presetChipTextActive,
              ]}
            >
              {value}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {errors.porcentaje && (
        <Text style={styles.errorText}>{errors.porcentaje}</Text>
      )}
    </Card>
  );

  /**
   * Renderiza el input de horas trabajadas
   */
  const renderHorasInput = () => (
    <Card variant="outlined" style={styles.selectorCard}>
      <Input
        label="Horas trabajadas *"
        placeholder="Ej: 8"
        value={horasTrabajadas}
        onChangeText={setHorasTrabajadas}
        keyboardType="numeric"
        error={errors.horas}
        leftIcon={<Text style={styles.inputIcon}>⏱️</Text>}
      />
    </Card>
  );

  /**
   * Renderiza el textarea de observaciones
   */
  const renderObservacionTextarea = () => (
    <Card variant="outlined" style={styles.selectorCard}>
      <Input
        label="Observaciones *"
        placeholder="Describe el avance realizado, dificultades encontradas, etc."
        value={observacion}
        onChangeText={setObservacion}
        numberOfLines={4}
        error={errors.observacion}
        leftIcon={<Text style={styles.inputIcon}>📝</Text>}
      />
    </Card>
  );

  // Estado de carga
  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Registrar Bitacora" />
        <LoadingSpinner fullScreen message="Cargando actividades..." />
      </View>
    );
  }

  // Estado de error
  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Registrar Bitacora" />
        <EmptyState
          icon={<Text style={styles.emptyIcon}>⚠️</Text>}
          title="Error al cargar"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={fetchActividades}
        />
      </View>
    );
  }

  // No hay actividades disponibles
  if (actividades.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Registrar bitacora" />
        <EmptyState
          icon={<Text style={styles.emptyIcon}>📋</Text>}
          title="Sin actividades disponibles"
          subtitle="No tienes actividades pendientes para registrar bitacora."
          actionLabel="Volver"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Registrar Bitacora" />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Selector de actividad (solo si no se pasó como parámetro) */}
        {!initialActividadId && renderActividadSelector()}

        {/* Selector de fecha */}
        {renderFechaSelector()}

        {/* Slider de porcentaje */}
        {renderPorcentajeSlider()}

        {/* Input de horas */}
        {renderHorasInput()}

        {/* Textarea de observaciones */}
        {renderObservacionTextarea()}

        {/* Botón de envío */}
        <View style={styles.submitContainer}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            title="Registrar Bitacora"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
          />
        </View>

        {/* Espaciado inferior */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  // Selector cards
  selectorCard: {
    marginBottom: spacing.md,
  },
  selectorLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  // Selector de actividades
  selectorScroll: {
    gap: spacing.sm,
  },
  selectorChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectorChipText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
    maxWidth: 150,
  },
  selectorChipTextActive: {
    color: colors.textOnPrimary,
  },
  // Fecha
  fechaContainer: {
    marginTop: spacing.xs,
  },
  fechaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  fechaText: {
    fontSize: typography.md,
    color: colors.text,
  },
  // Slider
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonText: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textOnPrimary,
  },
  sliderTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.grayLighter,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  // Presets
  presetsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grayBackground,
  },
  presetChipActive: {
    backgroundColor: colors.secondary,
  },
  presetChipText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  presetChipTextActive: {
    color: colors.textOnPrimary,
  },
  // Input icon
  inputIcon: {
    fontSize: typography.md,
  },
  // Error
  errorText: {
    fontSize: typography.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  // Submit
  submitContainer: {
    marginTop: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
  backIcon: {
    fontSize: typography.xl,
    color: colors.textOnPrimary,
  },
  emptyIcon: {
    fontSize: 48,
  },
});

export default BitacoraScreen;
