/**
 * Badge - Componente de etiqueta/badge reutilizable
 * 
 * Variantes de color: success, warning, error, info, neutral
 * Tamaños: sm, md
 * Opción de dot para notificaciones
 * 
 * @module components/ui/Badge
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

/**
 * @typedef {'success' | 'warning' | 'error' | 'info' | 'neutral'} BadgeVariant
 * @typedef {'sm' | 'md'} BadgeSize
 * 
 * @param {object} props
 * @param {BadgeVariant} [props.variant='neutral'] - Variante de color
 * @param {BadgeSize} [props.size='md'] - Tamaño del badge
 * @param {string} [props.label] - Texto del badge
 * @param {boolean} [props.dot=false] - Muestra punto indicador (para notificaciones)
 * @param {object} [props.style] - Estilo adicional
 * @param {object} [props.textStyle] - Estilo del texto adicional
 * @param {React.ReactNode} [props.children] - Contenido alternativo al label
 */
const Badge = ({
  variant = 'neutral',
  size = 'md',
  label,
  dot = false,
  style,
  textStyle,
  children,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          container: styles.success,
          text: styles.textSuccess,
          dot: styles.dotSuccess,
        };
      case 'warning':
        return {
          container: styles.warning,
          text: styles.textWarning,
          dot: styles.dotWarning,
        };
      case 'error':
        return {
          container: styles.error,
          text: styles.textError,
          dot: styles.dotError,
        };
      case 'orange':
        return {
          container: styles.orange,
          text: styles.textOrange,
          dot: styles.dotOrange,
        };
      case 'info':
        return {
          container: styles.info,
          text: styles.textInfo,
          dot: styles.dotInfo,
        };
      case 'neutral':
      default:
        return {
          container: styles.neutral,
          text: styles.textNeutral,
          dot: styles.dotNeutral,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = styles[`size_${size}`];

  return (
    <View
      style={[
        styles.base,
        sizeStyles,
        variantStyles.container,
        style,
      ]}
      accessibilityRole="text"
    >
      {dot && (
        <View
          style={[
            styles.dot,
            styles[`dotSize_${size}`],
            variantStyles.dot,
          ]}
        />
      )}

      {label && (
        <Text
          style={[
            styles.text,
            styles[`textSize_${size}`],
            variantStyles.text,
            dot && styles.textWithDot,
            textStyle,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}

      {!label && children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },

  // Sizes
  size_sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 20,
  },
  size_md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    minHeight: 24,
  },

  // Variants - Success
  success: {
    backgroundColor: colors.successLight,
  },
  textSuccess: {
    color: colors.success,
  },
  dotSuccess: {
    backgroundColor: colors.success,
  },

  // Variants - Warning
  warning: {
    backgroundColor: colors.warningLight,
  },
  textWarning: {
    color: colors.warning,
  },
  dotWarning: {
    backgroundColor: colors.warning,
  },

  // Variants - Error
  error: {
    backgroundColor: colors.errorLight,
  },
  textError: {
    color: colors.error,
  },
  dotError: {
    backgroundColor: colors.error,
  },

  // Variants - Orange
  orange: {
    backgroundColor: colors.orangeLight,
  },
  textOrange: {
    color: colors.orange,
  },
  dotOrange: {
    backgroundColor: colors.orange,
  },

  // Variants - Info
  info: {
    backgroundColor: colors.infoLight,
  },
  textInfo: {
    color: colors.info,
  },
  dotInfo: {
    backgroundColor: colors.info,
  },

  // Variants - Neutral
  neutral: {
    backgroundColor: colors.grayBackground,
  },
  textNeutral: {
    color: colors.gray,
  },
  dotNeutral: {
    backgroundColor: colors.grayMedium,
  },

  // Dot
  dot: {
    borderRadius: borderRadius.full,
  },
  dotSize_sm: {
    width: 6,
    height: 6,
    marginRight: spacing.xs,
  },
  dotSize_md: {
    width: 8,
    height: 8,
    marginRight: spacing.xs,
  },

  // Text
  text: {
    fontWeight: typography.semibold,
  },
  textSize_sm: {
    fontSize: typography.xs,
  },
  textSize_md: {
    fontSize: typography.sm,
  },
  textWithDot: {
    marginLeft: 0,
  },
});

export default Badge;
