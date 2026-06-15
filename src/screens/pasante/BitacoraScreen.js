/**
 * BitacoraScreen - Formulario para registrar avance en una actividad
 *
 * Formulario con:
 * - Selector de actividad (si no se pasa como parámetro)
 * - Selector de fecha
 * - Slider de porcentaje — NUNCA puede bajar del último registrado
 * - Input de horas trabajadas
 * - Textarea de observaciones
 * - Validación de campos
 * - Botón de envío
 *
 * REGLA DE NEGOCIO: El porcentaje solo puede AVANZAR.
 * Si el último registro fue 78%, no podés poner 35%.
 * El slider arranca desde el último porcentaje registrado.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Button, Header, Card, Input, LoadingSpinner, EmptyState } from '../../components/ui';
import { getMisActividades } from '../../api/actividades';
import { getBitacoras, createBitacora } from '../../api/bitacoras';
import { formatDate } from '../../utils/dateUtils';
import { translateError } from '../../utils/translateError';

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

  // Último porcentaje registrado (piso mínimo, no se puede bajar)
  const [ultimoPorcentaje, setUltimoPorcentaje] = useState(0);
  const [cargandoUltimo, setCargandoUltimo] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  // ── Carga actividades ──────────────────────────────────

  const fetchActividades = useCallback(async () => {
    try {
      setError(null);
      const data = await getMisActividades();
      const list = Array.isArray(data) ? data : data.data || [];
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

  useEffect(() => {
    fetchActividades();
  }, [fetchActividades]);

  // ── Carga el último avance de la actividad seleccionada ──

  const fetchUltimoAvance = useCallback(async (actividadId) => {
    if (!actividadId) {
      setUltimoPorcentaje(0);
      setPorcentaje(0);
      return;
    }

    try {
      setCargandoUltimo(true);
      const data = await getBitacoras();
      const allBitacoras = Array.isArray(data)
        ? data
        : data?.data || data?.bitacoras || data?.bitacorasCollection || [];

      // Filtrar por actividad
      const deEstaActividad = allBitacoras.filter((b) => {
        const bid = b.actividadId ?? b.actividad_id ?? b.idActividad ?? b.id_actividad;
        return String(bid) === String(actividadId);
      });

      if (deEstaActividad.length > 0) {
        // Buscar el porcentaje más alto (más reciente o más avanzado)
        const sorted = [...deEstaActividad]
          .filter((b) => b.porcentaje !== undefined && b.porcentaje !== null)
          .sort((a, b) => {
            const dateA = new Date(a.fecha || a.created_at || 0);
            const dateB = new Date(b.fecha || b.created_at || 0);
            return dateB - dateA; // más reciente primero
          });

        const ultimo = Math.round(sorted[0]?.porcentaje ?? 0);
        setUltimoPorcentaje(ultimo);
        setPorcentaje(ultimo); // Precargar con el último valor (entero)
      } else {
        setUltimoPorcentaje(0);
        setPorcentaje(0);
      }
    } catch (err) {
      console.error('Error al cargar último avance:', err);
      // No bloqueamos — si falla, se permite cualquier porcentaje
      setUltimoPorcentaje(0);
    } finally {
      setCargandoUltimo(false);
    }
  }, []);

  // Cuando se selecciona una actividad, cargar su último avance
  useEffect(() => {
    if (selectedActividadId) {
      fetchUltimoAvance(selectedActividadId);
    }
  }, [selectedActividadId, fetchUltimoAvance]);

  // Si ya viene con actividad pre-seleccionada, cargar el último avance
  useEffect(() => {
    if (initialActividadId) {
      fetchUltimoAvance(initialActividadId);
    }
  }, [initialActividadId, fetchUltimoAvance]);

  // ── Maneja cambio de actividad ─────────────────────────

  const handleActividadChange = useCallback((id) => {
    setSelectedActividadId(String(id));
    setErrors((prev) => ({ ...prev, actividad: undefined }));
  }, []);

  // ── Validación ─────────────────────────────────────────

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!selectedActividadId) {
      newErrors.actividad = 'Seleccioná una actividad.';
    }

    if (!fecha) {
      newErrors.fecha = 'La fecha es obligatoria.';
    }

    if (!horasTrabajadas || isNaN(Number(horasTrabajadas)) || Number(horasTrabajadas) <= 0) {
      newErrors.horas = 'Ingresá las horas trabajadas (número mayor a 0).';
    }

    if (porcentaje < 0 || porcentaje > 100) {
      newErrors.porcentaje = 'El porcentaje debe estar entre 0 y 100.';
    }

    // REGLA DE NEGOCIO: no se puede retroceder
    if (ultimoPorcentaje > 0 && porcentaje < ultimoPorcentaje) {
      newErrors.porcentaje =
        `No puedes retroceder el avance. El último registro fue ${ultimoPorcentaje}%. ` +
        `El nuevo porcentaje debe ser ≥ ${ultimoPorcentaje}%.`;
    }

    if (!observacion.trim()) {
      newErrors.observacion = 'La observación es obligatoria.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedActividadId, fecha, horasTrabajadas, porcentaje, ultimoPorcentaje, observacion]);

  // ── Envío ──────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario.');
      return;
    }

    try {
      setSubmitting(true);

      // Enviar ambos formatos: el monolito puede esperar camelCase o snake_case
      const payload = {
        idActividad: Number(selectedActividadId),
        actividadId: selectedActividadId,
        actividad_id: selectedActividadId,
        fecha,
        porcentaje: Number(porcentaje),
        horasTrabajadas: Number(horasTrabajadas),
        horas_trabajadas: Number(horasTrabajadas),
        observacion: observacion.trim(),
      };

      console.log('[Bitacora] Enviando:', JSON.stringify(payload));
      await createBitacora(payload);
      console.log('[Bitacora] ÉXITO');

      Alert.alert(
        '¡Registro exitoso!',
        `Tu avance del ${porcentaje}% ha sido registrado correctamente.`,
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('[Bitacora] ERROR:', err);
      if (err.response) {
        console.log('[Bitacora] STATUS:', err.response.status);
        console.log('[Bitacora] DATA:', JSON.stringify(err.response.data));
      }

      // Extraer mensaje de validación y traducir
      let message = 'No se pudo registrar el avance. Intentá nuevamente.';
      const data = err.response?.data;
      if (data) {
        try {
          if (typeof data === 'object' && data.errors) {
            const allErrors = Object.entries(data.errors)
              .map(([field, msgs]) => {
                const msgList = Array.isArray(msgs) ? msgs.join(', ') : msgs;
                return `• ${translateError(msgList)}`;
              })
              .join('\n');
            if (allErrors) message = allErrors;
          } else if (data.message) {
            message = translateError(data.message);
          } else if (typeof data === 'string') {
            message = translateError(data);
          }
        } catch { message = translateError(String(data)); }
      }

      Alert.alert('Error al registrar', message);
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, selectedActividadId, fecha, porcentaje, horasTrabajadas, observacion, navigation]);

  // ── Slider helper ──────────────────────────────────────

  const aumentar = useCallback(() => {
    setPorcentaje((prev) => Math.min(100, prev + 5));
    setErrors((prev) => ({ ...prev, porcentaje: undefined }));
  }, []);

  const disminuir = useCallback(() => {
    setPorcentaje((prev) => {
      const nuevo = Math.max(ultimoPorcentaje, prev - 5);
      return nuevo;
    });
    setErrors((prev) => ({ ...prev, porcentaje: undefined }));
  }, [ultimoPorcentaje]);

  const setPreset = useCallback((value) => {
    if (value < ultimoPorcentaje) {
      Alert.alert(
        'No puedes retroceder',
        `El último avance registrado es ${ultimoPorcentaje}%. No puedes bajarlo a ${value}%.`
      );
      return;
    }
    setPorcentaje(value);
    setErrors((prev) => ({ ...prev, porcentaje: undefined }));
  }, [ultimoPorcentaje]);

  // ── Renderers ──────────────────────────────────────────

  const renderActividadSelector = () => (
    <Card variant="outlined" style={styles.selectorCard}>
      <Text style={styles.selectorLabel}>Actividad *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
        {actividades.map((actividad) => (
          <TouchableOpacity
            key={actividad.id}
            style={[styles.selectorChip, selectedActividadId === String(actividad.id) && styles.selectorChipActive]}
            onPress={() => handleActividadChange(actividad.id)}
          >
            <Text
              style={[styles.selectorChipText, selectedActividadId === String(actividad.id) && styles.selectorChipTextActive]}
              numberOfLines={1}
            >
              {actividad.nombre || actividad.titulo}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {errors.actividad && <Text style={styles.errorText}>{errors.actividad}</Text>}
    </Card>
  );

  const renderFechaSelector = () => (
    <Card variant="outlined" style={styles.selectorCard}>
      <Text style={styles.selectorLabel}>Fecha *</Text>
      <View style={styles.fechaContainer}>
        <TouchableOpacity
          style={styles.fechaButton}
          onPress={() => {
            Alert.alert('Seleccionar fecha', 'Funcionalidad de DatePicker pendiente de implementar.', [{ text: 'OK' }]);
          }}
        >
          <Text style={styles.fechaText}><Ionicons name="calendar-outline" size={16} color={colors.text} /> {formatDate(fecha) || 'Seleccionar fecha'}</Text>
        </TouchableOpacity>
      </View>
      {errors.fecha && <Text style={styles.errorText}>{errors.fecha}</Text>}
    </Card>
  );

  const renderPorcentajeSlider = () => (
    <Card variant="outlined" style={styles.selectorCard}>
      <Text style={styles.selectorLabel}>
        Porcentaje de avance: {porcentaje}%
      </Text>

      {/* Info del último avance registrado */}
      {ultimoPorcentaje > 0 && (
        <View style={styles.ultimoBanner}>
          <Text style={styles.ultimoBannerText}>
            <Ionicons name="pin-outline" size={14} color={colors.warning} /> Último avance registrado: {ultimoPorcentaje}% — no puedes bajarlo
          </Text>
        </View>
      )}

      <View style={styles.sliderContainer}>
        <TouchableOpacity style={styles.sliderButton} onPress={disminuir}>
          <Text style={styles.sliderButtonText}>−</Text>
        </TouchableOpacity>

        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              { width: `${porcentaje}%` },
            ]}
          />
          {/* Marca del mínimo */}
          {ultimoPorcentaje > 0 && (
            <View
              style={[
                styles.minMarker,
                { left: `${ultimoPorcentaje}%` },
              ]}
            />
          )}
        </View>

        <TouchableOpacity style={styles.sliderButton} onPress={aumentar}>
          <Text style={styles.sliderButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Presets: solo los que son >= ultimoPorcentaje */}
      <View style={styles.presetsContainer}>
        {[25, 50, 75, 100]
          .filter((v) => v >= ultimoPorcentaje)
          .map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.presetChip, porcentaje === value && styles.presetChipActive]}
              onPress={() => setPreset(value)}
            >
              <Text style={[styles.presetChipText, porcentaje === value && styles.presetChipTextActive]}>
                {value}%
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      {errors.porcentaje && <Text style={styles.errorText}>{errors.porcentaje}</Text>}
    </Card>
  );

  const renderHorasInput = () => (
    <Card variant="outlined" style={styles.selectorCard}>
      <Input
        label="Horas trabajadas *"
        placeholder="Ej: 8"
        value={horasTrabajadas}
        onChangeText={setHorasTrabajadas}
        keyboardType="numeric"
        error={errors.horas}
        leftIcon={<Ionicons name="time-outline" size={18} color={colors.grayMedium} />}
      />
    </Card>
  );

  const renderObservacionTextarea = () => (
    <Card variant="outlined" style={styles.selectorCard}>
      <Input
        label="Observaciones *"
        placeholder="Describe el avance realizado, dificultades encontradas, etc."
        value={observacion}
        onChangeText={setObservacion}
        numberOfLines={4}
        error={errors.observacion}
        leftIcon={<Ionicons name="create-outline" size={18} color={colors.grayMedium} />}
      />
    </Card>
  );

  // ── Estados ────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Registrar Bitácora" />
        <LoadingSpinner fullScreen message="Cargando actividades..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Registrar Bitácora" />
        <EmptyState
          icon={<Ionicons name="alert-circle" size={48} color={colors.error} />}
          title="Error al cargar"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={fetchActividades}
        />
      </View>
    );
  }

  if (actividades.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Registrar Bitácora" />
        <EmptyState
          icon={<Ionicons name="clipboard-outline" size={48} color={colors.grayMedium} />}
          title="Sin actividades disponibles"
          subtitle="No tenés actividades pendientes para registrar bitácora."
          actionLabel="Volver"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Header title="Registrar Bitácora" />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!initialActividadId && renderActividadSelector()}

        {renderFechaSelector()}

        {cargandoUltimo ? (
          <Card variant="outlined" style={styles.selectorCard}>
            <Text style={styles.cargandoText}>Cargando último avance...</Text>
          </Card>
        ) : (
          renderPorcentajeSlider()
        )}

        {renderHorasInput()}
        {renderObservacionTextarea()}

        <View style={styles.submitContainer}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            title={ultimoPorcentaje > 0 ? `Registrar avance` : 'Registrar avance'}
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────

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
  selectorCard: {
    marginBottom: spacing.md,
  },
  selectorLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  cargandoText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  // Último avance
  ultimoBanner: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  ultimoBannerText: {
    fontSize: typography.sm,
    color: colors.warningDark || colors.text,
    fontWeight: typography.semibold,
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
    overflow: 'visible',
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
  },
  minMarker: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 18,
    backgroundColor: colors.warning,
    borderRadius: 2,
    marginLeft: -2,
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
    fontSize: typography.sm,
    color: colors.error,
    marginTop: spacing.sm,
    fontWeight: typography.medium,
  },
  // Submit
  submitContainer: {
    marginTop: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
  },
});

export default BitacoraScreen;
