/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable, ActivityIndicator, StatusBar, Platform, TextInput, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import PALETTE from '../../theme/palette';
import { fetchExporterPurchases, processExporterPurchase, completeExporterPurchase, verifyApproveExporterPurchase, type ExporterPurchase, getStatusColor, getStatusText, formatDate } from '../../services/exporter';

export default function PurchasesList() {
  const navigation = useNavigation();

  const handleBack = () => {
    // @ts-ignore
    navigation.navigate('ExporterHome');
  };
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExporterPurchase[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'confirmed' | 'processed' | 'completed' | 'cancelled'>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchExporterPurchases({ page: 1, per_page: 50, status: status === 'all' ? undefined : status, search: query || undefined });
      setItems(res.items);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleProcess = async (item: ExporterPurchase) => {
    const proceed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Mark as Processed',
        'Are you sure you want to mark this purchase as processed?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Process', style: 'default', onPress: () => resolve(true) },
        ],
        { cancelable: true },
      );
    });

    if (!proceed) return;

    try {
      setActionLoading(item.id);
      await processExporterPurchase(item.id);
      Alert.alert('Success', 'Purchase marked as processed successfully.');
      load();
    } catch (error) {
      console.error('Error processing purchase:', error);
      Alert.alert('Error', 'Failed to process purchase. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (item: ExporterPurchase) => {
    const proceed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Mark as Complete',
        'Are you sure you want to mark this purchase as complete?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Complete', style: 'default', onPress: () => resolve(true) },
        ],
        { cancelable: true },
      );
    });

    if (!proceed) return;

    try {
      setActionLoading(item.id);
      await completeExporterPurchase(item.id);
      Alert.alert('Success', 'Purchase marked as complete successfully.');
      load();
    } catch (error) {
      console.error('Error completing purchase:', error);
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyApprove = async (item: ExporterPurchase) => {
    const proceed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Verify & Approve',
        'Are you sure you want to verify and approve this purchase?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Approve', style: 'default', onPress: () => resolve(true) },
        ],
        { cancelable: true },
      );
    });

    if (!proceed) return;

    try {
      setActionLoading(item.id);
      await verifyApproveExporterPurchase(item.id);
      Alert.alert('Success', 'Purchase verified and approved successfully.');
      load();
    } catch (error) {
      console.error('Error verifying purchase:', error);
      Alert.alert('Error', 'Failed to verify and approve. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (item: ExporterPurchase) => {
    // @ts-ignore
    navigation.navigate('PurchaseDetails', { purchaseId: item.id.toString() });
  };

  const total = useMemo(() => items.length, [items]);
  const counts = useMemo(() => {
    const c = { all: items.length, pending: 0, confirmed: 0, processed: 0, completed: 0, cancelled: 0 } as Record<string, number>;
    items.forEach(p => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [items]);

  const renderItem = ({ item }: { item: ExporterPurchase }) => {
    const color = getStatusColor(item.status);
    const isLoading = actionLoading === item.id;
    
    return (
      <Pressable onPress={() => handleViewDetails(item)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardEyebrow}>Purchase</Text>
            <Text style={styles.cardTitle} numberOfLines={1}>#{item.id} • {item.final_product_name || '—'}</Text>
          </View>
          <View style={[styles.badge, { borderColor: color }]}>
            <View style={[styles.badgeDot, { backgroundColor: color }]} />
            <Text style={[styles.badgeText, { color }]}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {/* Meta grid */}
        <View style={styles.metaGrid}>
          <Meta icon="store" k="Company" v={item?.company?.company_name || item?.company?.name || '—'} />
          <Meta icon="badge" k="Exporter" v={item?.exporter?.name || '—'} />
          <Meta icon="person" k="Middle Man" v={item?.middle_man?.name || '—'} />
          <Meta icon="calendar-today" k="Created" v={formatDate(item.created_at)} />
        </View>

        {/* Quantities */}
        <View style={styles.qtyRow}>
          <Chip icon="scale" label={`${Number(item.total_quantity_kg).toFixed(2)} kg`} />
          <Chip icon="fitness-center" label={`Final ${Number(item.final_weight_quantity).toFixed(2)} kg`} tone="ok" />
          {item.purchase_reference ? <Chip icon="tag" label={`Ref ${item.purchase_reference}`} tone="info" /> : null}
        </View>

        {/* Lots scroller */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8 }}>
          {(item.enriched_purchased_lots || item.purchased_lots || []).map((lot: any, i: number) => {
            const enrichedLot = item.enriched_purchased_lots?.[i];
            return (
              <View key={i} style={styles.lotPill}>
                <Text style={{ color: PALETTE.text700, fontWeight: '800' }}>{lot.lot_no}</Text>
                <Text style={{ color: PALETTE.text600, marginLeft: 8 }}>{Number(lot.quantity_kg).toFixed(2)} kg</Text>
                {enrichedLot && (
                  <>
                    <Text style={styles.lotSpecies}> • {enrichedLot.species_name}</Text>
                    <Text style={styles.lotGrade}> • Grade {enrichedLot.grade}</Text>
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Edit (Exporter can edit anytime before completion) */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              // @ts-ignore
              navigation.navigate('CreatePurchase', { editPurchaseId: item.id, hideFinalFields: false });
            }}
            style={({ pressed }) => [
              styles.actionButton,
              styles.viewButton,
              pressed && { opacity: 0.9 }
            ]}
          >
            <Icon name="edit" size={16} color={PALETTE.warn} />
            <Text style={[styles.actionButtonText, { color: PALETTE.warn }]}>Edit</Text>
          </Pressable>
          {/* Verify & Approve when status is pending_verification */}
          {String(item.status).toLowerCase() === 'pending_verification' && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleVerifyApprove(item);
              }}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.actionButton,
                styles.verifyButton,
                pressed && { opacity: 0.9 },
                isLoading && { opacity: 0.6 }
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="verified" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Verify & Approve</Text>
                </>
              )}
            </Pressable>
          )}
          {item.status === 'confirmed' && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleProcess(item);
              }}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.actionButton,
                styles.processButton,
                pressed && { opacity: 0.9 },
                isLoading && { opacity: 0.6 }
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="build" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Mark as Processed</Text>
                </>
              )}
            </Pressable>
          )}

          {item.status === 'processed' && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleComplete(item);
              }}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.actionButton,
                styles.completeButton,
                pressed && { opacity: 0.9 },
                isLoading && { opacity: 0.6 }
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="check-circle" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Mark as Complete</Text>
                </>
              )}
            </Pressable>
          )}

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleViewDetails(item);
            }}
            style={({ pressed }) => [
              styles.actionButton,
              styles.viewButton,
              pressed && { opacity: 0.9 }
            ]}
          >
            <Icon name="visibility" size={16} color={PALETTE.green700} />
            <Text style={[styles.actionButtonText, { color: PALETTE.green700 }]}>View Details</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  function Meta({ icon, k, v }: { icon: string; k: string; v: string }) {
    return (
      <View style={styles.row}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name={icon} size={16} color={PALETTE.text600} />
          <Text style={[styles.k, { marginLeft: 6 }]}>{k}</Text>
        </View>
        <Text style={styles.v} numberOfLines={1}>{v}</Text>
      </View>
    );
  }

  function Chip({ icon, label, tone = 'default' }: { icon?: string; label: string; tone?: 'default'|'ok'|'info'| 'warn'|'error' }) {
    const bg = tone === 'ok' ? '#E8F5E9' : tone === 'info' ? '#E3F2FD' : tone === 'warn' ? '#FFF4E5' : tone === 'error' ? '#FFEBEE' : '#F1F5F9';
    const fg = tone === 'ok' ? PALETTE.green700 : tone === 'info' ? PALETTE.info : tone === 'warn' ? PALETTE.warn : tone === 'error' ? PALETTE.error : PALETTE.text700;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
        {icon ? <Icon name={icon} size={14} color={fg} style={{ marginRight: 6 }} /> : null}
        <Text style={{ color: fg, fontWeight: '700' }}>{label}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.surface }}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
      <View style={styles.screen}>
        <View style={styles.hero}>
          <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>All Purchases</Text>
            <Text style={styles.heroSub}>{loading ? 'Loading…' : `Total: ${total}`}</Text>
          </View>
          {/* Create Purchase moved to Middleman. Button hidden for Exporter. */}
          {false && (
          <Pressable onPress={() => (navigation as any).navigate('CreatePurchase')} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.95 }]}>
            <Icon name="add-shopping-cart" size={18} color="#fff" />
            <Text style={styles.ctaText}>New</Text>
          </Pressable>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by company, exporter, reference…"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
          <View style={styles.filterChips}>
            {(['all','pending','confirmed','processed','completed','cancelled'] as const).map(st => (
              <Pressable key={st} onPress={() => { setStatus(st); load(); }} style={({ pressed }) => [styles.chip, status === st && styles.chipActive, pressed && { opacity: 0.95 }]}>
                <Text style={[styles.chipText, status === st && styles.chipTextActive]}>{st[0].toUpperCase() + st.slice(1)}{st==='all' ? ` (${counts.all})` : ''}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={load} style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.95 }]}>
            <Icon name="search" size={18} color="#fff" />
            <Text style={styles.filterBtnText}>Apply</Text>
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

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 38, paddingBottom: 12, backgroundColor: PALETTE.surface },
  hero: { backgroundColor: PALETTE.green700, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', ...shadow(0.08, 8, 3) },
  backBtn: { padding: 6, borderRadius: 999, marginRight: 8 },
  heroBody: { flex: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: PALETTE.info },
  ctaText: { color: '#fff', fontWeight: '800' },
  card: { backgroundColor: PALETTE.surface, borderRadius: 16, borderWidth: 1, borderColor: PALETTE.border, padding: 14, ...shadow(0.06, 10, 4) },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  cardEyebrow: { color: PALETTE.text600, fontSize: 12 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: PALETTE.text900, flex: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1.5 },
  badgeDot: { width: 8, height: 8, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  metaGrid: { marginTop: 10, rowGap: 8 },
  row: { marginTop: 2, flexDirection: 'row', justifyContent: 'space-between' },
  k: { color: PALETTE.text600 },
  v: { color: PALETTE.text900, fontWeight: '700' },
  lotPill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: PALETTE.border, backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, flexWrap: 'wrap' },
  lotSpecies: { fontSize: 10, color: PALETTE.text600, fontWeight: '600' },
  lotGrade: { fontSize: 9, color: PALETTE.text500 },
  qtyRow: { marginTop: 10, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filters: { marginTop: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, padding: 12 },
  searchInput: { borderWidth: 1, borderColor: PALETTE.border, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8, color: PALETTE.text900 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: PALETTE.border, backgroundColor: '#FFFFFF' },
  chipActive: { backgroundColor: PALETTE.green50, borderColor: PALETTE.green600 },
  chipText: { color: PALETTE.text700, fontWeight: '700' },
  chipTextActive: { color: PALETTE.green700 },
  filterBtn: { marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#155E3C', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  filterBtnText: { color: '#fff', fontWeight: '800' },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  processButton: {
    backgroundColor: '#9c27b0',
    borderColor: '#9c27b0',
  },
  completeButton: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  verifyButton: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  viewButton: {
    backgroundColor: '#f8f9fa',
    borderColor: PALETTE.green600,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

function shadow(opacity: number, radius: number, height: number) {
  if (Platform.OS === 'android') return { elevation: 2 } as any;
  return { shadowColor: '#000', shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height } } as any;
}


