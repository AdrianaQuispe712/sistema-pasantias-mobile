/**
 * EvidenciaScreen - Pantalla para subir evidencia de una actividad
 *
 * Permite subir:
 * - Fotos (cámara/galería)
 * - Documentos
 * - Vista previa antes de subir
 * - Indicador de progreso de subida
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Button, Header, Card, Input, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { uploadEvidencia } from '../../api/evidencias';
import { getMisActividades } from '../../api/actividades';

const EvidenciaScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { actividadId } = route.params || {};

  // States
  const [actividad, setActividad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Form state
  const [selectedActividadId, setSelectedActividadId] = useState(actividadId || null);
  const [descripcion, setDescripcion] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Validation
  const [errors, setErrors] = useState({});

  /**
   * Carga la información de la actividad
   */
  const fetchActividad = useCallback(async () => {
    if (!actividadId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await getMisActividades();
      const actividades = Array.isArray(data) ? data : data.data || [];
      const found = actividades.find((a) => String(a.id) === String(actividadId));
      setActividad(found || null);
    } catch (err) {
      console.error('Error al cargar actividad:', err);
      setError('No se pudo cargar la información de la actividad.');
    } finally {
      setLoading(false);
    }
  }, [actividadId]);

  // Carga inicial
  useEffect(() => {
    fetchActividad();
  }, [fetchActividad]);

  /**
   * Solicita permisos para cámara y galería
   */
  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos permisos de cámara y galería para subir evidencia.'
        );
        return false;
      }
    }
    return true;
  }, []);

  /**
   * Abre el selector de imagen (cámara o galería)
   */
  const pickImage = useCallback(
    async (useCamera = false) => {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      try {
        let result;

        if (useCamera) {
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
          });
        } else {
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            allowsEditing: true,
            aspect: [4, 3],
          });
        }

        if (!result.canceled && result.assets) {
          const newFiles = result.assets.map((asset) => ({
            uri: asset.uri,
            type: 'image',
            name: asset.uri.split('/').pop() || 'image.jpg',
            mimeType: 'image/jpeg',
          }));
          setSelectedFiles((prev) => [...prev, ...newFiles]);
        }
      } catch (err) {
        console.error('Error al seleccionar imagen:', err);
        Alert.alert('Error', 'No se pudo seleccionar la imagen.');
      }
    },
    [requestPermissions]
  );

  /**
   * Selecciona un documento
   */
  const pickDocument = useCallback(async () => {
    try {
      // En producción se usaría expo-document-picker
      Alert.alert(
        'Seleccionar documento',
        'Funcionalidad de selección de documentos pendiente de implementar.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Error al seleccionar documento:', err);
      Alert.alert('Error', 'No se pudo seleccionar el documento.');
    }
  }, []);

  /**
   * Elimina un archivo seleccionado
   */
  const removeFile = useCallback((index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Elimina el documento seleccionado
   */
  const removeDocument = useCallback(() => {
    setSelectedDocument(null);
  }, []);

  /**
   * Valida el formulario
   * @returns {boolean} true si es válido
   */
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!selectedActividadId) {
      newErrors.actividad = 'Selecciona una actividad.';
    }

    if (selectedFiles.length === 0 && !selectedDocument) {
      newErrors.archivos = 'Selecciona al menos un archivo (imagen o documento).';
    }

    if (!descripcion.trim()) {
      newErrors.descripcion = 'Agrega una descripción de la evidencia.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedActividadId, selectedFiles, selectedDocument, descripcion]);

  /**
   * Simula el progreso de subida
   */
  const simulateProgress = useCallback(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress(Math.min(progress, 100));
    }, 200);

    return () => clearInterval(interval);
  }, []);

  /**
   * Maneja la subida de evidencia
   */
  const handleUpload = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      const stopProgress = simulateProgress();

      // Crear FormData
      const formData = new FormData();
      formData.append('actividadId', selectedActividadId);
      formData.append('descripcion', descripcion.trim());

      // Agregar imágenes
      selectedFiles.forEach((file, index) => {
        formData.append('archivos', {
          uri: file.uri,
          type: file.mimeType || 'image/jpeg',
          name: file.name || `evidencia_${index}.jpg`,
        });
      });

      // Agregar documento si existe
      if (selectedDocument) {
        formData.append('archivos', {
          uri: selectedDocument.uri,
          type: selectedDocument.mimeType || 'application/pdf',
          name: selectedDocument.name || 'documento.pdf',
        });
      }

      await uploadEvidencia(formData);
      stopProgress();

      Alert.alert(
        '¡Evidencia subida!',
        'Tu evidencia ha sido registrada correctamente.',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error al subir evidencia:', err);
      const message =
        err.response?.data?.message || 'No se pudo subir la evidencia. Intente nuevamente.';
      Alert.alert('Error', message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [
    validateForm,
    selectedActividadId,
    selectedFiles,
    selectedDocument,
    descripcion,
    navigation,
    simulateProgress,
  ]);

  /**
   * Renderiza la barra de progreso de subida
   */
  const renderUploadProgress = () => {
    if (!uploading) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${uploadProgress}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Subiendo... {Math.round(uploadProgress)}%
        </Text>
      </View>
    );
  };

  /**
   * Renderiza las imágenes seleccionadas
   */
  const renderSelectedImages = () => {
    if (selectedFiles.length === 0) return null;

    return (
      <View style={styles.imagesContainer}>
        <Text style={styles.sectionLabel}>Imágenes seleccionadas ({selectedFiles.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {selectedFiles.map((file, index) => (
            <View key={index} style={styles.imagePreview}>
              <Image source={{ uri: file.uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFile(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  /**
   * Renderiza el documento seleccionado
   */
  const renderSelectedDocument = () => {
    if (!selectedDocument) return null;

    return (
      <View style={styles.documentContainer}>
        <Text style={styles.sectionLabel}>Documento seleccionado</Text>
        <Card variant="outlined" style={styles.documentCard}>
          <View style={styles.documentInfo}>
            <Text style={styles.documentIcon}>📄</Text>
            <View style={styles.documentDetails}>
              <Text style={styles.documentName} numberOfLines={1}>
                {selectedDocument.name}
              </Text>
              <Text style={styles.documentType}>
                {selectedDocument.mimeType || 'Documento'}
              </Text>
            </View>
            <TouchableOpacity onPress={removeDocument}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    );
  };

  // Estado de carga
  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Subir Evidencia" />
        <LoadingSpinner fullScreen message="Cargando información..." />
      </View>
    );
  }

  // Estado de error
  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Subir Evidencia" />
        <EmptyState
          icon={<Text style={styles.emptyIcon}>⚠️</Text>}
          title="Error al cargar"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={fetchActividad}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Subir Evidencia" />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Información de la actividad (si se proporcionó) */}
        {actividad && (
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionLabel}>Actividad</Text>
            <Text style={styles.actividadNombre}>
              {actividad.nombre || actividad.titulo}
            </Text>
            {actividad.estado && (
              <Badge
                variant={
                  actividad.estado?.toLowerCase() === 'completada'
                    ? 'success'
                    : 'info'
                }
                size="sm"
                label={actividad.estado?.replace('_', ' ')}
                style={styles.actividadBadge}
              />
            )}
          </Card>
        )}

        {/* Botones de selección de archivos */}
        <Card variant="outlined" style={styles.section}>
          <Text style={styles.sectionLabel}>Archivos *</Text>
          <View style={styles.fileButtonsContainer}>
            <TouchableOpacity
              style={styles.fileButton}
              onPress={() => pickImage(true)}
            >
              <Text style={styles.fileButtonIcon}>📷</Text>
              <Text style={styles.fileButtonText}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fileButton}
              onPress={() => pickImage(false)}
            >
              <Text style={styles.fileButtonIcon}>🖼️</Text>
              <Text style={styles.fileButtonText}>Galería</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fileButton}
              onPress={pickDocument}
            >
              <Text style={styles.fileButtonIcon}>📄</Text>
              <Text style={styles.fileButtonText}>Documento</Text>
            </TouchableOpacity>
          </View>
          {errors.archivos && (
            <Text style={styles.errorText}>{errors.archivos}</Text>
          )}
        </Card>

        {/* Imágenes seleccionadas */}
        {renderSelectedImages()}

        {/* Documento seleccionado */}
        {renderSelectedDocument()}

        {/* Descripción */}
        <Card variant="outlined" style={styles.section}>
          <Input
            label="Descripción *"
            placeholder="Describe la evidencia que estás subiendo..."
            value={descripcion}
            onChangeText={setDescripcion}
            numberOfLines={3}
            error={errors.descripcion}
            leftIcon={<Text style={styles.inputIcon}>📝</Text>}
          />
        </Card>

        {/* Barra de progreso */}
        {renderUploadProgress()}

        {/* Botón de subida */}
        <View style={styles.submitContainer}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            title="Subir evidencia"
            onPress={handleUpload}
            loading={uploading}
            disabled={uploading}
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
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  // Actividad
  actividadNombre: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  actividadBadge: {
    alignSelf: 'flex-start',
  },
  // Botones de selección
  fileButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fileButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  fileButtonIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  fileButtonText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.text,
  },
  // Imágenes
  imagesContainer: {
    marginBottom: spacing.md,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  removeButtonText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.textOnPrimary,
  },
  // Documento
  documentContainer: {
    marginBottom: spacing.md,
  },
  documentCard: {
    marginBottom: spacing.sm,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: typography.md,
    fontWeight: typography.medium,
    color: colors.text,
  },
  documentType: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Input icon
  inputIcon: {
    fontSize: typography.md,
  },
  // Progreso
  progressContainer: {
    marginVertical: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.grayLighter,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.primary,
    textAlign: 'center',
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

export default EvidenciaScreen;
