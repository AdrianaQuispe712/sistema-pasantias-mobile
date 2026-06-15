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

import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography } from '../theme';
import { getUnreadCount as getGerenteUnreadCount } from '../api/gerenteNotificaciones';
import { getUnreadCount as getPasanteUnreadCount } from '../api/notificaciones';
import { getConversaciones as getJefeConversaciones } from '../api/jefeMensajeria';
import { getMias as getJefeMias, getCompletadas as getJefeCompletadas } from '../api/jefeActividades';

const STORAGE_KEY_COMPLETED = '@jefe_completed_activities';
const STORAGE_KEY_DISMISSED = '@jefe_dismissed_notifs';
const STORAGE_KEY_VIEWED = '@jefe_viewed_delayed';

// Pasante Screens
import OfertasPasanteScreen from '../screens/pasante/OfertasScreen';
import ActividadesPasanteScreen from '../screens/pasante/ActividadesScreen';
import CalendarioScreen from '../screens/pasante/CalendarioScreen';
import MensajesPasanteScreen from '../screens/pasante/MensajesScreen';
import NotificacionesPasanteScreen from '../screens/pasante/NotificacionesScreen';

// Jefe Screens
import DashboardJefeScreen from '../screens/jefe/DashboardScreen';
import ActividadesJefeScreen from '../screens/jefe/ActividadesScreen';
import PasantesScreen from '../screens/jefe/PasantesScreen';
import MensajesJefeScreen from '../screens/jefe/MensajesScreen';
import NotificacionesJefeScreen from '../screens/jefe/NotificacionesScreen';

// Gerente Screens
import DashboardGerenteScreen from '../screens/gerente/DashboardScreen';
import OfertasGerenteScreen from '../screens/gerente/OfertasScreen';
import InscripcionesScreen from '../screens/gerente/InscripcionesScreen';
import EmpresaGerenteScreen from '../screens/gerente/EmpresaScreen';
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
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await getPasanteUnreadCount();
      setUnreadCount(data?.unreadCount || 0);
    } catch (err) {
      // Silent fail
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }, [fetchUnreadCount])
  );

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
      name="MensajesTab"
      component={MensajesPasanteScreen}
      options={{
        title: 'Mensajes',
        headerTitle: 'Conversaciones',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="chatbubbles-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="NotificacionesTab"
      component={NotificacionesPasanteScreen}
      options={{
        title: 'Alertas',
        headerTitle: 'Notificaciones',
        tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
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

export const JefeTabs = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      // Fetch all sources in parallel
      const [conversaciones, actividadesMias, actividadesCompletadas, dismissedIds, viewedIds] = await Promise.all([
        getJefeConversaciones().catch(() => ({ conversaciones: [] })),
        getJefeMias().catch(() => ({ data: [] })),
        getJefeCompletadas().catch(() => ({ data: [] })),
        AsyncStorage.getItem(STORAGE_KEY_DISMISSED).then((s) => (s ? JSON.parse(s) : [])).catch(() => []),
        AsyncStorage.getItem(STORAGE_KEY_VIEWED).then((s) => (s ? JSON.parse(s) : [])).catch(() => []),
      ]);

      const dismissedSet = new Set(dismissedIds);
      const viewedSet = new Set(viewedIds);
      const convs = conversaciones?.conversaciones || [];
      const mias = Array.isArray(actividadesMias) ? actividadesMias : actividadesMias?.data || [];
      const completadas = Array.isArray(actividadesCompletadas)
        ? actividadesCompletadas
        : actividadesCompletadas?.data || [];

      let count = 0;

      // 1. Unread messages — por conversación
      for (const conv of convs) {
        const unread = conv.unread_count || 0;
        if (unread === 0) continue;
        const msgId = `msg-${conv.id}`;
        if (dismissedSet.has(msgId)) {
          // Ya descartada — ¿hay mensajes NUEVOS?
          let lastSeenCount = 0;
          try {
            const stored = await AsyncStorage.getItem(`@jefe_msg_seen_${conv.id}`);
            if (stored) lastSeenCount = parseInt(stored, 10) || 0;
          } catch {}
          if (unread <= lastSeenCount) continue; // sin novedades
          count += unread - lastSeenCount; // solo los nuevos
        } else {
          count += unread;
        }
      }

      // 2. Delayed activities — excluir las ya vistas
      const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const dateOnly = String(dateStr).split('T')[0].split(' ')[0];
        const parts = dateOnly.split('-');
        if (parts.length !== 3) return new Date(dateStr);
        const [year, month, day] = parts.map(Number);
        return new Date(year, month - 1, day, 23, 59, 59);
      };
      const now = new Date();
      const delayed = mias.filter((a) => {
        const fechaLimite = a.fecha_limite || a.fechaLimite;
        if (!fechaLimite) return false;
        return parseLocalDate(fechaLimite) < now;
      });
      for (const act of delayed) {
        const actId = act.id || act.idActividad;
        if (!viewedSet.has(`delayed-${actId}`)) {
          count++;
        }
      }

      // 3. Newly completed activities (exclude dismissed)
      const currentCompletedIds = completadas.map((a) => String(a.id || a.idActividad)).sort();
      let prevCompletedIds = [];
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_COMPLETED);
        if (stored) prevCompletedIds = JSON.parse(stored);
      } catch {}
      const prevSet = new Set(prevCompletedIds);
      count += completadas.filter((a) => {
        const actId = String(a.id || a.idActividad);
        if (prevSet.has(actId)) return false;
        if (dismissedSet.has(`completed-${actId}`)) return false;
        return true;
      }).length;

      setUnreadCount(count);
    } catch (err) {
      // Silent fail
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }, [fetchUnreadCount])
  );

  return (
  <Tab.Navigator screenOptions={getTabBarOptions}>
    <Tab.Screen
      name="DashboardTab"
      component={DashboardJefeScreen}
      options={{
        title: 'Dashboard',
        headerTitle: 'Panel de Control',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="stats-chart-outline" size={size} color={color} />
        ),
      }}
    />
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
      name="MensajesTab"
      component={MensajesJefeScreen}
      options={{
        title: 'Mensajes',
        headerTitle: 'Conversaciones',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="chatbubbles-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="NotificacionesTab"
      component={NotificacionesJefeScreen}
      options={{
        title: 'Alertas',
        headerTitle: 'Notificaciones',
        tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
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
// GERENTE TABS
// ============================================================

export const GerenteTabs = () => {
  console.warn('[TabNav] Rendering GERENTE tabs');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await getGerenteUnreadCount();
      setUnreadCount(data?.unreadCount || 0);
    } catch (err) {
      // Silent fail — badge is non-critical
    }
  }, []);

  // Refresh count when this tab group gains focus
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      // Poll every 30 seconds while focused
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }, [fetchUnreadCount])
  );

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
      name="EmpresaTab"
      component={EmpresaGerenteScreen}
      options={{
        title: 'Empresa',
        headerTitle: 'Información Empresarial',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="business-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="NotificacionesTab"
      component={NotificacionesGerenteScreen}
      options={{
        title: 'Alertas',
        headerTitle: 'Notificaciones',
        tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
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
