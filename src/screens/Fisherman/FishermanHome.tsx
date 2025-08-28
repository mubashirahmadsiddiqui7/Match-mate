/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React, {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
  Modal,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FishermanStackParamList } from '../../app/navigation/stacks/FishermanStack';
import type { RootState } from '../../redux/store';
import PALETTE from '../../theme/palette';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getUser } from '../../services/users';

type Nav = NativeStackNavigationProp<FishermanStackParamList, 'FishermanHome'>;

/** Icons typed as string → fixes glyphMap/overload TS errors */
type IconName = string;

const ActionCard = memo(
  ({
    label,
    icon,
    onPress,
    style,
  }: {
    label: string;
    icon: IconName;
    onPress: () => void;
    style?: any;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        style,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.96 },
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MaterialIcons name={icon} size={28} style={styles.actionIconMI} />
      <Text style={styles.actionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  ),
);


const Chip = ({
  color,
  bg,
  icon,
  children,
}: {
  color: string;
  bg: string;
  icon?: IconName;
  children: React.ReactNode;
}) => (
  <View style={[styles.chip, { backgroundColor: bg, borderColor: bg }]}>
    {icon ? (
      <MaterialIcons
        name={icon}
        size={14}
        color={color}
        style={{ marginRight: 6 }}
      />
    ) : null}
    <Text style={[styles.chipText, { color }]} numberOfLines={1}>
      {children}
    </Text>
  </View>
);

const Row = ({
  label,
  value,
  icon,
}: {
  label: string;
  value?: React.ReactNode;
  icon?: IconName;
}) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      {icon ? (
        <MaterialIcons
          name={icon}
          size={18}
          color={PALETTE.green700}
          style={{ marginRight: 8 }}
        />
      ) : null}
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <View style={{ flexShrink: 1 }}>
      {typeof value === 'string' ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value || '—'}
        </Text>
      ) : (
        value
      )}
    </View>
  </View>
);

/** Bottom sheet confirm (no Alert) */
const useBottomSheet = () => {
  const [visible, setVisible] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;
  const open = () => {
    setVisible(true);
    Animated.timing(slide, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };
  const close = () => {
    Animated.timing(slide, {
      toValue: 0,
      duration: 160,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => finished && setVisible(false));
  };
  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [280, 0],
  });
  return { visible, open, close, translateY };
};

