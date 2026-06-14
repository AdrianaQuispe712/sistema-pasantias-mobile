/**
 * ObservacionScreen - Formulario para agregar observación (rol Jefe)
 *
 * Permite al jefe agregar una observación a una actividad,
 * incluyendo texto y porcentaje de satisfacción.
 *
 * @module screens/jefe/ObservacionScreen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Header, Card, Input, Button } from '../../components/ui';
import { createObservacion } from '../../api/jefeObservaciones';

const MAX_CHARS = 2000;

const ObservacionScreen = ({ route, navigation }) => {
  const { actividadId } = route?.params || {};

  const [observacion, setObservacion] = useState('');
  const [satisfaccion, setSatisfaccion] = useState(50);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const charCount = observacion.length;
  const isOverLimit = charCount > MAX_CHARS;

  const validate = () => {
    const newErrors = {};

    if (!observacion.trim()) {
      newErrors.observacion = 'La observación es requerida';
    } else if (observacion.trim().length < 10) {
      newErrors.observacion = 'La observación debe tener al menos 10 caracteres';
    }

    if (isOverLimit) {
      newErrors.observacion = `Máximo ${MAX_CHARS} caracteres (actual: ${charCount})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!actividadId) {
      Alert.alert('Error', 'ID de actividad no proporcionado');
      return;
    }

    try {
      setLoading(true);
      await createObservacion(actividadId, {
        observacion: observacion.trim(),
        satisfaccion: satisfaccion,
      });

      Alert.alert('Éxito', 'Observación agregada correctamente', [
        { text: 'OK', onPress: () => navigation?.goBack() },
      ]);
    } catch (err) {
      console.error('Error creating observation:', err);
      Alert.alert('Error', 'No se pudo agregar la observación. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Renderiza el slider de satisfacción con label y valor
   */
  const renderSatisfaccionSlider = () => (
    <View style={styles.sliderSection}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>Nivel de Satisfacción</Text>
        <Text style={[styles.sliderValue, { color: getSatisfaccionColor() }]}>
          {satisfaccion}%
        </Text>
      </View>

      <View style={styles.sliderTrack}>
        {/* Background track */}
        <View style={styles.sliderTrackBg} />
        {/* Filled portion */}
        <View
          style={[
            styles.sliderTrackFill,
            {
              width: `${satisfaccion}%`,
              backgroundColor: getSatisfaccionColor(),
            },
          ]}
        />
      </View>

      {/* Slider buttons - increments of 10 */}
      <View style={styles.sliderButtons}>
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
          <View
            key={value}
            style={[
              styles.sliderDot,
              satisfaccion >= value && {
                backgroundColor: getSatisfaccionColor(),
              },
            ]}
          />
        ))}
      </View>

      {/* Quick select buttons */}
      <View style={styles.quickSelectRow}>
        {[
          { label: '0%', value: 0 },
          { label: '25%', value: 25 },
          { label: '50%', value: 50 },
          { label: '75%', value: 75 },
          { label: '100%', value: 100 },
        ].map((option) => (
          <Button
            key={option.value}
            variant={satisfaccion === option.value ? 'primary' : 'outline'}
            size="sm"
            title={option.label}
            onPress={() => setSatisfaccion(option.value)}
            style={styles.quickSelectButton}
          />
        ))}
      </View>
    </View>
  );

  const getSatisfaccionColor = () => {
    if (satisfaccion >= 70) return colors.success;
    if (satisfaccion >= 40) return colors.warning;
    return colors.error;
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Observación"
        subtitle="Agregar observación"
        leftIcon={<Text style={styles.backIcon}>←</Text>}
        onLeftPress={() => navigation?.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Observation Text ── */}
        <Card variant="default" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Observación</Text>
          <Input
            label="Escriba su observación"
            placeholder="Describe su observación sobre la actividad o bitácora del pasante..."
            value={observacion}
            onChangeText={setObservacion}
            error={errors.observacion}
            numberOfLines={6}
            style={styles.inputWrapper}
          />
          <Text style={[styles.charCount, isOverLimit && styles.charCountError]}>
            {charCount} / {MAX_CHARS}
          </Text>
        </Card>

        {/* ── Satisfaction Slider ── */}
        <Card variant="default" style={styles.sectionCard}>
          {renderSatisfaccionSlider()}
        </Card>

        {/* ── Submit Button ── */}
        <Button
          variant="primary"
          size="lg"
          title="Guardar Observación"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          fullWidth
          style={styles.submitButton}
        />

        <Button
          variant="ghost"
          size="md"
          title="Cancelar"
          onPress={() => navigation?.goBack()}
          disabled={loading}
          fullWidth
          style={styles.cancelButton}
        />
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
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  inputWrapper: {
    marginBottom: spacing.xs,
  },
  charCount: {
    fontSize: typography.xs,
    color: colors.textLight,
    textAlign: 'right',
  },
  charCountError: {
    color: colors.error,
    fontWeight: typography.medium,
  },
  sliderSection: {
    padding: spacing.sm,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sliderLabel: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.text,
  },
  sliderValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  sliderTrackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.grayLighter,
    borderRadius: 4,
  },
  sliderTrackFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sliderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.grayLighter,
  },
  quickSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickSelectButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  submitButton: {
    marginBottom: spacing.sm,
  },
  cancelButton: {
    marginBottom: spacing.lg,
  },
});

export default ObservacionScreen;
