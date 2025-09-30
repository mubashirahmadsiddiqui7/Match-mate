// src/screens/Fisherman/Boats/BoatsListScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import PALETTE from '../../../theme/palette';
import { getBoats, Boat } from '../../../services/boat';

export default function BoatsListScreen() {
  const navigation = useNavigation();
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'retired'>('all');

  const fetchBoats = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      const response = await getBoats(pageNum, 10);
      
      // Check if response.data.data exists and is an array (nested structure)
      if (!response || !response.data || !response.data.data || !Array.isArray(response.data.data)) {
        console.error('Invalid response format:', response);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Invalid response format from server',
        });
        return;
      }
      
      if (refresh) {
        setBoats(response.data.data);
      } else {
        setBoats(prev => [...prev, ...response.data.data]);
      }
      
      setHasMore(response.data.data.length === 10);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error fetching boats:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch boats',
      });
    }
  }, []);

  useEffect(() => {
    fetchBoats(1, true);
  }, [fetchBoats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBoats(1, true);
    setRefreshing(false);
  }, [fetchBoats]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchBoats(page + 1, false);
    }
  }, [loading, hasMore, page, fetchBoats]);

  const handleBack = () => {
    navigation.navigate('FishermanHome' as never);
  };

  const filteredBoats = boats.filter(boat => {
    const matchesSearch = search.trim() === '' || 
      boat.name?.toLowerCase().includes(search.toLowerCase()) ||
      boat.registration_number.toLowerCase().includes(search.toLowerCase()) ||
      boat.type?.toLowerCase().includes(search.toLowerCase()) ||
      boat.home_port?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || boat.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const renderBoatItem = ({ item }: { item: Boat }) => {
    const isActive = item.status === 'active';
    const isMaintenance = item.status === 'maintenance';
    const isRetired = item.status === 'retired';

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('BoatDetails', { boatId: item.id })}
      >
        {/* Card Header */}
        <View style={styles.cardTop}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>
              {item.name || 'Unnamed Boat'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {item.registration_number}
            </Text>
          </View>
          
          <View style={[
            styles.badge,
            { 
              backgroundColor: isActive ? PALETTE.green50 : 
                             isMaintenance ? PALETTE.warn + '20' : 
                             PALETTE.error + '20',
              borderColor: isActive ? PALETTE.green600 : 
                          isMaintenance ? PALETTE.warn : 
                          PALETTE.error
            }
          ]}>
            <View style={[
              styles.badgeDot,
              { 
                backgroundColor: isActive ? PALETTE.green600 : 
                               isMaintenance ? PALETTE.warn : 
                               PALETTE.error
              }
            ]} />
            <Text style={[
              styles.badgeText,
              { 
                color: isActive ? PALETTE.green700 : 
                       isMaintenance ? PALETTE.warn : 
                       PALETTE.error
              }
            ]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Boat Details */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            <Icon name="category" size={14} color={PALETTE.text600} />
            {' '}{item.type || 'N/A'}
          </Text>
          <View style={styles.dot} />
          <Text style={styles.infoText}>
            <Icon name="straighten" size={14} color={PALETTE.text600} />
            {' '}{item.length_m ? `${item.length_m}m` : 'N/A'}
          </Text>
          <View style={styles.dot} />
          <Text style={styles.infoText}>
            <Icon name="people" size={14} color={PALETTE.text600} />
            {' '}{item.capacity_crew || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            <Icon name="location-on" size={14} color={PALETTE.text600} />
            {' '}{item.home_port || 'N/A'}
          </Text>
          <View style={styles.dot} />
          <Text style={styles.infoText}>
            <Icon name="engineering" size={14} color={PALETTE.text600} />
            {' '}{item.engine_power || 'N/A'}
          </Text>
          <View style={styles.dot} />
          <Text style={styles.infoText}>
            <Icon name="calendar-today" size={14} color={PALETTE.text600} />
            {' '}{item.year_built || 'N/A'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <Pressable
            style={styles.openBtn}
            onPress={() => navigation.navigate('BoatDetails', { boatId: item.id })}
          >
            <Icon name="visibility" size={16} color={PALETTE.text900} />
            <Text style={styles.openBtnText}>View</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.btnGhost]}
            onPress={() => navigation.navigate('EditBoat', { boatId: item.id })}
          >
            <Icon name="edit" size={16} color={PALETTE.text900} />
            <Text style={styles.btnGhostText}>Edit</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: PALETTE.green700 }}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" translucent={false} />

      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.hero}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>

          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>All Boats</Text>
            <Text style={styles.heroSub}>
              {loading ? 'Loading…' : `Total: ${filteredBoats.length}`}
            </Text>
          </View>
          
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => navigation.navigate('BoatRegister' as never)}
            accessibilityRole="button"
            accessibilityLabel="Add new boat"
          >
            <Icon name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, registration, type, port…"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>

        {/* Filter chips */}
        <View style={styles.chipsRow}>
          {(['all', 'active', 'maintenance', 'retired'] as const).map(status => (
            <Pressable
              key={status}
              onPress={() => setStatusFilter(status)}
              style={({ pressed }) => [
                styles.chip,
                statusFilter === status && styles.chipActive,
                pressed && { opacity: 0.9 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filter ${status}`}
            >
              <Text
                style={[
                  styles.chipText,
                  statusFilter === status && styles.chipTextActive,
                ]}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Boats List */}
        <FlatList
          data={filteredBoats}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBoatItem}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={
            <View style={styles.empty}>
              {loading ? (
                <ActivityIndicator size="large" color={PALETTE.green700} />
              ) : (
                <>
                  <Text style={styles.emptyTitle}>No boats found</Text>
                  <Text style={styles.emptySub}>
                    Try changing filters or search terms.
                  </Text>
                </>
              )}
            </View>
          }
          ListFooterComponent={
            hasMore && boats.length > 0 ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={PALETTE.green700} />
                <Text style={styles.loadingMoreText}>Loading more boats...</Text>
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PALETTE.surface,
  },
  hero: {
    backgroundColor: PALETTE.green700,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
  },
  heroBody: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    color: PALETTE.text900,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 16,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: PALETTE.green50,
    borderColor: PALETTE.green600,
  },
  chipText: { 
    color: PALETTE.text700, 
    fontWeight: '700',
    fontSize: 14,
  },
  chipTextActive: { 
    color: PALETTE.green700,
    fontWeight: '800',
  },
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginHorizontal: 16,
    ...shadow(0.05, 8, 3),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.text900,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: PALETTE.text600,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  badgeText: { 
    fontSize: 12, 
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  infoRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoText: { 
    color: PALETTE.text700, 
    fontWeight: '600', 
    fontSize: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: { 
    width: 4, 
    height: 4, 
    borderRadius: 99, 
    backgroundColor: PALETTE.border 
  },
  cardActions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#FFFFFF',
  },
  openBtnText: { 
    color: PALETTE.text900, 
    fontWeight: '700',
    fontSize: 14,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnGhost: {
    borderColor: PALETTE.border,
    backgroundColor: '#FFFFFF',
  },
  btnGhostText: { 
    color: PALETTE.text900, 
    fontWeight: '700',
    fontSize: 14,
  },
  empty: { 
    alignItems: 'center', 
    marginTop: 40, 
    paddingHorizontal: 20 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: PALETTE.text900,
    marginBottom: 8,
  },
  emptySub: { 
    color: PALETTE.text600, 
    textAlign: 'center',
    fontSize: 14,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingMoreText: {
    color: PALETTE.text600,
    fontSize: 14,
    fontWeight: '600',
  },
});

/* ---- shadow helper ---- */
function shadow(opacity: number, radius: number, height: number) {
  if (Platform.OS === 'android') return { elevation: 2 };
  return {
    shadowColor: '#000',
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height },
  };
}
