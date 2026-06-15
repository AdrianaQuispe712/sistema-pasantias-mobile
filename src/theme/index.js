/**
 * Theme - Paleta de colores oficial del proyecto de Pasantías
 * 
 * Diseño formal, corporativo e intuitivo
 * Blanco es el color dominante
 */

export const colors = {
  // ============================================
  // COLORES PRINCIPALES
  // ============================================
  
  // Blanco - Fondo primordial
  white: '#FFFFFF',
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA', // Gris muy claro para fondos alternativos
  
  // Azul oscuro - Texto principal, iconos
  primary: '#1A3C8F',
  primaryDark: '#142F6B',
  primaryLight: '#2A4FA8',
  
  // Azul medio - Iconos, círculos, elementos interactivos
  secondary: '#1E6FD9',
  secondaryDark: '#185BB5',
  secondaryLight: '#3A85E5',
  
  // Azul cielo - Acento claro, hover, éxito
  accent: '#3DA0F0',
  accentLight: '#6BB8F5',
  accentDark: '#2A8BE0',
  
  // Naranja - Acento futuro, CTAs importantes
  orange: '#F07020',
  orangeDark: '#D45F18',
  orangeLight: '#F58A4A',
  
  // Ámbar - Broche, detalle, warning
  amber: '#F5A623',
  amberDark: '#E0951A',
  amberLight: '#F7B94D',
  
  // ============================================
  // COLORES SECUNDARIOS
  // ============================================
  
  // Gris oscuro - Tagline, texto secundario
  gray: '#4A4A4A',
  grayDark: '#333333',
  grayMedium: '#6B7280',
  grayLight: '#9CA3AF',
  grayLighter: '#E5E7EB',
  grayBackground: '#F3F4F6',
  
  // Naranja oscuro - Degradado mano
  orangeGradient: '#D44F10',
  
  // ============================================
  // COLORES ESTADO
  // ============================================
  
  success: '#10B981',      // Completado, aprobado
  successLight: '#D1FAE5',
  warning: '#F59E0B',      // Pendiente, atención
  warningLight: '#FEF3C7',
  error: '#EF4444',        // Error, rechazado
  errorLight: '#FEE2E2',
  orange: '#F07020',       // Cerrada, naranja
  orangeLight: '#FED7AA',
  info: '#3B82F6',         // Información
  infoLight: '#DBEAFE',
  
  // ============================================
  // COLORES SEMÁNTICOS
  // ============================================
  
  aceptado: '#10B981',
  pendiente: '#F59E0B',
  rechazado: '#EF4444',
  completado: '#10B981',
  abandono: '#EF4444',
  
  // ============================================
  // TEXT & BORDERS
  // ============================================
  
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
  
  // ============================================
  // OVERLAYS & SHADOWS
  // ============================================
  
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

export const typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  title: 34,
  
  // Font weights
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  
  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
};

export default theme;
