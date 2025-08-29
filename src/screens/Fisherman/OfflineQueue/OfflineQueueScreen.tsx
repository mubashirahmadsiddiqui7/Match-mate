/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  StatusBar,
  Platform,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  getQueuedItems,
  onQueueChange,
  processOne,
  processQueue,
  removeQueued,
  type QueuedTrip,
} from '../../../offline/TripQueues';

const PALETTE = {
  green800: '#145A1F',
  green700: '#1B5E20',
  green50:  '#E8F5E9',
  text900:  '#111827',
  text700:  '#374151',
  text600:  '#4B5563',
  border:   '#E5E7EB',
  surface:  '#FFFFFF',
  warn:     '#EF6C00',
  info:     '#1E88E5',
  purple:   '#6A1B9A',
  error:    '#C62828',
  bg:       '#F8FAFC',
  chip:     '#F1F5F9',
};

const APPBAR_BG = '#1f720d';

/* -------------------------- helpers -------------------------- */
function fmtLocal(ts?: number | null) {
  if (!ts) return '-';
  try { return new Date(ts).toLocaleString(); } catch { return String(ts); }
}
function msToShort(ms: number) {
  if (ms <= 0) return 'now';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
function useTick(ms = 1000) {
  const [, setT] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setT(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
}

/* -------------------------- small UI atoms -------------------------- */
function Chip({
  icon,
  label,
  tone = 'default',
}: {
  icon?: string;
  label: string;
  tone?: 'ok' | 'warn' | 'error' | 'info' | 'default';
}) {
  const bg =
    tone === 'ok' ? '#E8F5E9' :
    tone === 'warn' ? '#FFF4E5' :
    tone === 'error' ? '#FFEBEE' :
    tone === 'info' ? '#E3F2FD' : PALETTE.chip;
  const color =
    tone === 'ok' ? PALETTE.green700 :
    tone === 'warn' ? PALETTE.warn :
    tone === 'error' ? PALETTE.error :
    tone === 'info' ? PALETTE.info : PALETTE.text700;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      {icon ? <Icon name={icon} size={14} color={color} style={{ marginRight: 6 }} /> : null}
      <Text style={{ color, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

/* -------------------------- main screen -------------------------- */
export default function OfflineQueueScreen({ navigation }: any) {
  const [items, setItems] = useState<QueuedTrip[]>([]);
  const [online, setOnline] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const listRef = useRef<FlatList<QueuedTrip>>(null);

  // tick every second to refresh countdown labels
  useTick(1000);

  // subscribe to queue & connectivity
  useEffect(() => {
    const unsubQ = onQueueChange(setItems);

    const unsubNet = NetInfo.addEventListener(s => {
      const nowOnline = !!s.isConnected;
      setOnline(nowOnline);
      // If we just came online, try to flush queue
      if (nowOnline) processQueue().catch(() => {});
    });

    // initial state
    NetInfo.fetch()
      .then(s => setOnline(!!s.isConnected))
      .catch(() => {});

    // also retry when app returns to foreground
    const onAppStateChange = (st: AppStateStatus) => {
      if (st === 'active') {
        NetInfo.fetch().then(s => {
          if (s.isConnected) processQueue().catch(() => {});
        });
      }
    };
    const appSub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      unsubQ();
      unsubNet && unsubNet();
      appSub.remove();
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setItems(await getQueuedItems());
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (navigation?.canGoBack?.()) navigation.goBack();
  }, [navigation]);

  const handleProcessAll = useCallback(async () => {
    if (!online) {
      Alert.alert('Offline', 'You are not connected. Items will auto-submit when internet returns.');
      return;
    }
    await processQueue();
  }, [online]);

  const handleSubmitNow = useCallback(
    async (localId: string) => {
      if (!online) {
        Alert.alert('Offline', 'No internet. This form will submit automatically when back online.');
        return;
      }
      const ok = await processOne(localId);
      if (ok) Alert.alert('Submitted', 'Form was submitted successfully.');
      else
        Alert.alert(
          'Deferred',
          'Could not submit now. It will retry automatically with backoff.',
        );
    },
    [online],
  );

  const handleDelete = useCallback(async (localId: string) => {
    Alert.alert('Remove form?', 'This will delete the offline form from your device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => removeQueued(localId) },
    ]);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(it => {
      const b = it.body || {};
      const hay =
        `${b.trip_name ?? ''} ${b.trip_id ?? ''} ${b.departure_port ?? ''} ${b.destination_port ?? ''} ${b.port_location ?? ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  const pendingCount = items.length;
  const oldestCreatedAt = items[0]?.createdAt;

  const renderItem = ({ item }: { item: QueuedTrip }) => {
    const b = item.body || {};
    const title = b.trip_name || b.trip_id || item.localId;
    const subtitle = [b.departure_port || b.port_location, b.destination_port]
      .filter(Boolean)
      .join(' → ');
    const dueMs = (item.nextRetryAt ?? 0) - Date.now();
    const waiting = !!item.nextRetryAt && dueMs > 0;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={styles.avatar}>
              <Icon name="directions-boat" size={20} color="#fff" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle || 'Route not specified'}
              </Text>
            </View>

            <Chip
              icon={online ? 'wifi' : 'wifi-off'}
              label={online ? 'Online' : 'Offline'}
              tone={online ? 'ok' : 'warn'}
            />
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <Chip icon="schedule" label={`Created ${fmtLocal(item.createdAt)}`} />
          <Chip
            icon="repeat"
            label={`Attempts ${item.attempts}`}
            tone={item.attempts > 0 ? 'info' : 'default'}
          />
          {waiting ? (
            <Chip
              icon="hourglass-bottom"
              label={`Retry in ${msToShort(dueMs)}`}
              tone="warn"
            />
          ) : (
            <Chip icon="play-arrow" label="Ready to submit" tone="ok" />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => handleSubmitNow(item.localId)}
            android_ripple={{ color: '#ffffff30' }}
            style={({ pressed }) => [
              styles.btnPrimary,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              !online && { opacity: 0.6 },
            ]}
            disabled={!online}
          >
            <Icon name="cloud-upload" size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>
              {online ? 'Submit Now' : 'Waiting for Internet'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleDelete(item.localId)}
            android_ripple={{ color: '#ffffff30' }}
            style={({ pressed }) => [
              styles.btnDanger,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
          >
            <Icon name="delete-outline" size={18} color="#fff" />
            <Text style={styles.btnDangerText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.bg }}>
      <StatusBar backgroundColor={APPBAR_BG} barStyle="light-content" />

      {/* App Bar */}
      <View style={styles.appbar}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" size={22} color="#fff" />
        </Pressable>

        <Text style={styles.appbarTitle}>Offline Forms</Text>

        <Pressable
          onPress={handleProcessAll}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Process all"
        >
          <Icon name="cloud-done" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Status strip */}
      <View
        style={[
          styles.strip,
          {
            backgroundColor: online ? PALETTE.green50 : '#FFF7ED',
            borderColor: online ? '#C8E6C9' : '#FED7AA',
          },
        ]}
      >
        <Icon
          name={online ? 'wifi' : 'wifi-off'}
          size={18}
          color={online ? PALETTE.green700 : PALETTE.warn}
        />
        <Text
          style={{
            marginLeft: 8,
            color: online ? PALETTE.green700 : PALETTE.warn,
          }}
        >
          {online
            ? 'Online — queued forms will auto-submit.'
            : 'Offline — forms will wait and submit later.'}
        </Text>
      </View>

      {/* Search + stats */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <View style={styles.searchBox}>
          <Icon
            name="search"
            size={20}
            color={PALETTE.text600}
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by Trip ID / ports"
            placeholderTextColor={PALETTE.text600}
            style={{
              flex: 1,
              color: PALETTE.text900,
              paddingVertical: Platform.OS === 'ios' ? 8 : 4,
            }}
          />
          {!!q && (
            <Pressable onPress={() => setQ('')}>
              <Icon name="close" size={18} color={PALETTE.text600} />
            </Pressable>
          )}
        </View>

        <View style={styles.statsRow}>
          <Chip icon="inbox" label={`Pending: ${pendingCount}`} />
          {oldestCreatedAt ? (
            <Chip icon="today" label={`Oldest: ${fmtLocal(oldestCreatedAt)}`} />
          ) : null}
        </View>
      </View>

      {/* List */}
      <FlatList
        ref={listRef}
        data={filtered}
        keyExtractor={it => it.localId}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 28, paddingTop: 8 }}
        ListEmptyComponent={
          <View
            style={{
              alignItems: 'center',
              marginTop: 48,
              paddingHorizontal: 24,
            }}
          >
            <Icon name="inbox" size={42} color={PALETTE.text600} />
            <Text
              style={{ marginTop: 8, color: PALETTE.text700, fontWeight: '600' }}
            >
              No offline forms
            </Text>
            <Text
              style={{ marginTop: 4, color: PALETTE.text600, textAlign: 'center' }}
            >
              New forms created while offline will appear here and auto-submit when you’re online.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

/* -------------------------- styles -------------------------- */
const styles = StyleSheet.create({
  appbar: {
    backgroundColor: APPBAR_BG,
    paddingTop: Platform.OS === 'android' ? 0 : 10,
    height: 56 + (Platform.OS === 'ios' ? 10 : 0),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  appbarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: PALETTE.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: PALETTE.green700,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  title: { color: PALETTE.text900, fontWeight: '700', fontSize: 15 },
  subtitle: { color: PALETTE.text600, fontSize: 12, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: PALETTE.green700,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10,
    flex: 1,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
  btnDanger: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: PALETTE.error,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnDangerText: { color: '#fff', fontWeight: '600' },
});
