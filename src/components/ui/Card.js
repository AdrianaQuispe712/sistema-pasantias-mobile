/**
 * Card - Componente reutilizable de tarjeta
 * 
 * Variantes: default (con sombra), outlined (borde), elevated (sombra fuerte)
 * Soporte para header, footer, padding personalizado, onPress
 * 
 * @module components/ui/Card
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';

/**
 * @typedef {'default' | 'outlined' | 'elevated'} CardVariant
 * @typedef {'none' | 'sm' | 'md' | 'lg'} CardPadding
 * 
 * @param {object} props
 * @param {CardVariant} [props.variant='default'] - Variante de la tarjeta
 * @param {CardPadding} [props.padding='md'] - Padding interno
 * @param {function} [props.onPress] - Callback al presionar (hace la tarjeta clicable)
 * @param {React.ReactNode} [props.header] - Contenido del encabezado
 * @param {React.ReactNode} [props.footer] - Contenido del pie
 * @param {React.ReactNode} [props.children] - Contenido principal
 * @param {object} [props.style] - Estilo adicional del contenedor
 * @param {object} [props.headerStyle] - Estilo adicional del header
 * @param {object} [props.footerStyle] - Estilo adicional del footer
 */
const Card = ({
  variant = 'default',
  padding = 'md',
  onPress,
  header,
  footer,
  children,
  style,
  headerStyle,
  footerStyle,
}) => {
  const getContainerStyle = () => {
    const base = [styles.base, styles[`padding_${padding}`]];

    switch (variant) {
      case 'default':
        base.push(styles.default);
        break;
      case 'outlined':
        base.push(styles.outlined);
        break;
      case 'elevated':
        base.push(styles.elevated);
        break;
      default:
        base.push(styles.default);
    }

    return base;
  };

  const content = (
    <View style={[...getContainerStyle(), style]}>
      {header && (
        <View style={[styles.header, headerStyle]}>
          {header}
        </View>
      )}

      <View style={styles.body}>
        {children}
      </View>

      {footer && (
        <View style={[styles.footer, footerStyle]}>
          {footer}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.touchable}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  touchable: {
    borderRadius: borderRadius.lg,
  },

  // Padding options
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: spacing.sm,
  },
  padding_md: {
    padding: spacing.lg,
  },
  padding_lg: {
    padding: spacing.xl,
  },

  // Variants
  default: {
    ...shadows.sm,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    ...shadows.lg,
  },

  // Header
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },

  // Body
  body: {
    // No styles needed, just wrapper
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
});

export default Card;
