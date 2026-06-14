/**
 * TabNavigator - Bottom tab navigator por rol
 *
 * Exporta tres tab navigators:
 * - PasanteTabs: Ofertas, Actividades, Calendario, Notificaciones, Perfil
 * - JefeTabs: Actividades, Pasantes, Notificaciones, Perfil
 * - GerenteTabs: Ofertas, Inscripciones, Notificaciones, Perfil
 *
 * Cada tab usa Ionicons para los iconos y respeta el theme del proyecto.
 *
 * @module navigation/TabNavigator
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

// Pasante Screens
import OfertasPasanteScreen from '../screens/pasante/OfertasScreen';
import ActividadesPasanteScreen from '../screens/pasante/ActividadesScreen';
import CalendarioScreen from '../screens/pasante/CalendarioScreen';
import NotificacionesPasanteScreen from '../screens/pasante/NotificacionesScreen';

// Jefe Screens
import ActividadesJefeScreen from '../screens/jefe/ActividadesScreen';
import PasantesScreen from '../screens/jefe/PasantesScreen';
import NotificacionesJefeScreen from '../screens/jefe/NotificacionesScreen';

// Gerente Screens
import DashboardGerenteScreen from '../screens/gerente/DashboardScreen';
import OfertasGerenteScreen from '../screens/gerente/OfertasScreen';
import InscripcionesScreen from '../screens/gerente/InscripcionesScreen';
import NotificacionesGerenteScreen from '../screens/gerente/NotificacionesScreen';

// Common
import PerfilScreen from '../screens/common/PerfilScreen';

const Tab = createBottomTabNavigator();

/**
 * Common tab bar options for consistent styling across all roles
 */
const getTabBarOptions = (route) => ({
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.grayLight,
  tabBarStyle: {
    backgroundColor: colors.white,
    borderTopColor: colors.borderLight,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarLabelStyle: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
  },
  headerStyle: {
    backgroundColor: colors.primary,
  },
  headerTintColor: colors.white,
  headerTitleStyle: {
    fontWeight: typography.bold,
    fontSize: typography.lg,
  },
});

// ============================================================
// PASANTE TABS
// ============================================================

export const PasanteTabs = () => {
  console.warn('[TabNav] Rendering PASANTE tabs');
  return (
  <Tab.Navigator screenOptions={getTabBarOptions}>
    <Tab.Screen
      name="OfertasTab"
      component={OfertasPasanteScreen}
      options={{
        title: 'Ofertas',
        headerTitle: 'Ofertas de Pasantía',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="briefcase-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="ActividadesTab"
      component={ActividadesPasanteScreen}
      options={{
        title: 'Actividades',
        headerTitle: 'Mis Actividades',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="checkmark-circle-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="CalendarioTab"
      component={CalendarioScreen}
      options={{
        title: 'Calendario',
        headerTitle: 'Calendario',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="calendar-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="NotificacionesTab"
      component={NotificacionesPasanteScreen}
      options={{
        title: 'Alertas',
        headerTitle: 'Notificaciones',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="notifications-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="PerfilTab"
      component={PerfilScreen}
      options={{
        title: 'Perfil',
        headerTitle: 'Mi Perfil',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="person-outline" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
  );
};

// ============================================================
// JEFE TABS
// ============================================================

export const JefeTabs = () => (
  <Tab.Navigator screenOptions={getTabBarOptions}>
    <Tab.Screen
      name="ActividadesTab"
      component={ActividadesJefeScreen}
      options={{
        title: 'Actividades',
        headerTitle: 'Gestión de Actividades',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="checkmark-circle-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="PasantesTab"
      component={PasantesScreen}
      options={{
        title: 'Pasantes',
        headerTitle: 'Mis Pasantes',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="people-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="NotificacionesTab"
      component={NotificacionesJefeScreen}
      options={{
        title: 'Alertas',
        headerTitle: 'Notificaciones',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="notifications-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="PerfilTab"
      component={PerfilScreen}
      options={{
        title: 'Perfil',
        headerTitle: 'Mi Perfil',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="person-outline" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

// ============================================================
// GERENTE TABS
// ============================================================

export const GerenteTabs = () => {
  console.warn('[TabNav] Rendering GERENTE tabs');
  return (
  <Tab.Navigator screenOptions={getTabBarOptions}>
    <Tab.Screen
      name="DashboardTab"
      component={DashboardGerenteScreen}
      options={{
        title: 'Dashboard',
        headerTitle: 'Panel de Control',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="stats-chart-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="OfertasTab"
      component={OfertasGerenteScreen}
      options={{
        title: 'Ofertas',
        headerTitle: 'Ofertas de Pasantía',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="briefcase-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="InscripcionesTab"
      component={InscripcionesScreen}
      options={{
        title: 'Inscripciones',
        headerTitle: 'Gestión de Inscripciones',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="document-text-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="NotificacionesTab"
      component={NotificacionesGerenteScreen}
      options={{
        title: 'Alertas',
        headerTitle: 'Notificaciones',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="notifications-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="PerfilTab"
      component={PerfilScreen}
      options={{
        title: 'Perfil',
        headerTitle: 'Mi Perfil',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="person-outline" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
  );
};

// Default export for backward compatibility (Pasante)
export default PasanteTabs;
