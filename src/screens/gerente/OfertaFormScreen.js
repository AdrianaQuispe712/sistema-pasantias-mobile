/**
 * OfertaFormScreen - Formulario crear/editar oferta (rol Gerente)
 *
 * Formulario reutilizable para crear y editar ofertas de pasantía.
 * Valida campos del lado del cliente antes de enviar al backend.
 *
 * Backend validation (OfertasController::store/update):
 *   titulo: required|string|max:255
 *   descripcion: required|string
 *   modalidad: required|string|in:Presencial,Remoto,Híbrido
 *   fechaInicio: required|date (YYYY-MM-DD)
 *   fechaFinal: required|date|after:fechaInicio
 *   vacantes: required|integer|min:1
 *
 * @module screens/gerente/OfertaFormScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import { Input, Button, LoadingSpinner } from '../../components/ui';
import {
  getOferta,
  createOferta,
  updateOferta,
} from '../../api/gerenteOfertas';

// ─── Modalidad options (must match backend: Presencial,Remoto,Híbrido) ───
const MODALIDADES = ['Presencial', 'Remoto', 'Híbrido'];

// Normalize modalidad case: capitalize first letter to match picker options
const normalizeModalidad = (value) => {
  if (!value) return '';
  const match = MODALIDADES.find(
    (m) => m.toLowerCase() === value.toLowerCase()
  );
  return match || value;
};

/**
 * Date input with simple YYYY-MM-DD validation
 */
const DateInput = ({ label, value, onChangeText, placeholder, error }) => (
  <Input
    label={label}
    placeholder={placeholder || 'YYYY-MM-DD'}
    value={value}
    onChangeText={onChangeText}
    error={error}
    keyboardType="default"
    accessibilityLabel={label}
  />
);

