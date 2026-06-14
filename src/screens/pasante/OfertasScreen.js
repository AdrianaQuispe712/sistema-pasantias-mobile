/**
 * OfertasScreen - Pantalla de ofertas de pasantía disponibles
 *
 * Muestra todas las ofertas disponibles para el pasante con:
 * - Tarjetas con información de la empresa, título, modalidad y vacantes
 * - Barra de búsqueda y filtros
 * - Pull-to-refresh
 * - Navegación al detalle de la oferta
 * - Botón de "Postularse"
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Button, Card, Header, Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { getOfertas } from '../../api/ofertas';

const OfertasScreen = () => {
  const navigation = useNavigation();

  // States
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState('Todas');

  // Modalidades disponibles para filtro
  const modalidades = ['Todas', 'Presencial', 'Remoto', 'Híbrido'];

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

  /**
   * Pull-to-refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOfertas();
  }, [fetchOfertas]);

  /**
   * Filtrado de ofertas por búsqueda y modalidad
   */
  const filteredOfertas = useMemo(() => {
    let result = ofertas;

    // Filtro por modalidad
    if (selectedModality !== 'Todas') {
      result = result.filter(
        (o) => o.modalidad?.toLowerCase() === selectedModality.toLowerCase()
      );
    }

    // Filtro por búsqueda de texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.titulo?.toLowerCase().includes(query) ||
          o.empresa?.nombre?.toLowerCase().includes(query) ||
          o.descripcion?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [ofertas, searchQuery, selectedModality]);

  /**
   * Navega al detalle de una oferta
   */
  const handleOfertaPress = useCallback(
    (oferta) => {
      navigation.navigate('OfertaDetail', { ofertaId: oferta.id });
    },
    [navigation]
  );

  /**
   * Navega a postularse a una oferta
   */
  const handlePostularse = useCallback(
    (oferta) => {
      navigation.navigate('OfertaDetail', {
        ofertaId: oferta.id,
        showPostular: true,
      });
    },
    [navigation]
  );

  /**
   * Renderiza un ítem de oferta
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
              <Badge
                variant="info"
                size="sm"
                label={oferta.modalidad}
              />
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
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaText}>{oferta.ubicacion}</Text>
              </View>
            )}
            {oferta.vacantes && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>👥</Text>
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
            title="Postularse"
            onPress={() => handlePostularse(oferta)}
            rightIcon={<Text style={styles.arrowIcon}>→</Text>}
          />
        </View>
      </Card>
    ),
    [handleOfertaPress, handlePostularse]
  );

  /**
   * Renderiza el separador entre elementos
   */
  const ItemSeparator = () => <View style={styles.separator} />;

  /**
   * Renderiza el header de la lista con barra de búsqueda y filtros
   */
  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ofertas..."
          placeholderTextColor={colors.grayLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearch}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros de modalidad */}
      <FlatList
        data={modalidades}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filtersContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
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
        )}
      />

      {/* Contador de resultados */}
      <Text style={styles.resultsCount}>
        {filteredOfertas.length}{' '}
        {filteredOfertas.length === 1 ? 'oferta encontrada' : 'ofertas encontradas'}
      </Text>
    </View>
  );

  /**
   * Renderiza el estado vacío
   */
  const renderEmpty = () => {
    if (loading) return null;

    return (
      <EmptyState
        icon={<Text style={styles.emptyIcon}>📋</Text>}
        title="No hay ofertas disponibles"
        subtitle={
          searchQuery || selectedModality !== 'Todas'
            ? 'No se encontraron ofertas con los filtros aplicados.'
            : 'Actualmente no hay ofertas de pasantía disponibles.'
        }
        actionLabel="Limpiar filtros"
        onAction={() => {
          setSearchQuery('');
          setSelectedModality('Todas');
        }}
      />
    );
  };

  // Estado de carga inicial
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header
          title="Ofertas"
          subtitle="Pasantías disponibles"
        />
        <LoadingSpinner fullScreen message="Cargando ofertas..." />
      </View>
    );
  }

  // Estado de error
  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header
          title="Ofertas"
          subtitle="Pasantías disponibles"
        />
        <EmptyState
          icon={<Text style={styles.emptyIcon}>⚠️</Text>}
          title="Error al cargar"
          subtitle={error}
          actionLabel="Reintentar"
          onAction={fetchOfertas}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Ofertas"
        subtitle={`${filteredOfertas.length} disponibles`}
      />

      <FlatList
        data={filteredOfertas}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOfertaItem}
        ListHeaderComponent={ListHeader}
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
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  // Búsqueda
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
  // Filtros
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
  // Resultados
  resultsCount: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Tarjeta de oferta
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
