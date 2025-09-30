/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, TextInput, ActivityIndicator, StatusBar, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import PALETTE from '../../theme/palette';
import { fetchExporterCompanies, type ExporterCompany } from '../../services/traceability';

export default function CompaniesList() {
  const navigation = useNavigation();

  const handleBack = () => {
    // @ts-ignore
    navigation.navigate('ExporterHome');
  };

  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<ExporterCompany[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchExporterCompanies();
      // Filter by search query if provided
      const filtered = q.trim() 
        ? res.filter(item => 
            item.company_name.toLowerCase().includes(q.toLowerCase()) ||
            item.name.toLowerCase().includes(q.toLowerCase())
          )
        : res;
      setItems(filtered);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    const total = items.length;
    const active = items.filter(u => u.status === 'active').length;
    return { total, active, suspended: 0, expired: 0 };
  }, [items]);

  const renderItem = ({ item }: { item: ExporterCompany }) => {
    return (
      <View style={styles.rowCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.companyName} numberOfLines={1}>{item.company_name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaK}>REGISTRATION</Text>
            <Text style={styles.metaV}>{item.registration_no || '—'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaK}>TYPE</Text>
            <Text style={styles.metaBadge}>Exporter</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaK}>STATUS</Text>
            <View style={[styles.statusPill, { backgroundColor: item.status === 'active' ? '#E8F5E9' : '#FFEBEE' }]}>
              <Text style={{ color: item.status === 'active' ? PALETTE.green700 : PALETTE.error, fontWeight: '800' }}>
                {item.status === 'active' ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaK}>CONTACT</Text>
            <Text style={styles.metaV} numberOfLines={1}>
              {item.contact_person || item.name}
              {item.phone ? ` - ${item.phone}` : ''}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaK}>EMAIL</Text>
            <Text style={styles.metaV} numberOfLines={1}>{item.email || '—'}</Text>
          </View>
        </View>
        <Pressable style={({ pressed }) => [styles.viewBtn, pressed && { opacity: 0.9 }]} onPress={() => { /* could navigate to company details if exists */ }}>
          <Icon name="visibility" size={18} color={PALETTE.text900} />
          <Text style={styles.viewBtnText}>View</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.surface }}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
      <View style={styles.screen}>
        <View style={styles.hero}>
          <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>Company Management</Text>
            <Text style={styles.heroSub}>Manage fisheries businesses</Text>
          </View>
        </View>

        {/* Stat tiles */}
        <View style={styles.statTiles}>
          <Tile label="TOTAL" value={totals.total} />
          <Tile label="ACTIVE" value={totals.active} />
          <Tile label="SUSPENDED" value={totals.suspended} />
          <Tile label="EXPIRED" value={totals.expired} />
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Name, registration, city"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
          <Pressable onPress={load} style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.95 }]}>
            <Icon name="search" size={18} color="#fff" />
            <Text style={styles.filterBtnText}>Apply Filters</Text>
          </Pressable>
          <Pressable onPress={() => setQ('')} style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.95 }]}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={PALETTE.green700} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => String(it.id)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingVertical: 12 }}
            refreshing={loading}
            onRefresh={load}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 38, paddingBottom: 12, backgroundColor: PALETTE.surface },
  hero: { backgroundColor: PALETTE.green700, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', ...shadow(0.08, 8, 3) },
  backBtn: { padding: 6, borderRadius: 999, marginRight: 8 },
  heroBody: { flex: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  statTiles: { flexDirection: 'row', gap: 10, marginTop: 12 },
  tile: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, padding: 16, alignItems: 'center', ...shadow(0.05, 10, 4) },
  tileValue: { color: PALETTE.text900, fontSize: 18, fontWeight: '800' },
  tileLabel: { color: PALETTE.text600, marginTop: 4, fontWeight: '700' },
  filters: { marginTop: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: PALETTE.border, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8, color: PALETTE.text900 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#155E3C', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  filterBtnText: { color: '#fff', fontWeight: '800' },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: PALETTE.border, backgroundColor: '#F8FAFC' },
  clearBtnText: { color: PALETTE.text700, fontWeight: '800' },
  rowCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, ...shadow(0.04, 8, 3) },
  companyName: { color: PALETTE.text900, fontWeight: '800', fontSize: 16 },
  metaRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaK: { color: PALETTE.text600, minWidth: 90 },
  metaV: { color: PALETTE.text900, fontWeight: '700', flex: 1 },
  metaBadge: { color: '#fff', fontWeight: '800', backgroundColor: PALETTE.info, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  viewBtn: { borderWidth: 1, borderColor: PALETTE.border, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  viewBtnText: { color: PALETTE.text900, fontWeight: '800', marginLeft: 6 },
});

function shadow(opacity: number, radius: number, height: number) {
  if (Platform.OS === 'android') return { elevation: 2 } as any;
  return { shadowColor: '#000', shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height } } as any;
}