const OfertaFormScreen = ({ route, navigation }) => {
  const { ofertaId, ofertaData } = route?.params || {};
  const isEdit = !!ofertaId;

  // ─── Form state ─────────────────────────────────────────
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [modalidad, setModalidad] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [vacantes, setVacantes] = useState('');

  // ─── UI state ───────────────────────────────────────────
  const [loading, setLoading] = useState(isEdit && !!ofertaData);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showModalidadPicker, setShowModalidadPicker] = useState(false);

  // ─── Load oferta data for edit mode ─────────────────────
  const loadOferta = useCallback(async () => {
    if (!isEdit) return;

    // If we have pre-filled data, use it
    if (ofertaData) {
      setTitulo(ofertaData.titulo || '');
      setDescripcion(ofertaData.descripcion || '');
      setModalidad(normalizeModalidad(ofertaData.modalidad) || '');
      setFechaInicio(ofertaData.fechaInicio || '');
      setFechaFinal(ofertaData.fechaFinal || '');
      setVacantes(ofertaData.vacantes?.toString() || '');
      setLoading(false);
      return;
    }

    // Otherwise fetch from API
    try {
      setLoading(true);
      const response = await getOferta(ofertaId);
      const data = response?.data || response;
      setTitulo(data.titulo || '');
      setDescripcion(data.descripcion || '');
      setModalidad(normalizeModalidad(data.modalidad) || '');
      setFechaInicio(data.fechaInicio || '');
      setFechaFinal(data.fechaFinal || '');
      setVacantes(data.vacantes?.toString() || '');
    } catch (err) {
      console.error('Error loading oferta:', err);
      Alert.alert('Error', 'No se pudo cargar la oferta');
      navigation?.goBack();
    } finally {
      setLoading(false);
    }
  }, [isEdit, ofertaId, ofertaData]);

  useEffect(() => {
    loadOferta();
  }, [loadOferta]);

  // ─── Client-side validation ─────────────────────────────
  const validate = () => {
    const newErrors = {};

    // titulo: required|string|max:255
    if (!titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio';
    } else if (titulo.trim().length > 255) {
      newErrors.titulo = 'El título no puede exceder 255 caracteres';
    }

    // descripcion: required
    if (!descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }

    // modalidad: required|in:Presencial,Remoto,Híbrido
    if (!modalidad) {
      newErrors.modalidad = 'Seleccione una modalidad';
    } else if (!MODALIDADES.some((m) => m.toLowerCase() === modalidad.toLowerCase())) {
      newErrors.modalidad = 'Modalidad inválida';
    }

    // fechaInicio: required|date (YYYY-MM-DD format)
    if (!fechaInicio.trim()) {
      newErrors.fechaInicio = 'La fecha de inicio es obligatoria';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio.trim())) {
      newErrors.fechaInicio = 'Formato: YYYY-MM-DD (ej: 2025-01-15)';
    }

    // fechaFinal: required|date|after:fechaInicio
    if (!fechaFinal.trim()) {
      newErrors.fechaFinal = 'La fecha de fin es obligatoria';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaFinal.trim())) {
      newErrors.fechaFinal = 'Formato: YYYY-MM-DD (ej: 2025-06-30)';
    } else if (fechaInicio.trim() && fechaFinal.trim() <= fechaInicio.trim()) {
      newErrors.fechaFinal = 'Debe ser posterior a la fecha de inicio';
    }

    // vacantes: required|integer|min:1
    if (!vacantes.trim()) {
      newErrors.vacantes = 'Las vacantes son obligatorias';
    } else if (!/^\d+$/.test(vacantes.trim())) {
      newErrors.vacantes = 'Debe ser un número entero';
    } else if (parseInt(vacantes.trim(), 10) < 1) {
      newErrors.vacantes = 'Mínimo 1 vacante';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit handler ─────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      modalidad,
      fechaInicio: fechaInicio.trim(),
      fechaFinal: fechaFinal.trim(),
      vacantes: parseInt(vacantes.trim(), 10),
    };

    try {
      setSubmitting(true);

      if (isEdit) {
        await updateOferta(ofertaId, payload);
        Alert.alert('Éxito', 'Oferta actualizada correctamente', [
          { text: 'OK', onPress: () => navigation?.goBack() },
        ]);
      } else {
        await createOferta(payload);
        Alert.alert('Éxito', 'Oferta creada correctamente', [
          { text: 'OK', onPress: () => navigation?.goBack() },
        ]);
      }
    } catch (err) {
      console.error('Error saving oferta:', err);
      // Log full validation errors from backend
      if (err?.response?.data) {
        console.log('Backend response data:', JSON.stringify(err.response.data, null, 2));
      }
      console.log('Payload sent:', JSON.stringify(payload, null, 2));
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo guardar la oferta';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Modalidad picker modal ─────────────────────────────
  const renderModalidadPicker = () => (
    <Modal
      visible={showModalidadPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowModalidadPicker(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowModalidadPicker(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Modalidad</Text>
          {MODALIDADES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.modalOption,
                modalidad === item && styles.modalOptionSelected,
              ]}
              onPress={() => {
                setModalidad(item);
                setShowModalidadPicker(false);
                if (errors.modalidad) setErrors((prev) => ({ ...prev, modalidad: null }));
              }}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  modalidad === item && styles.modalOptionTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
          <Button
            variant="ghost"
            title="Cancelar"
            onPress={() => setShowModalidadPicker(false)}
            style={styles.modalCancelButton}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ─── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.screen}>
        <LoadingSpinner fullScreen message="Cargando..." />
      </View>
    );
  }

  // ─── Main render ────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {/* ── Form Card ── */}
        {/* Using View instead of Card to avoid overflow:'hidden' which breaks TextInput focus on Android */}
        <View style={styles.formCard}>
          {/* Título */}
          <Input
            label="Título *"
            placeholder="Ej: Pasantía en Desarrollo Web"
            value={titulo}
            onChangeText={(text) => {
              setTitulo(text);
              if (errors.titulo) setErrors((prev) => ({ ...prev, titulo: null }));
            }}
            error={errors.titulo}
            maxLength={255}
          />

          {/* Descripción */}
          <Input
            label="Descripción *"
            placeholder="Describa las actividades y requisitos..."
            value={descripcion}
            onChangeText={(text) => {
              setDescripcion(text);
              if (errors.descripcion) setErrors((prev) => ({ ...prev, descripcion: null }));
            }}
            error={errors.descripcion}
            numberOfLines={4}
          />

          {/* Modalidad */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.label, errors.modalidad && styles.labelError]}>
              Modalidad *
            </Text>
            <TouchableOpacity
              style={[styles.pickerButton, errors.modalidad && styles.pickerButtonError]}
              onPress={() => setShowModalidadPicker(true)}
            >
              <Text
                style={[
                  styles.pickerText,
                  !modalidad && styles.pickerPlaceholder,
                ]}
              >
                {modalidad || 'Seleccionar modalidad'}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
            {errors.modalidad ? (
              <Text style={styles.errorText}>{errors.modalidad}</Text>
            ) : null}
          </View>

          {/* Fecha Inicio */}
          <DateInput
            label="Fecha de Inicio *"
            placeholder="YYYY-MM-DD (ej: 2025-01-15)"
            value={fechaInicio}
            onChangeText={(text) => {
              setFechaInicio(text);
              if (errors.fechaInicio) setErrors((prev) => ({ ...prev, fechaInicio: null }));
            }}
            error={errors.fechaInicio}
          />

          {/* Fecha Fin */}
          <DateInput
            label="Fecha de Fin *"
            placeholder="YYYY-MM-DD (ej: 2025-06-30)"
            value={fechaFinal}
            onChangeText={(text) => {
              setFechaFinal(text);
              if (errors.fechaFinal) setErrors((prev) => ({ ...prev, fechaFinal: null }));
            }}
            error={errors.fechaFinal}
          />

          {/* Vacantes */}
          <Input
            label="Número de Vacantes *"
            placeholder="Ej: 3"
            value={vacantes}
            onChangeText={(text) => {
              setVacantes(text.replace(/[^0-9]/g, ''));
              if (errors.vacantes) setErrors((prev) => ({ ...prev, vacantes: null }));
            }}
            error={errors.vacantes}
            keyboardType="numeric"
          />
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            title={isEdit ? 'Guardar Cambios' : 'Crear Oferta'}
            loading={submitting}
            disabled={submitting}
            onPress={handleSubmit}
            fullWidth
            style={styles.submitButton}
          />

          <Button
            variant="outline"
            title="Cancelar"
            onPress={() => navigation?.goBack()}
            disabled={submitting}
            fullWidth
          />
        </View>
      </ScrollView>

      {renderModalidadPicker()}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────

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
  formCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  fieldWrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  labelError: {
    color: colors.error,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  pickerButtonError: {
    borderColor: colors.error,
  },
  pickerText: {
    fontSize: typography.md,
    color: colors.text,
  },
  pickerPlaceholder: {
    color: colors.grayLight,
  },
  pickerArrow: {
    fontSize: typography.xs,
    color: colors.grayMedium,
  },
  errorText: {
    fontSize: typography.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
  submitButton: {
    marginBottom: spacing.sm,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxxl * 2 : spacing.xxl,
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
  },
  modalOptionSelected: {
    backgroundColor: colors.primary,
  },
  modalOptionText: {
    fontSize: typography.md,
    color: colors.text,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: typography.semibold,
  },
  modalCancelButton: {
    marginTop: spacing.md,
  },
});

export default OfertaFormScreen;
