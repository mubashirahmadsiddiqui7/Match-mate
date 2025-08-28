/* eslint-disable react-native/no-inline-styles */
// src/screens/auth/Login.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import type { Dispatch } from 'redux';
import { login } from '../../redux/actions/authActions';
import type { AuthAction } from '../../redux/types';
import { RootState } from '../../redux/store';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../app/navigation/stacks/AuthStack';
import Toast from 'react-native-toast-message';

const GREEN = '#1f720d';
const TEXT_DARK = '#0B1220';
const TEXT_MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const SURFACE = '#FFFFFF';
const BG = '#F5F7FA';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const Login = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  // Redux
  const dispatch = useDispatch<Dispatch<AuthAction>>();
  const { loading, error } = useSelector((s: RootState) => s.auth);

  // Local UI state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }
    if (!password.trim()) {
      setPasswordError('Password is required.');
      valid = false;
    }
    if (!valid) return;

    dispatch<any>(login(email.trim(), password))
      .then(() => {
        Toast.show({
          type: 'success',
          text1: 'Login Success ✅',
          position: 'bottom',
        });
      })
      .catch((e: { message: any; }) => console.log('[Login] failed:', e?.message || e));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.bgDecorTop} />
        <View style={styles.bgDecorBottom} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          style={styles.full}
        >
          <View style={styles.container}>
            <View style={styles.hero}>
              <Image
                source={require('../../assets/images/MFD.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Marine Fisheries Portal</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                Sign in to manage trips, activities, and lots — fast and secure.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="mail-outline" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={email}
                  onChangeText={t => {
                    setEmail(t);
                    if (emailError) setEmailError('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>
              {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

              {/* Password */}
              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Password</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="lock-outline" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={password}
                  onChangeText={t => {
                    setPassword(t);
                    if (passwordError) setPasswordError('');
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity style={styles.eye} onPress={() => setShowPassword(s => !s)}>
                  <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>
              {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

              {/* Options row (compact) */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, rememberMe && { backgroundColor: GREEN, borderColor: GREEN }]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxText}>Keep me logged in</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.link}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {!!error && <Text style={styles.authError}>{error}</Text>}

              {/* Primary */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                style={[styles.primaryBtn, loading && { opacity: 0.8 }]}
                activeOpacity={0.9}
              >
                <MaterialIcons name="login" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
              </TouchableOpacity>

              {/* Secondary: Create Account */}
              <TouchableOpacity
                onPress={() => navigation.navigate('SignUp')}
                style={styles.secondaryBtn}
                activeOpacity={0.9}
              >
                <MaterialIcons name="person-add-alt" size={18} color={GREEN} style={{ marginRight: 8 }} />
                <Text style={styles.secondaryBtnText}>Create Account</Text>
              </TouchableOpacity>

              {/* Microcopy */}
              <Text style={styles.microcopy} numberOfLines={2}>
                By signing in, you agree to keep your credentials secure and follow local policies.
              </Text>
            </View>

            {/* Footer bullets (single line so page stays fixed) */}
            <View style={styles.footerRow}>
              <View style={styles.footerItem}>
                <MaterialIcons name="verified-user" size={16} color={GREEN} />
                <Text style={styles.footerText}>Secure</Text>
              </View>
              <View style={styles.footerItem}>
                <MaterialIcons name="insights" size={16} color={GREEN} />
                <Text style={styles.footerText}>Insights</Text>
              </View>
              <View style={styles.footerItem}>
                <MaterialIcons name="cloud-done" size={16} color={GREEN} />
                <Text style={styles.footerText}>Offline</Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    position: 'relative',
  },
  full: { flex: 1 },

  // Decorative soft shapes (no perf hit)
  bgDecorTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#E8F5E9',
    opacity: 0.8,
  },
  bgDecorBottom: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#E0F2FE',
    opacity: 0.7,
  },

  container: {
    flex: 1,
    paddingHorizontal: 18,
    // Perfectly balanced vertical layout (no scroll)
    justifyContent: 'space-between',
    paddingVertical: 16,
  },

  hero: { alignItems: 'center' },
  logo: { width: 120, height: 120 },
  title: { fontSize: 22, fontWeight: '800', color: TEXT_DARK, marginTop: 6 },
  subtitle: { fontSize: 12, color: TEXT_MUTED, textAlign: 'center', marginTop: 4 },

  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  inputLabel: { fontSize: 12, color: TEXT_MUTED, marginBottom: 6, marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  inputIcon: { marginRight: 6 },
  input: { flex: 1, color: TEXT_DARK, paddingVertical: 10, fontSize: 14 },
  eye: { padding: 6, marginLeft: 4 },

  errorText: { color: '#DC2626', fontSize: 12, marginTop: 6, marginLeft: 2 },
  authError: { color: '#DC2626', fontSize: 13, marginTop: 6, marginBottom: 6, textAlign: 'center' },

  optionsRow: {
    marginTop: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: TEXT_DARK,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  checkboxText: { color: TEXT_DARK, fontSize: 12, fontWeight: '600' },

  link: { color: GREEN, fontSize: 12, fontWeight: '800' },

  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#F2FBF3',
    marginTop: 10,
  },
  secondaryBtnText: { color: GREEN, fontWeight: '800', fontSize: 15 },

  microcopy: { marginTop: 10, color: TEXT_MUTED, fontSize: 11, textAlign: 'center' },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 16,
    alignItems: 'center',
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', columnGap: 6 },
  footerText: { color: TEXT_DARK, fontSize: 12, fontWeight: '700' },
});

export default Login;
