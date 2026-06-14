/**
 * Header - Componente de encabezado de pantalla
 * 
 * Fondo con color primary, soporte para back button, acciones, título y subtítulo
 * Diseño corporativo formal
 * 
 * @module components/ui/Header
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

/**
 * @param {object} props
 * @param {string} [props.title] - Título principal
 * @param {string} [props.subtitle] - Subtítulo descriptivo
 * @param {React.ReactNode} [props.leftIcon] - Icono izquierdo (back button)
 * @param {function} [props.onLeftPress] - Callback del icono izquierdo
 * @param {React.ReactNode} [props.rightIcon] - Icono derecho (acciones)
 * @param {function} [props.onRightPress] - Callback del icono derecho
 * @param {boolean} [props.transparent=false] - Fondo transparente
 * @param {object} [props.style] - Estilo adicional
 * @param {boolean} [props.darkStatusBar=false] - StatusBar con estilo dark
 * @param {React.ReactNode} [props.children] - Contenido adicional
 */
const Header = ({
  title,
  subtitle,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  transparent = false,
  style,
  darkStatusBar = false,
  children,
}) => {
  return (
    <View style={[styles.container, transparent && styles.transparent, style]}>
      <StatusBar
        barStyle={darkStatusBar ? 'dark-content' : 'light-content'}
        backgroundColor={transparent ? 'transparent' : colors.primary}
        translucent={transparent}
      />

      <View style={styles.content}>
        {/* Left section */}
        <View style={styles.leftSection}>
          {leftIcon && (
            <TouchableOpacity
              onPress={onLeftPress}
              style={styles.iconButton}
              accessibilityLabel="Volver"
              accessibilityRole="button"
            >
              {leftIcon}
            </TouchableOpacity>
          )}
        </View>

        {/* Center section */}
        <View style={styles.centerSection}>
          {title && (
            <Text
              style={[styles.title, transparent && styles.titleTransparent]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[styles.subtitle, transparent && styles.subtitleTransparent]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right section */}
        <View style={styles.rightSection}>
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightPress}
              style={styles.iconButton}
              accessibilityLabel="Acciones"
              accessibilityRole="button"
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? spacing.xxxl : StatusBar.currentHeight + spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  leftSection: {
    width: 44,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 44,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  titleTransparent: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: typography.sm,
    fontWeight: typography.regular,
    color: colors.accentLight,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  subtitleTransparent: {
    color: colors.textSecondary,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Header;
