/**
 * EvidenciaScreen - Pantalla para subir evidencia de una actividad
 *
 * Permite subir:
 * - Fotos (cámara/galería) — máximo 5 imágenes
 * - Documentos (PDF, Word, Excel) — máximo 1 documento, 2MB límite
 * - Vista previa antes de subir
 * - Indicador de progreso de subida
 * - Validación de tamaño (2MB por archivo)
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
import * as DocumentPicker from 'expo-document-picker';
import { cacheDirectory, makeDirectoryAsync, copyAsync, deleteAsync } from 'expo-file-system/legacy';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Button, Header, Card, Input, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { uploadEvidencia } from '../../api/evidencias';
import { getMisActividades } from '../../api/actividades';
import { translateError } from '../../utils/translateError';

// ─── Constantes ────────────────────────────────────────────

const MAX_IMAGES = 5;
const MAX_DOCUMENTS = 1;
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Tipos de documento permitidos
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

// ─── Helpers ───────────────────────────────────────────────

/** Formatea bytes a un string legible */
const formatFileSize = (bytes) => {
  if (!bytes) return '? KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Obtiene la extensión del archivo desde el nombre */
const getExtension = (name) => {
  if (!name) return '';
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : '';
};

// ─── Componente ────────────────────────────────────────────

const EvidenciaScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { actividadId } = route.params || {};

  // States
  const [actividad, setActividad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [selectedActividadId, setSelectedActividadId] = useState(actividadId || null);
  const [descripcion, setDescripcion] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Validation — los errores se muestran inline en cada campo
  const [errors, setErrors] = useState({});

  // ── Fetch actividad ─────────────────────────────────────

  const fetchActividad = useCallback(async () => {
    if (!actividadId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await getMisActividades();
      const actividades = Array.isArray(data) ? data : data.data || [];
      const found = actividades.find(
        (a) =>
          String(a.id) === String(actividadId) ||
          String(a.actividadId) === String(actividadId) ||
          String(a.actividad_id) === String(actividadId)
      );
      setActividad(found || null);
    } catch (err) {
      console.error('Error al cargar actividad:', err);
      setError('No se pudo cargar la información de la actividad.');
    } finally {
      setLoading(false);
    }
  }, [actividadId]);

  useEffect(() => {
    fetchActividad();
  }, [fetchActividad]);

  // ── Permisos ────────────────────────────────────────────

  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

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

  // ── Selector de imágenes ────────────────────────────────

  const pickImage = useCallback(
    async (useCamera = false) => {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      try {
        let result;

        if (useCamera) {
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
          });
        } else {
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsMultipleSelection: true,
            selectionLimit: Math.max(1, MAX_IMAGES - selectedFiles.length),
            // NO usar allowsEditing con allowsMultipleSelection — se ignoran mutuamente
          });
        }

        if (!result.canceled && result.assets) {
          // Validar tamaño y límite
          const oversized = result.assets.filter(
            (asset) => asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES
          );

          if (oversized.length > 0) {
            Alert.alert(
              'Archivo demasiado grande',
              `${oversized.length} imagen(es) superan el límite de ${MAX_FILE_SIZE_MB} MB. ` +
                `Tamaño máximo: ${MAX_FILE_SIZE_MB} MB por archivo.\n\n` +
                oversized.map((a) => `• ${a.fileName || 'Imagen'}: ${formatFileSize(a.fileSize)}`).join('\n'),
              [{ text: 'Entendido' }]
            );

            // Solo agregar las que sí cumplen el límite
            const validFiles = result.assets.filter(
              (asset) => !asset.fileSize || asset.fileSize <= MAX_FILE_SIZE_BYTES
            );

            if (validFiles.length === 0) return;

            const newFiles = validFiles.map((asset) => ({
              uri: asset.uri,
              type: 'image',
              name: asset.fileName || asset.uri.split('/').pop() || 'imagen.jpg',
              mimeType: asset.mimeType || 'image/jpeg',
              size: asset.fileSize || 0,
            }));

            setSelectedFiles((prev) => {
              const combined = [...prev, ...newFiles];
              return combined.slice(0, MAX_IMAGES);
            });
            return;
          }

          // Todas las imágenes son válidas
          const newFiles = result.assets.map((asset) => ({
            uri: asset.uri,
            type: 'image',
            name: asset.fileName || asset.uri.split('/').pop() || 'imagen.jpg',
            mimeType: asset.mimeType || 'image/jpeg',
            size: asset.fileSize || 0,
          }));

          setSelectedFiles((prev) => {
            const combined = [...prev, ...newFiles];
            if (combined.length > MAX_IMAGES) {
              Alert.alert(
                'Límite de imágenes',
                `Solo puedes subir hasta ${MAX_IMAGES} imágenes. Se seleccionaron las primeras ${MAX_IMAGES}.`
              );
            }
            return combined.slice(0, MAX_IMAGES);
          });

          // Limpiar error de archivos si ya hay algo seleccionado
          setErrors((prev) => ({ ...prev, archivos: undefined }));
        }
      } catch (err) {
        console.error('Error al seleccionar imagen:', err);
        Alert.alert('Error', 'No se pudo seleccionar la imagen. Intentá de nuevo.');
      }
    },
    [requestPermissions, selectedFiles.length]
  );

  // ── Selector de documentos ──────────────────────────────

  const pickDocument = useCallback(async () => {
    if (selectedDocument) {
      Alert.alert(
        'Documento ya seleccionado',
        'Ya tenés un documento seleccionado. Eliminalo primero si querés elegir otro.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_DOC_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];

      // Validar tamaño (2 MB)
      if (asset.size && asset.size > MAX_FILE_SIZE_BYTES) {
        Alert.alert(
          'Documento demasiado grande',
          `El documento "${asset.name}" pesa ${formatFileSize(asset.size)}.\n\n` +
            `El límite máximo es de ${MAX_FILE_SIZE_MB} MB. ` +
            `Por favor seleccioná un archivo más pequeño o comprimilo.`,
          [{ text: 'Entendido' }]
        );
        return;
      }

      setSelectedDocument({
        uri: asset.uri,
        type: 'document',
        name: asset.name,
        mimeType: asset.mimeType || 'application/octet-stream',
        size: asset.size || 0,
      });

      // Limpiar error
      setErrors((prev) => ({ ...prev, archivos: undefined }));
    } catch (err) {
      console.error('Error al seleccionar documento:', err);
      Alert.alert('Error', 'No se pudo seleccionar el documento. Intentá de nuevo.');
    }
  }, [selectedDocument]);

  // ── Eliminar archivos ───────────────────────────────────

  const removeFile = useCallback((index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeDocument = useCallback(() => {
    setSelectedDocument(null);
  }, []);

  // ── Validación ──────────────────────────────────────────

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!selectedActividadId) {
      newErrors.actividad = 'Seleccioná una actividad.';
    }

    if (selectedFiles.length === 0 && !selectedDocument) {
      newErrors.archivos = 'Seleccioná al menos una imagen o documento.';
    }

    if (!descripcion.trim()) {
      newErrors.descripcion = 'Agregá una descripción de la evidencia.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedActividadId, selectedFiles.length, selectedDocument, descripcion]);

  // ── Subir evidencia ─────────────────────────────────────
  //
  // Ref para evitar doble-tap: la subida es async, y el estado
  // `uploading` tarda en reflejarse. Con la ref bloqueamos instantáneamente.

  const uploadingRef = React.useRef(false);

  const handleUpload = useCallback(async () => {
    // Prevenir doble-tap
    if (uploadingRef.current) return;
    uploadingRef.current = true;

    // ── Validar que haya actividad ──
    if (!selectedActividadId) {
      Alert.alert(
        'Sin actividad',
        'No se especificó una actividad. Volvé al detalle de la actividad y probá de nuevo.',
        [{ text: 'OK' }]
      );
      uploadingRef.current = false;
      return;
    }

    // ── Debug ──
    console.log('[Upload] actividadId:', selectedActividadId);
    console.log('[Upload] images:', selectedFiles.length, 'doc:', !!selectedDocument);
    console.log('[Upload] descripcion:', descripcion?.trim()?.substring(0, 30));

    // Validar
    if (!validateForm()) {
      Alert.alert('Faltan datos', 'Revisá los campos marcados en rojo antes de subir.', [{ text: 'OK' }]);
      uploadingRef.current = false;
      return;
    }

    // Validar tamaño
    const oversizedImages = selectedFiles.filter((f) => f.size && f.size > MAX_FILE_SIZE_BYTES);
    if (oversizedImages.length > 0) {
      setErrors((prev) => ({ ...prev, archivos: `${oversizedImages.length} imagen(es) superan los ${MAX_FILE_SIZE_MB} MB.` }));
      uploadingRef.current = false;
      return;
    }
    if (selectedDocument?.size && selectedDocument.size > MAX_FILE_SIZE_BYTES) {
      setErrors((prev) => ({ ...prev, archivos: `El documento supera los ${MAX_FILE_SIZE_MB} MB.` }));
      uploadingRef.current = false;
      return;
    }

    try {
      setUploading(true);
      setErrors({});

      // ── Preparar archivo: copiar a caché para URI válida ──
      // expo-image-picker devuelve URIs que a veces no son accesibles
      // para XHR. Copiamos el archivo a FileSystem.cacheDirectory
      // para garantizar una URI de archivo válida.

      let tipo = 'foto';
      let sourceUri = null;
      let fileName = 'evidencia.jpg';
      let mimeType = 'image/jpeg';

      if (selectedDocument) {
        tipo = 'documento';
        sourceUri = selectedDocument.uri;
        fileName = selectedDocument.name || 'documento.pdf';
        mimeType = selectedDocument.mimeType || 'application/pdf';
      } else if (selectedFiles.length > 0) {
        tipo = 'foto';
        sourceUri = selectedFiles[0].uri;
        fileName = selectedFiles[0].name || 'evidencia.jpg';
        mimeType = selectedFiles[0].mimeType || 'image/jpeg';
      }

      if (!sourceUri) {
        Alert.alert('Sin archivo', 'Seleccioná al menos una imagen o documento.');
        setUploading(false);
        uploadingRef.current = false;
        return;
      }

      // Copiar a caché para asegurar URI accesible
      const cacheDirPath = cacheDirectory + 'uploads/';
      await makeDirectoryAsync(cacheDirPath, { intermediates: true });
      const cachedUri = cacheDirPath + fileName;

      console.log('[Upload] Copiando archivo a caché:', sourceUri, '→', cachedUri);
      await copyAsync({ from: sourceUri, to: cachedUri });
      console.log('[Upload] Archivo copiado OK');

      const fileToUpload = {
        uri: cachedUri,
        type: mimeType,
        name: fileName,
      };

      // Crear FormData
      const formData = new FormData();
      formData.append('idActividad', String(selectedActividadId));
      formData.append('descripcion', descripcion.trim());
      formData.append('tipo', tipo);
      formData.append('archivo', fileToUpload);

      console.log('[Upload] Enviando...');
      const response = await uploadEvidencia(formData);
      console.log('[Upload] ÉXITO:', JSON.stringify(response));

      // ── Éxito: limpiar form y mostrar confirmación ──
      setSelectedFiles([]);
      setSelectedDocument(null);
      setDescripcion('');
      setUploading(false);

      Alert.alert(
        '✅ ¡Evidencia subida!',
        'Tu evidencia fue registrada correctamente. Podés verla en el detalle de la actividad.',
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('[Upload] ERROR:', err);
      if (err.response) {
        console.log('[Upload] STATUS:', err.response.status);
        console.log('[Upload] DATA:', JSON.stringify(err.response.data));
      }

      // Extraer mensaje y traducir
      let message = 'No se pudo subir la evidencia. Intentá nuevamente.';
      const data = err.response?.data;

      if (data) {
        try {
          if (typeof data === 'object' && data.errors) {
            const allErrors = Object.entries(data.errors)
              .map(([field, msgs]) => {
                const msgList = Array.isArray(msgs) ? msgs.join('\n') : String(msgs);
                return `• ${translateError(msgList)}`;
              })
              .join('\n');
            if (allErrors) message = allErrors;
            else if (data.message) message = translateError(data.message);
          } else if (data.message) {
            message = translateError(data.message);
          } else if (typeof data === 'string') {
            message = translateError(data);
          } else {
            message = translateError(JSON.stringify(data));
          }
        } catch {
          message = translateError(String(data));
        }
      } else if (err.message) {
        message = translateError(err.message);
      }

      Alert.alert('❌ Error al subir', message);
    } finally {
      uploadingRef.current = false;
    }
  }, [validateForm, selectedActividadId, selectedFiles, selectedDocument, descripcion, navigation]);

  // ── Cleanup archivos cacheados al desmontar ───────────
  useEffect(() => {
    return () => {
      deleteAsync(cacheDirectory + 'uploads/', { idempotent: true }).catch(() => {});
    };
  }, []);

  // ── Renderers ───────────────────────────────────────────

  const renderUploadProgress = () => {
    if (!uploading) return null;

    return (
      <View style={styles.uploadingBanner}>
        <Text style={styles.uploadingIcon}>⏳</Text>
        <Text style={styles.uploadingText}>Subiendo evidencia... No cierres la app.</Text>
      </View>
    );
  };

  const renderSelectedImages = () => {
    if (selectedFiles.length === 0) return null;

    return (
      <View style={styles.imagesContainer}>
        <Text style={styles.sectionLabel}>
          Imágenes seleccionadas ({selectedFiles.length}/{MAX_IMAGES})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {selectedFiles.map((file, index) => (
            <View key={index} style={styles.imagePreview}>
              <Image source={{ uri: file.uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeButton} onPress={() => removeFile(index)}>
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
              {file.size > 0 && (
                <View style={styles.fileSizeBadge}>
                  <Text style={styles.fileSizeText}>{formatFileSize(file.size)}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSelectedDocument = () => {
    if (!selectedDocument) return null;

    const isOversized = selectedDocument.size && selectedDocument.size > MAX_FILE_SIZE_BYTES;

    return (
      <View style={styles.documentContainer}>
        <Text style={styles.sectionLabel}>Documento seleccionado</Text>
        <Card variant="outlined" style={[styles.documentCard, isOversized && styles.documentCardError]}>
          <View style={styles.documentInfo}>
            <Text style={styles.documentIcon}>📄</Text>
            <View style={styles.documentDetails}>
              <Text style={styles.documentName} numberOfLines={1}>
                {selectedDocument.name}
              </Text>
              <View style={styles.documentMeta}>
                <Text style={styles.documentType}>{getExtension(selectedDocument.name)}</Text>
                {selectedDocument.size > 0 && (
                  <Text style={[styles.documentSize, isOversized && styles.documentSizeError]}>
                    {' · '}{formatFileSize(selectedDocument.size)}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={removeDocument}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          {isOversized && (
            <Text style={styles.documentErrorText}>
              ⚠️ Este documento supera los {MAX_FILE_SIZE_MB} MB. Eliminalo y seleccioná uno más chico.
            </Text>
          )}
        </Card>
      </View>
    );
  };

  // ── Estados de carga / error ────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Subir Evidencia" />
        <LoadingSpinner fullScreen message="Cargando información..." />
      </View>
    );
  }

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

  // ── Render principal ────────────────────────────────────

  const hayArchivos = selectedFiles.length > 0 || selectedDocument;
  const totalSize =
    selectedFiles.reduce((sum, f) => sum + (f.size || 0), 0) + (selectedDocument?.size || 0);

  return (
    <View style={styles.container}>
      <Header title="Subir Evidencia" />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Información de la actividad */}
        {actividad && (
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionLabel}>Actividad</Text>
            <Text style={styles.actividadNombre}>{actividad.nombre || actividad.titulo}</Text>
            {actividad.estado && (
              <Badge
                variant={actividad.estado?.toLowerCase() === 'completada' ? 'success' : 'info'}
                size="sm"
                label={actividad.estado?.replace('_', ' ')}
                style={styles.actividadBadge}
              />
            )}
          </Card>
        )}

        {/* Info de límites */}
        <Card variant="outlined" style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Información</Text>
          <Text style={styles.infoText}>
            • Máximo {MAX_IMAGES} imágenes{'\n'}
            • Máximo {MAX_DOCUMENTS} documento (PDF, Word, Excel){'\n'}
            • Tamaño máximo por archivo: {MAX_FILE_SIZE_MB} MB
          </Text>
        </Card>

        {/* Botones de selección de archivos */}
        <Card variant="outlined" style={styles.section}>
          <Text style={styles.sectionLabel}>Archivos *</Text>
          <View style={styles.fileButtonsContainer}>
            <TouchableOpacity style={styles.fileButton} onPress={() => pickImage(true)}>
              <Text style={styles.fileButtonIcon}>📷</Text>
              <Text style={styles.fileButtonText}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fileButton} onPress={() => pickImage(false)}>
              <Text style={styles.fileButtonIcon}>🖼️</Text>
              <Text style={styles.fileButtonText}>
                Galería{selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fileButton} onPress={pickDocument}>
              <Text style={styles.fileButtonIcon}>📄</Text>
              <Text style={styles.fileButtonText}>Documento</Text>
            </TouchableOpacity>
          </View>
          {errors.archivos && <Text style={styles.errorText}>{errors.archivos}</Text>}
        </Card>

        {/* Imágenes seleccionadas */}
        {renderSelectedImages()}

        {/* Documento seleccionado */}
        {renderSelectedDocument()}

        {/* Resumen de archivos */}
        {hayArchivos && totalSize > 0 && (
          <Text style={styles.summaryText}>
            Total: {selectedFiles.length} imagen(es)
            {selectedDocument ? ' + 1 documento' : ''}
            {' · '}
            {formatFileSize(totalSize)}
          </Text>
        )}

        {/* Descripción */}
        <Card variant="outlined" style={styles.section}>
          <Input
            label="Descripción *"
            placeholder="Describe la evidencia que estás subiendo..."
            value={descripcion}
            onChangeText={(text) => {
              setDescripcion(text);
              if (text.trim()) setErrors((prev) => ({ ...prev, descripcion: undefined }));
            }}
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
            title={hayArchivos ? `Subir evidencia (${formatFileSize(totalSize)})` : 'Subir evidencia'}
            onPress={handleUpload}
            loading={uploading}
            disabled={uploading || (!hayArchivos)}
          />
        </View>

        {/* Espaciado inferior */}
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
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  // Info card
  infoCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.infoLight,
    borderColor: colors.info,
  },
  infoTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.info,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * 1.6,
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
    gap: spacing.sm,
  },
  fileButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  fileButtonIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  fileButtonText: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.text,
    textAlign: 'center',
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
  fileSizeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fileSizeText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: typography.semibold,
  },
  // Documento
  documentContainer: {
    marginBottom: spacing.md,
  },
  documentCard: {
    marginBottom: spacing.xs,
  },
  documentCardError: {
    borderColor: colors.error,
    borderWidth: 1,
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
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  documentType: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  documentSize: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  documentSizeError: {
    color: colors.error,
    fontWeight: typography.semibold,
  },
  documentErrorText: {
    fontSize: typography.xs,
    color: colors.error,
    marginTop: spacing.sm,
  },
  // Resumen
  summaryText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  // Input icon
  inputIcon: {
    fontSize: typography.md,
  },
  // Progreso
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  uploadingIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  uploadingText: {
    fontSize: typography.md,
    color: colors.text,
    fontWeight: typography.semibold,
  },
  // Error inline
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

export default EvidenciaScreen;
