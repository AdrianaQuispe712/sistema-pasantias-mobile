/**
 * GerenteNavigator - Stack navigator para el rol Gerente
 *
 * Flujo de navegación:
 * - Dashboard (inicio)
 * - Ofertas → OfertaDetail
 * - Inscripciones → InscripcionDetail
 * - Notificaciones
 *
 * El TabNavigator se renderiza como pantalla "home" del stack.
 *
 * @module navigation/GerenteNavigator
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../theme';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import OfertasScreen from '../screens/gerente/OfertasScreen';
import OfertaDetailScreen from '../screens/gerente/OfertaDetailScreen';
import OfertaFormScreen from '../screens/gerente/OfertaFormScreen';
import InscripcionesScreen from '../screens/gerente/InscripcionesScreen';
import InscripcionDetailScreen from '../screens/gerente/InscripcionDetailScreen';
import NotificacionesScreen from '../screens/gerente/NotificacionesScreen';
import EmpresaScreen from '../screens/gerente/EmpresaScreen';

// Tab Navigator
import { GerenteTabs } from './TabNavigator';

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

const GerenteNavigator = () => {
  return (
    <Stack.Navigator screenOptions={defaultScreenOptions}>
      {/* Home - Tab Navigator */}
      <Stack.Screen
        name="MainTabs"
        component={GerenteTabs}
        options={{ headerShown: false }}
      />

      {/* Ofertas */}
      <Stack.Screen
        name="Ofertas"
        component={OfertasScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OfertaDetail"
        component={OfertaDetailScreen}
        options={{ title: 'Detalle de Oferta' }}
      />
      <Stack.Screen
        name="OfertaForm"
        component={OfertaFormScreen}
        options={({ route }) => ({
          title: route?.params?.ofertaId ? 'Editar Oferta' : 'Nueva Oferta',
        })}
      />

      {/* Inscripciones */}
      <Stack.Screen
        name="Inscripciones"
        component={InscripcionesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InscripcionDetail"
        component={InscripcionDetailScreen}
        options={{ title: 'Detalle de Inscripción' }}
      />

      {/* Notificaciones */}
      <Stack.Screen
        name="Notificaciones"
        component={NotificacionesScreen}
        options={{ headerShown: false }}
      />

      {/* Empresa */}
      <Stack.Screen
        name="Empresa"
        component={EmpresaScreen}
        options={{ title: 'Información Empresarial' }}
      />
    </Stack.Navigator>
  );
};

export default GerenteNavigator;
