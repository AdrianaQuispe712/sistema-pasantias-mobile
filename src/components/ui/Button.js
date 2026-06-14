/**
 * Button - Componente reutilizable de botón
 * 
 * Variantes: primary, secondary, outline, ghost
 * Tamaños: sm, md, lg
 * Soporte para loading, disabled, iconos izquierda/derecha
 * 
 * @module components/ui/Button
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

/**
 * @typedef {'primary' | 'secondary' | 'outline' | 'ghost'} ButtonVariant
 * @typedef {'sm' | 'md' | 'lg'} ButtonSize
 * 
 * @param {object} props
 * @param {ButtonVariant} [props.variant='primary'] - Variante del botón
 * @param {ButtonSize} [props.size='md'] - Tamaño del botón
 * @param {string} [props.title] - Texto del botón
 * @param {function} [props.onPress] - Callback al presionar
 * @param {boolean} [props.loading=false] - Muestra spinner de carga
 * @param {boolean} [props.disabled=false] - Deshabilita el botón
 * @param {React.ReactNode} [props.leftIcon] - Icono a la izquierda
 * @param {React.ReactNode} [props.rightIcon] - Icono a la derecha
 * @param {object} [props.style] - Estilo adicional
 * @param {object} [props.textStyle] - Estilo del texto adicional
 * @param {string} [props.accessibilityLabel] - Label para accesibilidad
 * @param {boolean} [props.fullWidth=false] - Ancho completo
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  title,
  onPress,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  accessibilityLabel,
  fullWidth = false,
  children,
}) => {
  const isDisabled = disabled || loading;

  const getContainerStyle = () => {
    const base = [styles.base, styles[`size_${size}`]];

    switch (variant) {
      case 'primary':
        base.push(styles.primary);
        break;
      case 'secondary':
        base.push(styles.secondary);
        break;
      case 'outline':
        base.push(styles.outline);
        break;
      case 'ghost':
        base.push(styles.ghost);
        break;
      default:
        base.push(styles.primary);
    }

    if (isDisabled) {
      base.push(styles.disabled);
    }

    if (fullWidth) {
      base.push(styles.fullWidth);
    }

    return base;
  };

  const getTextStyle = () => {
    const base = [styles.text, styles[`text_${size}`]];

    switch (variant) {
      case 'primary':
        base.push(styles.textPrimary);
        break;
      case 'secondary':
        base.push(styles.textSecondary);
        break;
      case 'outline':
        base.push(styles.textOutline);
        break;
      case 'ghost':
        base.push(styles.textGhost);
        break;
      default:
        base.push(styles.textPrimary);
    }

    if (isDisabled) {
      base.push(styles.textDisabled);
    }

    return base;
  };

  const getLoaderColor = () => {
    if (isDisabled) return colors.grayLight;
    switch (variant) {
      case 'primary':
      case 'secondary':
        return colors.white;
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return colors.white;
    }
  };

  return (
    <TouchableOpacity
      style={[...getContainerStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getLoaderColor()}
          style={styles.loader}
        />
      ) : (
        <>
          {leftIcon && (
            <React.Fragment>
              {leftIcon}
              <React.Fragment>
                {size === 'sm' && <React.Fragment />}
                {size !== 'sm' && <React.Fragment />}
              </React.Fragment>
            </React.Fragment>
          )}
          {title && <Text style={[...getTextStyle(), textStyle]}>{title}</Text>}
          {!title && children && (
            <Text style={[...getTextStyle(), textStyle]}>{children}</Text>
          )}
          {rightIcon && (
            <React.Fragment>
              {rightIcon}
            </React.Fragment>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },

  // Sizes
  size_sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  size_md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    minHeight: 40,
  },
  size_lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 48,
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Disabled
  disabled: {
    backgroundColor: colors.grayBackground,
    borderColor: colors.grayLighter,
    opacity: 0.6,
  },

  // Text styles
  text: {
    fontWeight: typography.semibold,
  },
  text_sm: {
    fontSize: typography.sm,
  },
  text_md: {
    fontSize: typography.md,
  },
  text_lg: {
    fontSize: typography.lg,
  },
  textPrimary: {
    color: colors.textOnPrimary,
  },
  textSecondary: {
    color: colors.textOnSecondary,
  },
  textOutline: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textDisabled: {
    color: colors.grayLight,
  },

  // Loader
  loader: {
    marginHorizontal: spacing.sm,
  },
});

export default Button;
