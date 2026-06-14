/**
 * PasanteNavigator - Stack navigator para el rol Pasante
 *
 * Flujo de navegación:
 * - Dashboard (inicio)
 * - Ofertas → OfertaDetail
 * - Actividades → ActividadDetail
 * - Bitacora (formulario)
 * - Calendario
 * - Notificaciones
 * - Evidencia
 *
 * El TabNavigator se renderiza como pantalla "home" del stack.
 * Desde ahí se accede a las pantallas secundarias.
 *
 * @module navigation/PasanteNavigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../theme';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import OfertasScreen from '../screens/pasante/OfertasScreen';
import OfertaDetailScreen from '../screens/pasante/OfertaDetailScreen';
import ActividadesScreen from '../screens/pasante/ActividadesScreen';
import ActividadDetailScreen from '../screens/pasante/ActividadDetailScreen';
import BitacoraScreen from '../screens/pasante/BitacoraScreen';
import CalendarioScreen from '../screens/pasante/CalendarioScreen';
import NotificacionesScreen from '../screens/pasante/NotificacionesScreen';
import EvidenciaScreen from '../screens/pasante/EvidenciaScreen';

// Tab Navigator
import { PasanteTabs } from './TabNavigator';

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

const PasanteNavigator = () => {
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      {/* Home - Tab Navigator */}
      <Stack.Screen
        name="MainTabs"
        component={PasanteTabs}
        options={{ headerShown: false }}
      />

      {/* Ofertas */}
      <Stack.Screen
        name="Ofertas"
        component={OfertasScreen}
        options={{ title: 'Ofertas de Pasantía' }}
      />
      <Stack.Screen
        name="OfertaDetail"
        component={OfertaDetailScreen}
        options={{ title: 'Detalle de Oferta' }}
      />

      {/* Actividades */}
      <Stack.Screen
        name="Actividades"
        component={ActividadesScreen}
        options={{ title: 'Mis Actividades' }}
      />
      <Stack.Screen
        name="ActividadDetail"
        component={ActividadDetailScreen}
        options={{ title: 'Detalle de Actividad' }}
      />

      {/* Bitacora */}
      <Stack.Screen
        name="Bitacora"
        component={BitacoraScreen}
        options={{ title: 'Registrar Bitácora' }}
      />

      {/* Calendario */}
      <Stack.Screen
        name="Calendario"
        component={CalendarioScreen}
        options={{ title: 'Calendario' }}
      />

      {/* Notificaciones */}
      <Stack.Screen
        name="Notificaciones"
        component={NotificacionesScreen}
        options={{ title: 'Notificaciones' }}
      />

      {/* Evidencia */}
      <Stack.Screen
        name="Evidencia"
        component={EvidenciaScreen}
        options={{ title: 'Subir Evidencia' }}
      />
    </Stack.Navigator>
  );
};

export default PasanteNavigator;
