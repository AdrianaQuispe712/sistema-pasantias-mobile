/**
 * EmptyState - Componente de estado vacío reutilizable
 * 
 * Muestra un icono, título, subtítulo y opción de acción
 * Ideal para listas vacías, errores de carga, etc.
 * 
 * @module components/ui/EmptyState
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import Button from './Button';

/**
 * @param {object} props
 * @param {React.ReactNode} [props.icon] - Icono principal
 * @param {string} props.title - Título del estado vacío
 * @param {string} [props.subtitle] - Subtítulo descriptivo
 * @param {string} [props.actionLabel] - Label del botón de acción
 * @param {function} [props.onAction] - Callback del botón de acción
 * @param {object} [props.style] - Estilo adicional
 * @param {object} [props.iconStyle] - Estilo adicional del icono
 */
const EmptyState = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
  iconStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Icon */}
      {icon && (
        <View style={[styles.iconContainer, iconStyle]}>
          {icon}
        </View>
      )}

      {/* Title */}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      )}

      {/* Action button */}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            variant="primary"
            size="md"
            title={actionLabel}
            onPress={onAction}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxl,
    minHeight: 250,
  },
  iconContainer: {
    marginBottom: spacing.xl,
    opacity: 0.6,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.md * typography.normal,
    marginBottom: spacing.xl,
  },
  actionContainer: {
    marginTop: spacing.md,
  },
});

export default EmptyState;
