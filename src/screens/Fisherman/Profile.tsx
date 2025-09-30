// src/screens/Fisherman/Profile.tsx
/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  StatusBar,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import PALETTE from '../../theme/palette';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { api } from '../../services/https';
import { getUser, updateMe, type User } from '../../services/users';

// ---- OPTIONAL: if you already use react-native-image-picker, uncomment & use it.
// import { launchImageLibrary } from 'react-native-image-picker';

type Nav = NativeStackNavigationProp<any>;
type TabKey = 'info' | 'password' | 'delete';

export default function Profile() {
  const navigation = useNavigation<Nav>();
  const auth = useSelector((s: RootState) => (s as any).auth);
  const authUser = auth?.user;

  const initial = useMemo<User>(() => (authUser?.profile ?? authUser ?? {}), [authUser]);

  const [tab, setTab] = useState<TabKey>('info');

  // Personal info state
  const [firstName, setFirstName] = useState(initial?.first_name ?? '');
  const [lastName, setLastName] = useState(initial?.last_name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [nationalId, setNationalId] = useState(initial?.national_id ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [province, setProvince] = useState(initial?.province ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(initial?.profile_picture ?? null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    navigation.setOptions?.({
      headerShown: true,
      title: 'Profile',
      headerStyle: { backgroundColor: PALETTE.green700 },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { color: '#FFFFFF', fontWeight: '800' },
    });
  }, [navigation]);

  const show = (type: 'success' | 'error', text: string) => {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 4000);
  };

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const fresh = await getUser();
      setFirstName(fresh?.first_name ?? '');
      setLastName(fresh?.last_name ?? '');
      setEmail(fresh?.email ?? '');
      setPhone(fresh?.phone ?? '');
      setNationalId((fresh as any)?.national_id ?? '');
      setAddress(fresh?.address ?? '');
      setCity(fresh?.city ?? '');
      setProvince(fresh?.province ?? '');
      setCountry(fresh?.country ?? '');
      setAvatarUri(fresh?.profile_picture ?? null);
      show('success', 'Profile loaded.');
    } catch (e: any) {
      show('error', e?.message || 'Failed to fetch profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); /* load once */ }, [refresh]);

  // ---- Avatar pick (non-blocking). Replace with your library if needed.
  const onPickImage = async () => {
    // If you already use image-picker, enable below:
    // const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    // const uri = res?.assets?.[0]?.uri;
    // if (uri) setAvatarUri(uri);

    Alert.alert('Profile Picture', 'Hook image-picker here to change avatar.');
  };

  const savePersonalInfo = async () => {
    try {
      setSaving(true);
      setBanner(null);

      // Align with your API’s accepted fields
      const body: any = {
        // Some backends accept first_name/last_name; others require name
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName} ${lastName}`.trim(),
        phone: phone.trim(),
        national_id: nationalId.trim(),
        address: address.trim(),
        city: city.trim(),
        province: province.trim(),
        country: country.trim(),
      };

      // If your API allows email change, include next line; otherwise omit to keep read-only
      // body.email = email.trim();

      // Submit self-update
      const updated = await updateMe(body);

      // Optionally upload avatar if you store via a separate endpoint:
      // await uploadAvatar(avatarUri)

      // Reflect any server-trimmed changes
      setFirstName(updated?.first_name ?? firstName);
      setLastName(updated?.last_name ?? lastName);
      setPhone(updated?.phone ?? phone);
      setNationalId((updated as any)?.national_id ?? nationalId);
      setAddress(updated?.address ?? address);
      setCity(updated?.city ?? city);
      setProvince(updated?.province ?? province);
      setCountry(updated?.country ?? country);

      show('success', 'Profile updated successfully.');
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase();
      if (e?.status === 403 || msg.includes('forbidden') || msg.includes('permission')) {
        show('error', 'Access denied. Your account may not update profile.');
      } else {
        show('error', e?.message || 'Update failed.');
      }
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!currentPwd || !newPwd) return show('error', 'Please enter current and new password.');
    if (newPwd.length < 6) return show('error', 'New password must be at least 6 characters.');
    if (newPwd !== confirmPwd) return show('error', 'Password confirmation does not match.');
    try {
      setPwdSaving(true);
      setBanner(null);
      // Adjust endpoint to your backend’s route if different:
      // Many backends use PUT /user/password or POST /user/change-password
      await api('/user/password', { method: 'PUT', body: { current_password: currentPwd, password: newPwd, password_confirmation: confirmPwd } });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      show('success', 'Password updated.');
    } catch (e: any) {
      show('error', e?.message || 'Failed to change password.');
    } finally {
      setPwdSaving(false);
    }
  };



  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={PALETTE.green700} barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        {/* Tabs */}
        <View style={styles.tabs}>
          <Tab label="Personal Info" active={tab === 'info'} onPress={() => setTab('info')} />
          <Tab label="Change Password" active={tab === 'password'} onPress={() => setTab('password')} />
        </View>

        {/* Banner */}
        {banner ? (
          <View style={[styles.banner, banner.type === 'error' ? styles.bannerErr : styles.bannerOk]}>
            <MaterialIcons
              name={banner.type === 'error' ? 'error-outline' : 'check-circle'}
              size={16}
              color={banner.type === 'error' ? '#991B1B' : '#166534'}
            />
            <Text style={[styles.bannerText, { color: banner.type === 'error' ? '#991B1B' : '#166534' }]} numberOfLines={2}>
              {banner.text}
            </Text>
          </View>
        ) : null}

        {/* PERSONAL INFO */}
        {tab === 'info' && (
          <View style={styles.card}>
            <Pressable style={styles.avatarWrap} onPress={onPickImage}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>
                    {`${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'FM'}
                  </Text>
                </View>
              )}
              <Text style={styles.avatarHint}>Click image to change</Text>
            </Pressable>

            <View style={styles.row2}>
              <Field label="First Name" value={firstName} onChangeText={setFirstName} />
              <Field label="Last Name" value={lastName} onChangeText={setLastName} />
            </View>

            <View style={styles.row2}>
              <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" editable={false} />
              <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>

            <View style={styles.row2}>
              <Field label="National ID" value={nationalId} onChangeText={setNationalId} />
              <Field label="Address" value={address} onChangeText={setAddress} />
            </View>

            <View style={styles.row3}>
              <Field label="City" value={city} onChangeText={setCity} />
              <Field label="Province" value={province} onChangeText={setProvince} />
              <Field label="Country" value={country} onChangeText={setCountry} />
            </View>

            <Pressable
              onPress={savePersonalInfo}
              disabled={saving}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }, saving && { opacity: 0.7 }]}
            >
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <MaterialIcons name="save" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
              <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
            </Pressable>

            <Pressable onPress={refresh} style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.9 }]}>
              <MaterialIcons name="refresh" size={18} color={PALETTE.green700} style={{ marginRight: 6 }} />
              <Text style={styles.ghostText}>{loading ? 'Refreshing…' : 'Reload from server'}</Text>
            </Pressable>
          </View>
        )}

        {/* CHANGE PASSWORD */}
        {tab === 'password' && (
          <View style={styles.card}>
            <Field label="Current Password" value={currentPwd} onChangeText={setCurrentPwd} secureTextEntry />
            <Field label="New Password" value={newPwd} onChangeText={setNewPwd} secureTextEntry />
            <Field label="Confirm New Password" value={confirmPwd} onChangeText={setConfirmPwd} secureTextEntry />

            <Pressable
              onPress={savePassword}
              disabled={pwdSaving}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }, pwdSaving && { opacity: 0.7 }]}
            >
              {pwdSaving ? <ActivityIndicator color="#FFFFFF" /> : <MaterialIcons name="lock-reset" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
              <Text style={styles.primaryText}>{pwdSaving ? 'Updating…' : 'Change Password'}</Text>
            </Pressable>
          </View>
        )}

       
      </ScrollView>
    </SafeAreaView>
  );
}

