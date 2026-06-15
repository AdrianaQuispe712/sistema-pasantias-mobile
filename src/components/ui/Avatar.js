/**
 * Avatar - Componente de avatar reutilizable
 * 
 * Soporte para imagen o fallback con iniciales
 * Tamaños: sm, md, lg, xl
 * Indicador de estado online
 * 
 * @module components/ui/Avatar
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

/**
 * @typedef {'sm' | 'md' | 'lg' | 'xl'} AvatarSize
 * 
 * @param {object} props
 * @param {string} [props.uri] - URL de la imagen
 * @param {string} [props.name] - Nombre para generar iniciales
 * @param {AvatarSize} [props.size='md'] - Tamaño del avatar
 * @param {boolean} [props.online=false] - Muestra indicador de estado online
 * @param {object} [props.style] - Estilo adicional
 * @param {string} [props.accessibilityLabel] - Label para accesibilidad
 */
const Avatar = ({
  uri,
  name = '',
  size = 'md',
  online = false,
  style,
  accessibilityLabel,
}) => {
  /**
   * Obtiene las iniciales del nombre
   * @param {string} fullName
   * @returns {string}
   */
  const getInitials = (fullName) => {
    if (!fullName) return '?';

    const parts = fullName.trim().split(' ').filter(Boolean);

    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  /**
   * Obtiene un color basado en el nombre
   * @param {string} str
   * @returns {string}
   */
  const getColorFromName = (str) => {
    if (!str) return colors.grayMedium;

    const colorOptions = [
      colors.primary,
      colors.secondary,
      colors.accent,
      colors.orange,
      colors.success,
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colorOptions[Math.abs(hash) % colorOptions.length];
  };

  const sizeConfig = {
    sm: {
      container: 32,
      borderRadius: borderRadius.full,
      text: typography.xs,
      dot: 8,
      dotBorder: 2,
    },
    md: {
      container: 40,
      borderRadius: borderRadius.full,
      text: typography.sm,
      dot: 10,
      dotBorder: 2,
    },
    lg: {
      container: 56,
      borderRadius: borderRadius.full,
      text: typography.lg,
      dot: 12,
      dotBorder: 2,
    },
    xl: {
      container: 72,
      borderRadius: borderRadius.full,
      text: typography.xxl,
      dot: 14,
      dotBorder: 3,
    },
  };

  const config = sizeConfig[size] || sizeConfig.md;
  const bgColor = getColorFromName(name);
  const initials = getInitials(name);

  // Validar que URI sea una URL real de foto subida (http/https/file)
  // y NO sea una URL generada por servicios externos:
  //   - ui-avatars.com (Jetstream fallback por defecto)
  //   - gravatar.com (Jetstream fallback alternativo)
  // Si no hay foto real, mostrar iniciales con color de fondo
  const GENERATED_PHOTO_SERVICES = ['ui-avatars.com', 'gravatar.com', 'gravatar'];
  const isGeneratedUrl = uri && GENERATED_PHOTO_SERVICES.some((svc) => uri.includes(svc));
  const isValidUri = uri
    && typeof uri === 'string'
    && /^(https?|file):\/\//.test(uri)
    && !isGeneratedUrl;

  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel || name || 'Avatar'}
      accessibilityRole="image"
    >
      {/* Avatar container */}
      <View
        style={[
          styles.avatar,
          {
            width: config.container,
            height: config.container,
            borderRadius: config.borderRadius,
          },
          !isValidUri && { backgroundColor: bgColor },
        ]}
      >
        {isValidUri ? (
          <Image
            source={{ uri }}
            style={[
              styles.image,
              {
                width: config.container,
                height: config.container,
                borderRadius: config.borderRadius,
              },
            ]}
            resizeMode="cover"
          />
        ) : (
          <Text
            style={[
              styles.initials,
              { fontSize: config.text },
            ]}
          >
            {initials}
          </Text>
        )}
      </View>

      {/* Online indicator */}
      {online && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: config.dot,
              height: config.dot,
              borderRadius: config.dot / 2,
              borderWidth: config.dotBorder,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    // Dimensions applied inline
  },
  initials: {
    color: colors.white,
    fontWeight: typography.bold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.success,
    borderColor: colors.white,
  },
});

export default Avatar;
