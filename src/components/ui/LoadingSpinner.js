/**
 * LoadingSpinner - Componente de carga reutilizable
 * 
 * Modo full screen (overlay) o inline
 * Usa el color primary del theme
 * 
 * @module components/ui/LoadingSpinner
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  Modal,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

/**
 * @param {object} props
 * @param {boolean} [props.fullScreen=false] - Muestra como overlay de pantalla completa
 * @param {boolean} [props.visible=true] - Visibilidad del spinner
 * @param {string} [props.message] - Mensaje opcional junto al spinner
 * @param {string} [props.color] - Color del spinner (default: primary)
 * @param {'small' | 'large'} [props.size='large'] - Tamaño del spinner
 * @param {object} [props.style] - Estilo adicional del contenedor
 * @param {object} [props.textStyle] - Estilo adicional del texto
 */
const LoadingSpinner = ({
  fullScreen = false,
  visible = true,
  message,
  color = colors.primary,
  size = 'large',
  style,
  textStyle,
}) => {
  if (!visible) return null;

  const spinnerContent = (
    <View style={[styles.content, fullScreen && styles.fullScreenContent]}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[styles.message, textStyle]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={[styles.overlay, style]}>
          <View style={styles.modalContent}>
            <ActivityIndicator size={size} color={color} />
            {message && (
              <Text style={[styles.message, textStyle]}>
                {message}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {spinnerContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContent: {
    // Applied in modal context
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 100,
    // Shadow
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  message: {
    marginTop: spacing.md,
    fontSize: typography.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default LoadingSpinner;
