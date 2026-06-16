/**
 * OfertasScreen - Pantalla de ofertas de pasantía disponibles
 *
 * Muestra todas las ofertas disponibles para el pasante con:
 * - Tarjetas con información de la empresa, título, modalidad y vacantes
 * - Barra de búsqueda por empresa (filtrado incremental)
 * - Filtros de modalidad
 * - Pull-to-refresh
 * - Navegación al detalle de la oferta
 * - Botón de "Postularse"
 *
 * IMPORTANTE: La barra de búsqueda está FUERA del FlatList para que
 * el TextInput NO se desmonte al filtrar. Si estuviera como
 * ListHeaderComponent, cada cambio de searchQuery recrea el header
 * y el teclado se cierra.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Button, Card, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { getOfertas } from '../../api/ofertas';

/**
 * Retorna la variante del Badge según la modalidad de la oferta
 */
const getModalidadVariant = (modalidad) => {
  switch (modalidad?.toLowerCase()) {
    case 'presencial':
      return 'presencial';
    case 'remoto':
      return 'remoto';
    case 'híbrido':
    case 'hibrido':
      return 'hibrido';
    default:
      return 'neutral';
  }
};

const OfertasScreen = () => {
  const navigation = useNavigation();

  // ── States ──────────────────────────────────────────────
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState('Todas');

  // Modalidades disponibles para filtro
  const modalidades = ['Todas', 'Presencial', 'Remoto', 'Híbrido'];

  // ── API ──────────────────────────────────────────────────

  /**
   * Carga las ofertas desde la API
   */
  const fetchOfertas = useCallback(async () => {
    try {
      setError(null);
      const data = await getOfertas();
      setOfertas(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error al cargar ofertas:', err);
      setError('No se pudieron cargar las ofertas. Intente nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchOfertas();
  }, [fetchOfertas]);

  // ── Pull-to-refresh ─────────────────────────────────────

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOfertas();
  }, [fetchOfertas]);

  // ── Filtrado incremental ────────────────────────────────
  //
  // Se filtra por EMPRESA como criterio principal.
  // También matchea título como secundario para ayudar cuando
  // el usuario busca por nombre de cargo.

  const filteredOfertas = useMemo(() => {
    let result = ofertas;

    // Filtro por modalidad
    if (selectedModality !== 'Todas') {
      result = result.filter(
        (o) => o.modalidad?.toLowerCase() === selectedModality.toLowerCase()
      );
    }

    // Filtro por búsqueda de texto (empresa como prioridad)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        // Empresa es el criterio principal
        const nombreEmpresa = o.empresa?.nombre?.toLowerCase() || '';
        if (nombreEmpresa.includes(query)) return true;

        // Secundario: título y descripción
        const titulo = o.titulo?.toLowerCase() || '';
        if (titulo.includes(query)) return true;

        const descripcion = o.descripcion?.toLowerCase() || '';
        if (descripcion.includes(query)) return true;

        return false;
      });
    }

    return result;
  }, [ofertas, searchQuery, selectedModality]);

  // ── Navegación ──────────────────────────────────────────

  const handleOfertaPress = useCallback(
    (oferta) => {
      navigation.navigate('OfertaDetail', { ofertaId: oferta.id });
    },
    [navigation]
  );

  const handlePostularse = useCallback(
    (oferta) => {
      navigation.navigate('OfertaDetail', {
        ofertaId: oferta.id,
        showPostular: true,
      });
    },
    [navigation]
  );

  // ── Limpiar filtros ─────────────────────────────────────

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedModality('Todas');
  }, []);

  // ── Renderers ───────────────────────────────────────────

  /**
   * Tarjeta de oferta individual
   */
  const renderOfertaItem = useCallback(
    ({ item: oferta }) => (
      <Card
        variant="default"
        padding="none"
        onPress={() => handleOfertaPress(oferta)}
        style={styles.ofertaCard}
      >
        {/* Header de la oferta */}
        <View style={styles.ofertaHeader}>
          <View style={styles.empresaInfo}>
            <Text style={styles.empresaNombre}>
              {oferta.empresa?.nombre || 'Empresa'}
            </Text>
            {oferta.modalidad && (
              <Badge variant={getModalidadVariant(oferta.modalidad)} size="sm" label={oferta.modalidad} />
            )}
          </View>
        </View>

        {/* Contenido de la oferta */}
        <View style={styles.ofertaContent}>
          <Text style={styles.ofertaTitulo} numberOfLines={2}>
            {oferta.titulo || 'Sin título'}
          </Text>

          {oferta.descripcion && (
            <Text style={styles.ofertaDescripcion} numberOfLines={2}>
              {oferta.descripcion}
            </Text>
          )}

          <View style={styles.ofertaMeta}>
            {oferta.ubicacion && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={colors.grayMedium} />
                <Text style={styles.metaText}>{oferta.ubicacion}</Text>
              </View>
            )}
            {oferta.vacantes && (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color={colors.grayMedium} />
                <Text style={styles.metaText}>
                  {oferta.vacantes} {oferta.vacantes === 1 ? 'vacante' : 'vacantes'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer con botón de postulación */}
        <View style={styles.ofertaFooter}>
          <Button
            variant="primary"
            size="sm"
            title="Inscribirse"
            onPress={() => handlePostularse(oferta)}
            rightIcon={<Text style={styles.arrowIcon}>→</Text>}
          />
        </View>
      </Card>
    ),
    [handleOfertaPress, handlePostularse]
  );

  /**
   * Estado vacío de la lista
   */
  const renderEmpty = useCallback(() => {
    if (loading) return null;

    return (
      <EmptyState
        icon={<Ionicons name="clipboard-outline" size={48} color={colors.grayMedium} />}
        title="No hay ofertas disponibles"
        subtitle={
          searchQuery || selectedModality !== 'Todas'
            ? 'No se encontraron ofertas con los filtros aplicados.'
            : 'Actualmente no hay ofertas de pasantía disponibles.'
        }
        actionLabel="Limpiar filtros"
        onAction={handleClearFilters}
      />
    );
  }, [loading, searchQuery, selectedModality, handleClearFilters]);

  /**
   * Separador entre tarjetas
   */
  const ItemSeparator = useCallback(() => <View style={styles.separator} />, []);

  // ── Estados de carga / error ────────────────────────────

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <LoadingSpinner fullScreen message="Cargando ofertas..." />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Ionicons name="alert-circle" size={48} color={colors.error} />}
          title="Error al cargar"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={fetchOfertas}
        />
      </View>
    );
  }

  // ── Render principal ────────────────────────────────────
  //
  // ARQUITECTURA: La barra de búsqueda vive FUERA del FlatList.
  // Esto es CRÍTICO para que el teclado no se cierre al escribir.
  // Si estuviera como ListHeaderComponent, cada keystroke recrea
  // el componente y el TextInput pierde el foco.

  return (
    <View style={styles.container}>
      {/* ═══ Cabecera fija de búsqueda y filtros ═══ */}
      <View style={styles.fixedHeader}>
        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por empresa..."
            placeholderTextColor={colors.grayLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearch}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-outline" size={16} color={colors.grayMedium} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros de modalidad (ScrollView horizontal, NO FlatList anidado) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {modalidades.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterChip,
                selectedModality === item && styles.filterChipActive,
              ]}
              onPress={() => setSelectedModality(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedModality === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Contador de resultados */}
        <Text style={styles.resultsCount}>
          {filteredOfertas.length}{' '}
          {filteredOfertas.length === 1 ? 'oferta encontrada' : 'ofertas encontradas'}
        </Text>
      </View>

      {/* ═══ Lista de ofertas ═══ */}
      <FlatList
        data={filteredOfertas}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOfertaItem}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={ItemSeparator}
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
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  // ── Cabecera fija ──────────────────────────────────────
  fixedHeader: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  // ── Búsqueda ───────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.md,
    color: colors.text,
    paddingVertical: spacing.sm + 2,
  },
  clearSearch: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  clearSearchText: {
    fontSize: typography.md,
    color: colors.grayMedium,
    fontWeight: typography.bold,
  },
  // ── Filtros ────────────────────────────────────────────
  filtersContainer: {
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textOnPrimary,
  },
  // ── Resultados ─────────────────────────────────────────
  resultsCount: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // ── Tarjeta de oferta ─────────────────────────────────
  ofertaCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  ofertaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  empresaInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  empresaNombre: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.secondary,
  },
  ofertaContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  ofertaTitulo: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  ofertaDescripcion: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: typography.sm * typography.normal,
    marginBottom: spacing.md,
  },
  ofertaMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaIcon: {
    fontSize: typography.sm,
  },
  metaText: {
    fontSize: typography.sm,
    color: colors.grayMedium,
  },
  ofertaFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.md,
  },
  arrowIcon: {
    fontSize: typography.md,
    color: colors.textOnPrimary,
    marginLeft: spacing.xs,
  },
  separator: {
    height: spacing.xs,
  },
  emptyIcon: {
    fontSize: 48,
  },
});

export default OfertasScreen;
