/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  ImageBackground,
  Alert,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/actions/authActions';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FishermanStackParamList } from '../../app/navigation/stacks/FishermanStack';
import type { RootState } from '../../redux/store';

type Nav = NativeStackNavigationProp<FishermanStackParamList, 'FishermanHome'>;

const ActionCard = ({
  label,
  iconSource,
  onPress,
}: {
  label: string;
  iconSource: any;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.card,
      pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
    ]}
    android_ripple={{ color: 'rgba(27,94,32,0.12)', borderless: false }}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <Image source={iconSource} style={styles.icon} />
    <Text style={styles.cardLabel}>{label}</Text>
  </Pressable>
);

const FishermanHome = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();
  const user = useSelector((s: RootState) => (s as any).auth?.user);
  const name = user?.name || 'Fisherman';
  const role = user?.role || 'fisherman';

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Logout',
        style: 'destructive',
        onPress: () => dispatch<any>(logout()),
      },
    ]);
  }, [dispatch]);

  useLayoutEffect(() => {
    navigation.setOptions?.({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleLogout}
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Text style={{ color: '#1B5E20', fontWeight: '700' }}>Logout</Text>
        </TouchableOpacity>
      ),
      title: 'Fisherman',
    });
  }, [navigation, handleLogout]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#E8F5E9' }}>
      <View style={styles.container}>
        <ImageBackground
          source={require('../../assets/images/fishermanImage.png')}
          style={styles.hero}
          resizeMode="cover"
          imageStyle={{ opacity: 0.7 }}
        >
          {/* Gradient-ish overlay using multiple semi-transparent layers (no extra deps) */}
          <View style={styles.overlay} />
          <View style={styles.overlaySoft} />

          <View style={styles.topBar}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{role.replace('_', ' ')}</Text>
            </View>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutPill,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              accessibilityRole="button"
              accessibilityLabel="Logout"
            >
              <Text style={styles.logoutText}>⎋ Logout</Text>
            </Pressable>
          </View>

          <View style={styles.heroTextWrap}>
            <Text style={styles.eyebrow}>Welcome</Text>
            <Text style={styles.title}>{name}</Text>
            <Text style={styles.subTitle}>
              Let’s record your activity today.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.profileButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
            accessibilityRole="button"
            accessibilityLabel="Open Profile"
          >
            <Image
              source={require('../../assets/images/placeholderIMG.png')}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.profileText}>Profile</Text>
              <Text style={styles.profileSub}>{user?.email ?? '—'}</Text>
            </View>
          </Pressable>
        </ImageBackground>

        <View style={styles.grid}>
          <ActionCard
            label="+ New Trips"
            iconSource={require('../../assets/images/boatIcon.png')}
            onPress={() => navigation.navigate('Trip')}
          />
          <ActionCard
            label="Lots"
            iconSource={require('../../assets/images/fishIcon.png')}
            onPress={() => navigation.navigate('Trip')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const CARD_BG = 'rgba(255,255,255,0.9)';
const BORDER = 'rgba(255,255,255,0.65)';

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    justifyContent: 'flex-end',
    minHeight: "70%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27,94,32,0.25)',
  },
  overlaySoft: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  badgeText: {
    color: '#1B5E20',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  logoutPill: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  logoutText: { color: '#1B5E20', fontWeight: '700' },

  heroTextWrap: {
    marginBottom: 16,
  },
  eyebrow: {
    color: '#E8F5E9',
    opacity: 0.9,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 28,
    marginTop: 2,
  },
  subTitle: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
    fontSize: 14,
  },

  profileButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  profileImage: { height: 44, width: 44, borderRadius: 22 },
  profileText: {
    fontSize: 16,
    color: '#1B5E20',
    fontWeight: '700',
    lineHeight: 18,
  },
  profileSub: { fontSize: 12, color: '#2E7D32', opacity: 0.9, marginTop: 2 },

  grid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  card: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  icon: { width: 42, height: 42, marginBottom: 10, resizeMode: 'contain' },
  cardLabel: { fontSize: 16, color: '#1B5E20', fontWeight: '800' },
});

export default FishermanHome;
