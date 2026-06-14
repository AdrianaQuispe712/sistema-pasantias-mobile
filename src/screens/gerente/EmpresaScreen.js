/**
 * EmpresaScreen - Ver/Editar información empresarial (rol Gerente)
 *
 * Muestra los datos de la empresa del gerente con opción de editar.
 * Validación client-side antes de enviar al backend.
 *
 * Backend validation (EmpresaController::update):
 *   nomEmpresa: required|string|max:255
 *   direccion: nullable|string
 *   telefono: nullable|string
 *   email: nullable|email
 *   descripcion: nullable|string
 *   rubro: nullable|string
 *
 * @module screens/gerente/EmpresaScreen
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
import { Header, Card, Input, Button, EmptyState, LoadingSpinner } from '../../components/ui';
import { getEmpresa, updateEmpresa } from '../../api/gerenteEmpresa';

const EmpresaScreen = ({ navigation }) => {
  // ─── Form state ─────────────────────────────────────────
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [rubro, setRubro] = useState('');

  // ─── UI state ───────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);

  // ─── Load empresa data ──────────────────────────────────
  const fetchEmpresa = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const response = await getEmpresa();
      const data = response?.data || response;

      setNombre(data.nombre || data.nomEmpresa || '');
      setDireccion(data.direccion || '');
      setTelefono(data.telefono || '');
      setEmail(data.email || '');
      setDescripcion(data.descripcion || '');
      setRubro(data.rubro || '');
    } catch (err) {
      console.error('Error fetching empresa:', err);
      setError('No se pudieron cargar los datos de la empresa');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmpresa();
  }, [fetchEmpresa]);

  // ─── Client-side validation ─────────────────────────────
  const validate = () => {
    const newErrors = {};

    // nomEmpresa: required|string|max:255
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre de la empresa es obligatorio';
    } else if (nombre.trim().length > 255) {
      newErrors.nombre = 'El nombre no puede exceder 255 caracteres';
    }

    // email: nullable|email
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Ingrese un email válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit handler ─────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const payload = {
        nomEmpresa: nombre.trim(),
        direccion: direccion.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        descripcion: descripcion.trim() || null,
        rubro: rubro.trim() || null,
      };

      await updateEmpresa(payload);
      setEditing(false);
      Alert.alert('Éxito', 'Empresa actualizada correctamente');
    } catch (err) {
      console.error('Error updating empresa:', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo actualizar la empresa';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Cancel editing ─────────────────────────────────────
  const handleCancel = () => {
    setEditing(false);
    setErrors({});
    // Reset to original values
    fetchEmpresa();
  };

  // ─── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.screen}>
        <Header
          title="Empresa"
          subtitle="Información empresarial"
          leftIcon={<Text style={styles.backIcon}>←</Text>}
          onLeftPress={() => navigation?.goBack()}
        />
        <LoadingSpinner fullScreen message="Cargando empresa..." />
      </View>
    );
  }

  // ─── Error state ────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.screen}>
        <Header
          title="Empresa"
          subtitle="Información empresarial"
          leftIcon={<Text style={styles.backIcon}>←</Text>}
          onLeftPress={() => navigation?.goBack()}
        />
        <EmptyState
          icon={<Text style={styles.errorIcon}>⚠️</Text>}
          title="Error"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={() => fetchEmpresa()}
        />
      </View>
    );
  }

  // ─── Main render ────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <Header
        title="Empresa"
        subtitle={editing ? 'Editando datos' : nombre || 'Información empresarial'}
        leftIcon={<Text style={styles.backIcon}>←</Text>}
        onLeftPress={() => navigation?.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Empresa Info Card ── */}
        <Card variant="default" style={styles.formCard}>
          {/* Nombre Empresa */}
          <Input
            label="Nombre de la Empresa *"
            placeholder="Nombre de la empresa"
            value={nombre}
            onChangeText={(text) => {
              setNombre(text);
              if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: null }));
            }}
            error={errors.nombre}
            editable={editing}
            maxLength={255}
          />

          {/* Dirección */}
          <Input
            label="Dirección"
            placeholder="Dirección de la empresa"
            value={direccion}
            onChangeText={setDireccion}
            editable={editing}
          />

          {/* Teléfono */}
          <Input
            label="Teléfono"
            placeholder="Número de teléfono"
            value={telefono}
            onChangeText={setTelefono}
            editable={editing}
            keyboardType="phone-pad"
          />

          {/* Email */}
          <Input
            label="Email"
            placeholder="email@empresa.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            }}
            error={errors.email}
            editable={editing}
            keyboardType="email-address"
          />

          {/* Rubro */}
          <Input
            label="Rubro"
            placeholder="Ej: Tecnología, Educación..."
            value={rubro}
            onChangeText={setRubro}
            editable={editing}
          />

          {/* Descripción */}
          <Input
            label="Descripción"
            placeholder="Descripción de la empresa..."
            value={descripcion}
            onChangeText={setDescripcion}
            editable={editing}
            numberOfLines={3}
          />
        </Card>

        {/* ── Action Buttons ── */}
        <View style={styles.actions}>
          {editing ? (
            <>
              <Button
                variant="primary"
                title="Guardar Cambios"
                loading={submitting}
                disabled={submitting}
                onPress={handleSubmit}
                fullWidth
                style={styles.submitButton}
              />
              <Button
                variant="outline"
                title="Cancelar"
                onPress={handleCancel}
                disabled={submitting}
                fullWidth
              />
            </>
          ) : (
            <Button
              variant="primary"
              title="Editar Información"
              onPress={() => setEditing(true)}
              fullWidth
            />
          )}
        </View>
      </ScrollView>
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
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
  submitButton: {
    marginBottom: spacing.sm,
  },
  errorIcon: {
    fontSize: 48,
  },
});

export default EmpresaScreen;