export default function FishermanHome() {
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;

  const auth = useSelector((s: RootState) => (s as any).auth);
  const authUser = auth?.user;

  /** ✔ useMemo so eslint doesn’t warn about changing deps */
  const profile = useMemo(
    () => authUser?.profile ?? authUser ?? {},
    [authUser],
  );

  const [details, setDetails] = useState<any>(profile);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** keep local details in sync with profile changes from Redux */
  useEffect(() => {
    setDetails(profile);
  }, [profile]);

  const name =
    details?.name ||
    `${details?.first_name ?? ''} ${details?.last_name ?? ''}`.trim() ||
    'Fisherman';
  const phone = details?.phone ?? '—';
  const email = details?.email ?? '—';
  const isActive = details?.is_active ?? true;

  const { visible, open, close, translateY } = useBottomSheet();

  /** Only fetch on pull-to-refresh.
   * This avoids “Access denied” on mount if token/permission isn’t ready yet. */
  // inside FishermanHome
  const fetchUser = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const fresh = await getUser(); // <-- no ID now
      setDetails(fresh);
      // optionally also update Redux:
      // dispatch({ type: LOGIN_SUCCESS, payload: { ...authUser, profile: fresh } });
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase();
      if (
        msg.includes('unauthorized') ||
        msg.includes('forbidden') ||
        msg.includes('permission') ||
        e?.status === 401 ||
        e?.status === 403
      ) {
        setError('Access denied. Please re-login or contact support.');
      } else {
        setError(e?.message || 'Failed to load user.');
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  /** Header with a visible logout button */
  const HeaderLogoutButton = useMemo(
    () => () =>
      (
        <Pressable
          onPress={open}
          hitSlop={10}
          style={({ pressed }) => [
            styles.headerIconBtn,
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <MaterialIcons name="logout" size={22} color="#FFFFFF" />
        </Pressable>
      ),
    [open],
  );

  useLayoutEffect(() => {
    navigation.setOptions?.({
      headerShown: true,
      headerTitleAlign: 'left',
      headerStyle: { backgroundColor: PALETTE.green700 },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { color: '#FFFFFF', fontWeight: '800' },
      headerRight: HeaderLogoutButton,
    });
  }, [navigation, HeaderLogoutButton]);

  /** Auto extras */
  const moreKVs = useMemo(() => {
    const kv: Array<{ k: string; v: string; icon?: IconName }> = [];
    const add = (k: string, v?: any, icon?: IconName) => {
      if (v === undefined || v === null || v === '') return;
      kv.push({ k, v: String(v), icon });
    };
    const d = details || {};
    add('Fishing Zone', d.fishing_zone, 'waves');
    add(
      'Port Location',
      d.port_location ?? d.port ?? d.departure_port,
      'sailing',
    );
    add(
      'Boat Registration',
      d.boat_registration ?? d.boat_registration_number,
      'directions-boat',
    );
    add('Verification', d.verification_status, 'rule');
    add('Joined', (d.created_at || '').slice(0, 10), 'event');
    return kv;
  }, [details]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchUser}
            tintColor={PALETTE.green700}
          />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        {/* Header card */}
        <View style={[styles.headerCard, isNarrow && styles.headerCardNarrow]}>
          <View style={[styles.headerLeft, isNarrow && { width: '100%' }]}>
            <Image
              source={require('../../assets/images/placeholderIMG.png')}
              style={[styles.avatar, isNarrow && styles.avatarSm]}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.eyebrow} numberOfLines={1}>
                Welcome back
              </Text>
              <Text
                style={styles.title}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {name}
              </Text>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                {/* Edit Profile pill (with icon) */}
                <Pressable
                  onPress={() => navigation.navigate('Profile')}
                  style={({ pressed }) => [
                    styles.editPill,
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Edit Profile"
                >
                  <MaterialIcons
                    name="edit"
                    size={16}
                    color={PALETTE.green700}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.editPillText}>Edit Profile</Text>
                </Pressable>
              </View>

              <Text style={styles.introText}>
                You're logged into the Marine Fisheries Department Portal.
                Here's your dashboard overview.
              </Text>
            </View>
          </View>
        </View>

        {/* Permission/banner if needed */}
        {!authUser?.token && (
          <View style={styles.warnBanner}>
            <MaterialIcons name="lock" size={16} color="#92400E" />
            <Text style={styles.warnText}>
              No token present. Some actions may be restricted.
            </Text>
            <Pressable onPress={() => dispatch<any>(logout())}>
              <Text style={styles.warnAction}>Re-login</Text>
            </Pressable>
          </View>
        )}

        {/* Fisherman Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fisherman Details</Text>
          <View style={styles.detailsCard}>
            {loading ? (
              <>
                <View style={styles.skelRow} />
                <View style={styles.skelRow} />
                <View style={styles.skelRow} />
              </>
            ) : (
              <>
                <Row label="Full Name" value={name} icon="badge" />
                <Row label="Email Address" value={email} icon="mail-outline" />
                <Row label="Phone Number" value={phone} icon="call" />
                <Row
                  label="Account Status"
                  icon="shield"
                  value={
                    <View style={{ flexDirection: 'row' }}>
                      <Chip
                        bg={isActive ? '#E0F2FE' : '#FEE2E2'}
                        color={isActive ? '#075985' : '#991B1B'}
                        icon={isActive ? 'check-circle' : 'cancel'}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </Chip>
                    </View>
                  }
                />
              </>
            )}

            {moreKVs.length > 0 && (
              <View style={styles.kvGrid}>
                {moreKVs.map(({ k, v, icon }) => (
                  <View key={k} style={styles.kvItem}>
                    <Text style={styles.kvLabel} numberOfLines={1}>
                      {icon ? (
                        <MaterialIcons
                          name={icon}
                          size={14}
                          color={PALETTE.text600}
                        />
                      ) : null}
                      {icon ? ' ' : ''}
                      {k}
                    </Text>
                    <Text style={styles.kvValue} numberOfLines={1}>
                      {v}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsList}>
            <ActionCard
              label="Offline Trips"
              icon="cloud-off"
              onPress={() => navigation.navigate('OfflineTrips' as any)}
            />
            <ActionCard
              label="All Trips"
              icon="room-service"
              onPress={() => navigation.navigate('AllTrip')}
            />
            
            <ActionCard
              label="+ New Trip"
              icon="add-location-alt"
              onPress={() => navigation.navigate('Trip')}
            />
            <ActionCard
              label="All Activities"
              icon="surfing"
              onPress={() => navigation.navigate('FishingActivities')}
            />
            <ActionCard
              label="All Species"
              icon="set-meal"
              onPress={() => navigation.navigate('LotsList')}
            />
            <ActionCard
              label="All Boats"
              icon="set-meal"
              onPress={() => navigation.navigate('LotsList')}
            />
            <ActionCard
              label="Register Boat"
              icon="set-meal"
              onPress={() => navigation.navigate('LotsList')}
            />
          </View>

          {error ? (
            <View style={styles.errorToast}>
              <MaterialIcons name="error-outline" size={16} color="#991B1B" />
              <Text style={styles.errorToastText} numberOfLines={2}>
                {error}
              </Text>
              <Pressable onPress={fetchUser} hitSlop={10}>
                <Text style={styles.errorToastRetry}>Retry</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Floating fallback logout (always visible) */}
      <Pressable
        onPress={open}
        style={({ pressed }) => [
          styles.fabLogout,
          pressed && { opacity: 0.85 },
        ]}
        accessibilityLabel="Logout"
      >
        <MaterialIcons name="logout" size={22} color="#FFFFFF" />
      </Pressable>

      {/* Bottom Sheet Confirm Logout */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.sheetBackdrop} onPress={close} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Log out?</Text>
          <Text style={styles.sheetBody}>
            You will be signed out of the Marine Fisheries Department app.
          </Text>
          <View style={styles.sheetActions}>
            <Pressable
              onPress={close}
              style={({ pressed }) => [
                styles.sheetBtn,
                styles.sheetBtnSecondary,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.sheetBtnSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                close();
                setTimeout(() => dispatch<any>(logout()), 120);
              }}
              style={({ pressed }) => [
                styles.sheetBtn,
                styles.sheetBtnDanger,
                pressed && { opacity: 0.9 },
              ]}
            >
              <MaterialIcons
                name="logout"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.sheetBtnDangerText}>Logout</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.surface },

  scroll: { flex: 1, backgroundColor: PALETTE.surface },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24 + (Platform.OS === 'ios' ? 8 : 0),
    rowGap: 20,
    flexGrow: 1,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,

    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#DCFCE7',
  },
  editPillText: { color: PALETTE.green700, fontWeight: '800', fontSize: 12 },

  headerCard: {
    backgroundColor: PALETTE.green700,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    rowGap: 8,
    flexWrap: 'nowrap',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  introText: { marginTop: 6, fontSize: 13, color: '#FFFFFF', opacity: 0.85 }, // NEW line

  headerCardNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    flexShrink: 1,
  },
  // headerIconBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10 },
  avatar: { height: 56, width: 56, borderRadius: 28 },
  avatarSm: { height: 48, width: 48, borderRadius: 24 },
  eyebrow: {
    color: 'white',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 22,
    marginTop: 2,
    flexShrink: 1,
  },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.green50,
    maxWidth: '100%',
  },
  roleText: { color: PALETTE.green700, fontWeight: '700', fontSize: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', columnGap: 8 },
  headerRightStack: {
    width: '100%',
    marginTop: 6,
    justifyContent: 'flex-start',
  },

  section: {},
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.green700,
    marginLeft: 5,
    marginBottom: 10,
  },

  detailsCard: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  rowLabel: { color: PALETTE.text900, fontWeight: '600', fontSize: 14 },
  rowValue: { color: PALETTE.text600, fontSize: 14, textAlign: 'right' },

  kvGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 10,
  },
  kvItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    minWidth: '46%',
    flexGrow: 1,
  },
  kvLabel: { fontSize: 12, color: PALETTE.text600, marginBottom: 4 },
  kvValue: { fontSize: 14, color: PALETTE.text900, fontWeight: '600' },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipText: { fontSize: 12, fontWeight: '700' },

  actionsList: { gap: 12 },
  actionCard: {
    backgroundColor: PALETTE.surface,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  actionIconMI: { marginBottom: 6, color: PALETTE.green700 },
  actionLabel: {
    fontSize: 15,
    color: PALETTE.green700,
    fontWeight: '800',
    textAlign: 'center',
  },

  errorToast: {
    marginTop: 10,
    marginHorizontal: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorToastText: { color: '#991B1B', flex: 1, fontSize: 13 },
  errorToastRetry: {
    color: '#991B1B',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },

  /* Warning banner (token/permission) */
  warnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    borderRadius: 12,
  },
  warnText: { color: '#92400E', flex: 1, fontSize: 12 },
  warnAction: {
    color: '#92400E',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },

  /* Header Logout button (in headerRight) */
  headerLogoutBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  headerLogoutText: { color: '#FFFFFF', fontWeight: '800' },
  headerIconBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10 },

  /* Floating logout (fallback to guarantee visibility) */
  fabLogout: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    backgroundColor: '#DC2626',
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  /* Bottom sheet */
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.text900,
    marginBottom: 6,
    textAlign: 'center',
  },
  sheetBody: { color: PALETTE.text600, textAlign: 'center', marginBottom: 16 },
  sheetActions: { flexDirection: 'row', gap: 10 },
  sheetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sheetBtnSecondary: { backgroundColor: '#F3F4F6' },
  sheetBtnDanger: { backgroundColor: '#DC2626' },
  sheetBtnSecondaryText: { color: '#111827', fontWeight: '800' },
  sheetBtnDangerText: { color: '#FFFFFF', fontWeight: '800' },
  /* Skeletons */
  skelRow: {
    height: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    marginVertical: 8,
  },
});
