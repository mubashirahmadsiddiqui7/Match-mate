/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React, { useCallback, useLayoutEffect, memo } from 'react';
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
  ImageSourcePropType,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FishermanStackParamList } from '../../app/navigation/stacks/FishermanStack';
import type { RootState } from '../../redux/store';
import PALETTE from '../../theme/palette';

type Nav = NativeStackNavigationProp<FishermanStackParamList, 'FishermanHome'>;


type ActionCardProps = {
  label: string;
  iconSource: ImageSourcePropType;
  onPress: () => void;
};

const ActionCard = memo(({ label, iconSource, onPress }: ActionCardProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionCard,
      pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
    ]}
    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Image source={iconSource} style={styles.actionIcon} />
    <Text style={styles.actionLabel}>{label}</Text>
  </Pressable>
));

const FishermanHome = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();
  const { width, height: screenHeight } = useWindowDimensions();

  const user = useSelector((s: RootState) => (s as any).auth?.user);
  console.log("existing user", user)
  const name = user?.name ?? 'Fisherman';
  const role = (user?.role ?? user?.user_type ?? 'fisherman')
    .toString()
    .replace('_', ' ');

  const isCompact = width < 360;

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Logout', style: 'destructive', onPress: () => dispatch<any>(logout()) },
    ]);
  }, [dispatch]);

  const navAllTrips = useCallback(() => navigation.navigate('AllTrip'), [navigation]);
  const navOfflineTrips = useCallback(
    () => navigation.navigate('OfflineTrips' as any),
    [navigation],
  );
  const navNewTrip = useCallback(() => navigation.navigate('Trip'), [navigation]);
  const navCreateLots = useCallback(() => navigation.navigate('Lots'), [navigation]);
  const navAllLots = useCallback(() => navigation.navigate('LotsList'), [navigation]);
  const navNewBoats = useCallback(() => navigation.navigate('Boat'), [navigation]);
    const navAllActivity = useCallback(() => navigation.navigate('FishingActivities'), [navigation]);



  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: 'Fisherman',
      headerStyle: { backgroundColor: PALETTE.green700 },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { color: '#FFFFFF', fontWeight: '800' },
      headerShadowVisible: false,
      headerRight: () => (
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.headerLogoutBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Text style={styles.headerLogoutText}>⎋ Logout</Text>
        </Pressable>
      ),
    });
  }, [navigation, handleLogout]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />

      <View style={styles.screen}>
        {/* Welcome / Profile */}
        <View style={[styles.headerCard, isCompact && styles.headerCardCompact]}>
          <View style={[styles.headerLeft, isCompact && styles.headerLeftCompact]}>
            <Image
              source={require('../../assets/images/placeholderIMG.png')}
              style={[styles.avatar, isCompact && styles.avatarSm]}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, isCompact && { fontSize: 11 }]}>Welcome</Text>
              <Text style={[styles.title, isCompact && styles.titleSm]} numberOfLines={1}>
                {name}
              </Text>
              <View style={[styles.rolePill, isCompact && styles.rolePillTight]}>
                <Text style={[styles.roleText, isCompact && { fontSize: 11 }]}>{role}</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel="Logout"
            >
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView
            style={{ maxHeight: Math.min(screenHeight * 0.93, 520) }}
            contentContainerStyle={styles.actionsList}
            showsVerticalScrollIndicator
          >
            <ActionCard
              label="All Trips"
              iconSource={require('../../assets/images/fishIcon.png')}
              onPress={navAllTrips}
            />
            <ActionCard
              label="Pending Offline Trips"
              iconSource={require('../../assets/images/fishIcon.png')}
              onPress={navOfflineTrips}
            />
            <ActionCard
              label="+ New Trip"
              iconSource={require('../../assets/images/boatIcon.png')}
              onPress={navNewTrip}
            />
            <ActionCard
              label="All Activities"
              iconSource={require('../../assets/images/boatIcon.png')}
              onPress={navAllActivity}
            />
            {/* <ActionCard
              label="+ Register Boat"
              iconSource={require('../../assets/images/boatIcon.png')}
              onPress={navNewBoats}
            /> */}
            {/* <ActionCard
              label="+ Create Lots"
              iconSource={require('../../assets/images/fishIcon.png')}
              onPress={navCreateLots}
            /> */}
            <ActionCard
              label="All Species"
              iconSource={require('../../assets/images/fishIcon.png')}
              onPress={navAllLots}
            />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.surface },
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: PALETTE.surface,
  },

  // Header / profile
  headerCard: {
    backgroundColor: PALETTE.green700,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  headerCardCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerLeftCompact: { alignItems: 'flex-start' },

  avatar: { height: 56, width: 56, borderRadius: 28 },
  avatarSm: { height: 44, width: 44, borderRadius: 22 },

  eyebrow: {
    color: 'white',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: PALETTE.surface,
    fontWeight: '800',
    fontSize: 22,
    marginTop: 2,
  },
  titleSm: { fontSize: 18, marginTop: 0 },

  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.green50,
  },
  rolePillTight: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { color: PALETTE.green700, fontWeight: '700', fontSize: 12 },

  headerRight: { flexDirection: 'row', alignItems: 'center' },

  section: { marginTop: 26 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.green700,
    marginLeft: 5,
    marginTop: 10,
    marginBottom: 10,
  },

  // Actions
  actionsList: { gap: 12 },
  actionCard: {
    alignSelf: 'stretch',
    backgroundColor: PALETTE.surface,
    borderRadius: 16,
    paddingHorizontal: 22,
    marginHorizontal: 10,
    paddingVertical: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  actionIcon: { width: 40, height: 40, marginBottom: 8, resizeMode: 'contain' },
  actionLabel: {
    fontSize: 16,
    color: PALETTE.green700,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Logout buttons
  headerLogoutBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  headerLogoutText: { color: '#FFFFFF', fontWeight: '800' },

  logoutBtn: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEE2E2',
  },
  logoutText: { color: '#B91C1C', fontWeight: '800', textAlign: 'center' },
});

export default FishermanHome;