/* Reusable small bits */

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {active ? <View style={styles.tabUnderline} /> : null}
    </Pressable>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  secureTextEntry?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        style={[styles.input, !props.editable && props.editable !== undefined ? styles.inputReadOnly : null]}
        placeholder={props.label}
        placeholderTextColor="#9CA3AF"
        keyboardType={props.keyboardType}
        secureTextEntry={props.secureTextEntry}
        editable={props.editable !== false}
      />
    </View>
  );
}

/* Styles */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  wrap: {
    padding: 16,
    paddingBottom: 24 + (Platform.OS === 'ios' ? 8 : 0),
    gap: 14,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 6,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB' },
  tabText: { color: '#4B5563', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: PALETTE.green700 },
  tabUnderline: { height: 2, backgroundColor: PALETTE.green700, width: '40%', borderRadius: 2, marginTop: 6 },

  banner: { padding: 10, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerErr: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  bannerOk: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  bannerText: { flex: 1, fontSize: 13 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  // Avatar
  avatarWrap: { alignItems: 'center', marginTop: 4, marginBottom: 8 },
  avatar: { height: 96, width: 96, borderRadius: 48 },
  avatarFallback: { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#374151', fontSize: 28, fontWeight: '800' },
  avatarHint: { marginTop: 6, fontSize: 12, color: '#6B7280' },

  // Grid
  row2: { flexDirection: 'row', gap: 12 },
  row3: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 6 },
  label: { color: '#111827', fontWeight: '700', fontSize: 13 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    backgroundColor: '#F9FAFB', color: '#111827',
  },
  inputReadOnly: { backgroundColor: '#F3F4F6', color: '#6B7280' },

  // Buttons
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PALETTE.green700, paddingVertical: 12, borderRadius: 12 },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },

  ghostBtn: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#D1FAE5', backgroundColor: '#ECFDF5' },
  ghostText: { color: PALETTE.green700, fontWeight: '800' },

  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#DC2626', paddingVertical: 12, borderRadius: 12 },
  dangerText: { color: '#FFFFFF', fontWeight: '800' },

  // Delete copy
  deleteTitle: { fontSize: 16, fontWeight: '800', color: '#991B1B' },
  deleteDesc: { color: '#7F1D1D' },
});
