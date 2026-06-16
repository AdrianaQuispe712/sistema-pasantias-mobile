/**
 * CalendarioScreen - Vista de calendario con actividades
 *
 * Muestra un calendario con:
 * - Vista mensual de actividades con fechas límite
 * - Color-coding por estado
 * - Tap en fecha para ver actividades del día
 * - Lista de próximos vencimientos
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Card, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { getCalendario } from '../../api/calendario';
import { formatDate } from '../../utils/dateUtils';

const CalendarioScreen = () => {
  const navigation = useNavigation();

  // States
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Nombres de meses en español
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  // Nombres de días abreviados
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  /**
   * Carga los eventos del calendario
   */
  const fetchCalendario = useCallback(async () => {
    try {
      setError(null);
      const data = await getCalendario();
      setEventos(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error al cargar calendario:', err);
      setError('No se pudieron cargar los eventos del calendario.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchCalendario();
  }, [fetchCalendario]);

  /**
   * Pull-to-refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCalendario();
  }, [fetchCalendario]);

  /**
   * Navega al mes anterior
   */
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  /**
   * Navega al mes siguiente
   */
  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  /**
   * Calcula los días del mes actual
   */
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();

    // Ajusta el día de inicio (lunes = 0)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days = [];

    // Días vacíos al inicio
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, key: `empty-${i}` });
    }

    // Días del mes
    for (let day = 1; day <= daysCount; day++) {
      days.push({
        day,
        date: new Date(year, month, day),
        key: `${year}-${month}-${day}`,
      });
    }

    return days;
  }, [currentMonth]);

  /**
   * Obtiene los eventos de una fecha específica
   *
   * Normaliza todas las fechas a YYYY-MM-DD para comparación
   * confiable, ya que el backend puede devolver ISO timestamp,
   * string de fecha, o formatos mixtos.
   */
  const getEventsForDate = useCallback(
    (date) => {
      if (!date) return [];

      // Helper: normaliza cualquier formato de fecha a YYYY-MM-DD usando hora LOCAL
      const toDateStr = (value) => {
        if (!value) return null;
        try {
          const d = new Date(value);
          if (isNaN(d.getTime())) return null;
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch {
          return null;
        }
      };

      const dateStr = toDateStr(date);
      if (!dateStr) return [];

      return eventos.filter((evento) => {
        const ini = toDateStr(evento.fechaInicio || evento.fecha_inicio);
        const fin = toDateStr(evento.fechaFin || evento.fecha_fin);

        // Si tiene rango (inicio y fin), verificar que la fecha esté dentro
        if (ini && fin) {
          return dateStr >= ini && dateStr <= fin;
        }
        // Si solo tiene inicio o fin, coincidencia exacta
        if (ini) return dateStr === ini;
        if (fin) return dateStr === fin;
        return false;
      });
    },
    [eventos]
  );

  /**
   * Verifica si una actividad ya venció (fecha pasada y no completada)
   */
  const isOverdue = useCallback((evento) => {
    const fechaFin = evento.fechaFin || evento.fecha_fin;
    if (!fechaFin) return false;
    const endDate = new Date(fechaFin);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const estado = evento.estado?.toLowerCase();
    return endDate < today && estado !== 'completada';
  }, []);

  /**
   * Determina el variant del Badge según estado y fecha
   *
   * Reglas (misma lógica que ActividadesScreen):
   * 1. Si la fecha pasó → error (rojo), sin importar el estado
   * 2. completada → success (verde)
   * 3. en_progreso → orange (naranja)
   * 4. pendiente → warning (amarillo)
   */
  const getStatusVariant = useCallback(
    (evento) => {
      // Si la fecha pasó → rojo
      if (isOverdue(evento)) return 'error';

      switch (evento.estado?.toLowerCase()) {
        case 'completada':
          return 'info';
        case 'en_progreso':
        case 'en progreso':
          return 'orange';
        case 'pendiente':
          return 'warning';
        default:
          return 'neutral';
      }
    },
    [isOverdue]
  );

  /**
   * Label legible para el badge (el nombre del estado)
   */
  const getStatusLabel = useCallback((evento) => {
    switch (evento.estado?.toLowerCase()) {
      case 'completada':
        return 'Completada';
      case 'en_progreso':
      case 'en progreso':
        return 'En progreso';
      case 'pendiente':
        return 'Pendiente';
      default:
        return evento.estado?.replace('_', ' ') || 'Sin estado';
    }
  }, []);

  /**
   * Obtiene el color de fondo para una fecha según sus eventos
   *
   * Prioridad: rojo > naranja > amarillo > verde
   */
  const getDateBackgroundColor = useCallback(
    (date) => {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length === 0) return 'transparent';

      const variantColors = {
        error: colors.errorLight,
        orange: colors.orangeLight,
        warning: colors.warningLight,
        info: colors.infoLight,
        neutral: colors.grayBackground,
      };

      // Prioridad: error > orange > warning > info
      const priority = ['error', 'orange', 'warning', 'info', 'neutral'];
      for (const v of priority) {
        if (dayEvents.some((e) => getStatusVariant(e) === v)) {
          return variantColors[v];
        }
      }
      return 'transparent';
    },
    [getEventsForDate, getStatusVariant]
  );

  /**
   * Obtiene el color del punto indicador para una fecha
   */
  const getEventDotColor = useCallback(
    (date) => {
      const dayEvents = getEventsForDate(date);
      if (dayEvents.length === 0) return 'transparent';

      const variantDots = {
        error: colors.error,
        orange: colors.orange,
        warning: colors.warning,
        info: colors.info,
        neutral: colors.grayMedium,
      };

      const priority = ['error', 'orange', 'warning', 'info', 'neutral'];
      for (const v of priority) {
        if (dayEvents.some((e) => getStatusVariant(e) === v)) {
          return variantDots[v];
        }
      }
      return 'transparent';
    },
    [getEventsForDate, getStatusVariant]
  );

  /**
   * Renderiza el calendario mensual
   */
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    return (
      <View style={styles.calendarContainer}>
        {/* Header del mes */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
            <Text style={styles.monthButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {monthNames[month]} {year}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
            <Text style={styles.monthButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Días de la semana */}
        <View style={styles.weekDaysRow}>
          {dayNames.map((day) => (
            <View key={day} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Días del mes */}
        <View style={styles.daysGrid}>
          {daysInMonth.map((dayObj) => {
            if (!dayObj.day) {
              return <View key={dayObj.key} style={styles.dayCell} />;
            }

            const isToday =
              dayObj.date.toDateString() === new Date().toDateString();
            const isSelected =
              selectedDate &&
              dayObj.date.toDateString() === selectedDate.toDateString();
            const hasEvents = getEventsForDate(dayObj.date).length > 0;
            const bgColor = getDateBackgroundColor(dayObj.date);
            const dotColor = getEventDotColor(dayObj.date);

            return (
              <TouchableOpacity
                key={dayObj.key}
                style={[
                  styles.dayCell,
                  isToday && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                  hasEvents && { backgroundColor: bgColor },
                ]}
                onPress={() => setSelectedDate(dayObj.date)}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday && styles.dayTextToday,
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {dayObj.day}
                </Text>
                {hasEvents && <View style={[styles.eventDot, { backgroundColor: dotColor }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  /**
   * Renderiza la lista de eventos de la fecha seleccionada
   */
  const renderSelectedDateEvents = () => {
    if (!selectedDate) return null;

    const dayEvents = getEventsForDate(selectedDate);
    const dateStr = selectedDate.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <View style={styles.selectedDateContainer}>
        <Text style={styles.selectedDateTitle}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} /> {dateStr}
        </Text>

        {dayEvents.length === 0 ? (
          <Text style={styles.noEventsText}>Sin eventos programados</Text>
        ) : (
          dayEvents.map((evento, idx) => (
            <Card
              key={evento.id || evento.actividadId || evento.actividad_id || `evt-${idx}`}
              variant="outlined"
              style={styles.eventCard}
              onPress={() =>
                navigation.navigate('ActividadDetail', {
                  actividadId: evento.actividadId || evento.actividad_id || evento.id,
                  fromCalendar: true,
                })
              }
            >
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {evento.titulo || evento.nombre || 'Evento'}
                </Text>
                <Badge
                  variant={getStatusVariant(evento)}
                  size="sm"
                  label={getStatusLabel(evento)}
                />
              </View>
              {evento.descripcion && (
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {evento.descripcion}
                </Text>
              )}
            </Card>
          ))
        )}
      </View>
    );
  };

  /**
   * Renderiza los próximos vencimientos
   */
  const renderUpcomingDeadlines = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = eventos
      .filter((evento) => {
        const fechaFin = evento.fechaFin || evento.fecha_fin;
        if (!fechaFin) return false;
        const endDate = new Date(fechaFin);
        return endDate >= today && evento.estado?.toLowerCase() !== 'completada';
      })
      .sort((a, b) => {
        const dateA = new Date(a.fechaFin || a.fecha_fin);
        const dateB = new Date(b.fechaFin || b.fecha_fin);
        return dateA - dateB;
      })
      .slice(0, 5);

    if (upcoming.length === 0) return null;

    return (
      <View style={styles.upcomingContainer}>
        <Text style={styles.upcomingTitle}>Próximos vencimientos</Text>
        {upcoming.map((evento, idx) => (
          <Card
            key={evento.id || evento.actividadId || evento.actividad_id || `upc-${idx}`}
            variant="outlined"
            style={styles.upcomingCard}
            onPress={() =>
              navigation.navigate('ActividadDetail', {
                actividadId: evento.actividadId || evento.actividad_id || evento.id,
                fromCalendar: true,
              })
            }
          >
            <View style={styles.upcomingItem}>
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingName} numberOfLines={1}>
                  {evento.titulo || evento.nombre || 'Actividad'}
                </Text>
                <Text style={styles.upcomingDate}>
                  Vence: {formatDate(evento.fechaFin || evento.fecha_fin)}
                </Text>
              </View>
              <Badge
                variant={getStatusVariant(evento)}
                size="sm"
                label={getStatusLabel(evento)}
              />
            </View>
          </Card>
        ))}
      </View>
    );
  };

  // Estado de carga
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <LoadingSpinner fullScreen message="Cargando calendario..." />
      </View>
    );
  }

  // Estado de error
  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Ionicons name="alert-circle" size={48} color={colors.error} />}
          title="Error al cargar"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={fetchCalendario}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[{ key: 'calendar' }]}
        keyExtractor={(item) => item.key}
        renderItem={() => (
          <View>
            {/* Calendario */}
            {renderCalendar()}

            {/* Eventos de la fecha seleccionada */}
            {renderSelectedDateEvents()}

            {/* Próximos vencimientos */}
            {renderUpcomingDeadlines()}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  // Calendario
  calendarContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grayBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  monthTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  // Días de la semana
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.grayMedium,
  },
  // Grid de días
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    position: 'relative',
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: typography.sm,
    color: colors.text,
  },
  dayTextToday: {
    fontWeight: typography.bold,
    color: colors.primary,
  },
  dayTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: typography.bold,
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
  },
  // Fecha seleccionada
  selectedDateContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  selectedDateTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.primary,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
  },
  noEventsText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  eventCard: {
    marginBottom: spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  eventDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.normal,
  },
  // Próximos vencimientos
  upcomingContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  upcomingTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  upcomingCard: {
    marginBottom: spacing.sm,
  },
  upcomingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  upcomingName: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  upcomingDate: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  emptyIcon: {
    fontSize: 48,
  },
});

export default CalendarioScreen;
