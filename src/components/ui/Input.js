/**
 * Input - Componente de entrada de texto reutilizable
 * 
 * Soporte para label, placeholder, error, iconos izquierda/derecha
 * Seguridad para contraseñas (secureTextEntry)
 * Diseño corporativo formal
 * 
 * @module components/ui/Input
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

/**
 * @param {object} props
 * @param {string} [props.label] - Label del campo
 * @param {string} [props.placeholder] - Placeholder del campo
 * @param {string} [props.value] - Valor del campo
 * @param {function} [props.onChangeText] - Callback al cambiar texto
 * @param {string} [props.error] - Mensaje de error
 * @param {React.ReactNode} [props.leftIcon] - Icono izquierdo
 * @param {React.ReactNode} [props.rightIcon] - Icono derecho
 * @param {boolean} [props.secureTextEntry=false] - Campo de contraseña
 * @param {string} [props.keyboardType='default'] - Tipo de teclado
 * @param {string} [props.autoComplete='off'] - Autocompletado
 * @param {boolean} [props.editable=true] - Si el campo es editable
 * @param {number} [props.numberOfLines=1] - Número de líneas
 * @param {object} [props.style] - Estilo adicional del contenedor
 * @param {object} [props.inputStyle] - Estilo adicional del input
 * @param {object} [props.labelStyle] - Estilo adicional del label
 * @param {string} [props.accessibilityLabel] - Label para accesibilidad
 */
const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoComplete = 'off',
  editable = true,
  numberOfLines = 1,
  style,
  inputStyle,
  labelStyle,
  accessibilityLabel,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasError = !!error;

  const getContainerStyle = () => {
    const base = [styles.container];

    if (isFocused) {
      base.push(styles.containerFocused);
    }

    if (hasError) {
      base.push(styles.containerError);
    }

    if (!editable) {
      base.push(styles.containerDisabled);
    }

    return base;
  };

  const getInputStyle = () => {
    const base = [styles.input];

    if (leftIcon) {
      base.push(styles.inputWithLeftIcon);
    }

    if (rightIcon || secureTextEntry) {
      base.push(styles.inputWithRightIcon);
    }

    return base;
  };

  const handleTogglePassword = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.wrapper, style]}>
      {/* Label */}
      {label && (
        <Text
          style={[
            styles.label,
            hasError && styles.labelError,
            labelStyle,
          ]}
          accessibilityElementsHidden
        >
          {label}
        </Text>
      )}

      {/* Input container */}
      <View style={getContainerStyle()}>
        {/* Left icon */}
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}

        {/* Text input */}
        <TextInput
          style={getInputStyle()}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.grayLight}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          editable={editable}
          numberOfLines={numberOfLines}
          multiline={numberOfLines > 1}
          textAlignVertical={numberOfLines > 1 ? 'top' : 'center'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={accessibilityLabel || label || placeholder}
          accessibilityState={{
            disabled: !editable,
          }}
          {...rest}
        />

        {/* Password toggle or right icon */}
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={handleTogglePassword}
            style={styles.rightIcon}
            accessibilityLabel={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            accessibilityRole="button"
          >
            <Text style={styles.toggleText}>
              {isPasswordVisible ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        ) : null}
      </View>

      {/* Error message */}
      {hasError && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  containerFocused: {
    borderColor: colors.primary,
    // NOTE: No elevation on Android — with New Architecture (Fabric),
    // elevation changes trigger synchronous native relayout that causes
    // TextInput to lose/regain focus in a flickering loop.
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  containerError: {
    borderColor: colors.error,
  },
  containerDisabled: {
    backgroundColor: colors.grayBackground,
    borderColor: colors.grayLighter,
  },
  input: {
    flex: 1,
    fontSize: typography.md,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  inputWithLeftIcon: {
    marginLeft: spacing.sm,
  },
  inputWithRightIcon: {
    marginRight: spacing.sm,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  toggleText: {
    fontSize: typography.lg,
  },
  errorText: {
    fontSize: typography.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

export default Input;
