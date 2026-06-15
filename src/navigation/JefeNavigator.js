/**
 * JefeNavigator - Stack navigator para el rol Jefe de Pasante
 *
 * Flujo de navegación:
 * - Dashboard (inicio)
 * - Actividades (con tabs internos: Disponibles, En Progreso, Completadas)
 * - ActividadDetail
 * - Pasantes → PasanteDetail
 * - Observacion (formulario)
 * - Notificaciones
 *
 * El TabNavigator se renderiza como pantalla "home" del stack.
 *
 * @module navigation/JefeNavigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../theme';

// Screens
import DashboardScreen from '../screens/jefe/DashboardScreen';
import ActividadesScreen from '../screens/jefe/ActividadesScreen';
import ActividadDetailScreen from '../screens/jefe/ActividadDetailScreen';
import PasantesScreen from '../screens/jefe/PasantesScreen';
import PasanteDetailScreen from '../screens/jefe/PasanteDetailScreen';
import ObservacionScreen from '../screens/jefe/ObservacionScreen';
import NotificacionesScreen from '../screens/jefe/NotificacionesScreen';
import MensajesScreen from '../screens/jefe/MensajesScreen';
import NuevoChatScreen from '../screens/jefe/NuevoChatScreen';
import ChatScreen from '../screens/jefe/ChatScreen';

// Tab Navigator
import { JefeTabs } from './TabNavigator';

const Stack = createNativeStackNavigator();

/**
 * Common screen options for consistent header styling
 */
const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: colors.primary,
  },
  headerTintColor: colors.white,
  headerTitleStyle: {
    fontWeight: typography.bold,
    fontSize: typography.lg,
  },
  headerBackTitleVisible: false,
  animation: 'slide_from_right',
};

const JefeNavigator = () => {
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      {/* Home - Tab Navigator */}
      <Stack.Screen
        name="MainTabs"
        component={JefeTabs}
        options={{ headerShown: false }}
      />

      {/* Actividades - already has internal tabs (Disponibles, En Progreso, Completadas) */}
      <Stack.Screen
        name="Actividades"
        component={ActividadesScreen}
        options={{ title: 'Gestión de Actividades' }}
      />
      <Stack.Screen
        name="ActividadDetail"
        component={ActividadDetailScreen}
        options={{ title: 'Detalle de Actividad' }}
      />

      {/* Pasantes */}
      <Stack.Screen
        name="Pasantes"
        component={PasantesScreen}
        options={{ title: 'Mis Pasantes' }}
      />
      <Stack.Screen
        name="PasanteDetail"
        component={PasanteDetailScreen}
        options={{ title: 'Detalle de Pasante' }}
      />

      {/* Observacion */}
      <Stack.Screen
        name="Observacion"
        component={ObservacionScreen}
        options={{ title: 'Registrar Observación' }}
      />

      {/* Notificaciones */}
      <Stack.Screen
        name="Notificaciones"
        component={NotificacionesScreen}
        options={{ title: 'Notificaciones' }}
      />

      {/* Mensajes */}
      <Stack.Screen
        name="Mensajes"
        component={MensajesScreen}
        options={{ title: 'Conversaciones' }}
      />
      <Stack.Screen
        name="NuevoChat"
        component={NuevoChatScreen}
        options={{ title: 'Nuevo chat' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params?.pasanteName || 'Chat' })}
      />
    </Stack.Navigator>
  );
};

export default JefeNavigator;
