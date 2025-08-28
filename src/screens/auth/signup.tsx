import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TextInput,
  Image,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../types';
import { StackNavigationProp } from '@react-navigation/stack';

/* ===== Theme ===== */
const GREEN = '#1f720d';
const TEXT_DARK = '#0B1220';
const TEXT_MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const SURFACE = '#FFFFFF';
const BG = '#F5F7FA';

type Nav = StackNavigationProp<RootStackParamList, 'Login'>;

/* ===== Helpers (PK formats) ===== */
const maskCNIC = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 13);
  const a = d.slice(0, 5);
  const b = d.slice(5, 12);
  const c = d.slice(12);
  let out = a;
  if (b) out += '-' + b;
  if (c) out += '-' + c;
  return out;
};
const maskPhonePK = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.startsWith('03')) {
    const a = d.slice(0, 4);
    const b = d.slice(4);
    return b ? `${a}-${b}` : a;
  }
  return d;
};

// Put this where RoleSelector is defined (same file)
import { useWindowDimensions } from 'react-native';

function RoleSelector({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const { width } = useWindowDimensions();
  const twoCol = width < 360; // tweak breakpoint if you like
  const pillColStyle = twoCol ? styles.rolePill2Col : styles.rolePill3Col;

  const options = [
    { id: 'Fisherman', label: 'Fisherman', icon: 'sailing' },
    { id: 'Middleman', label: 'Middleman', icon: 'handshake' },
    { id: 'Exporter', label: 'Exporter', icon: 'local-shipping' },
    { id: 'MFD', label: 'MFD', icon: 'admin-panel-settings' },
    { id: 'FCS', label: 'FCS', icon: 'account-balance' },
  ];

  return (
    <View style={styles.rolesRow}>
      {options.map(opt => {
        const active = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onChange(opt.id)}
            activeOpacity={0.9}
            style={[styles.rolePill, pillColStyle, active && styles.rolePillActive]}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
          >
            <MaterialIcons
              name={opt.icon as any}
              size={16}
              color={active ? '#FFFFFF' : GREEN}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.rolePillText, active && styles.rolePillTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


const SignUp = () => {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [cnic, setCnic] = useState('');
  const [job, setJob] = useState<string | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showCPass, setShowCPass] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    cnic?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phoneNumber?: string;
  }>({});

  const handleImagePress = async () => {
    const options: {
      text: string;
      onPress: () => Promise<void>;
      style?: 'default' | 'cancel' | 'destructive';
    }[] = [
      {
        text: 'Take Your Photo',
        onPress: async () => {
          const response = await launchCamera({ mediaType: 'photo' });
          handleImgResponse(response);
        },
      },
      {
        text: 'Choose From Gallery',
        onPress: async () => {
          const response = await launchImageLibrary({ mediaType: 'photo' });
          handleImgResponse(response);
        },
      },
    ];
    if (imageUri) {
      options.push({
        text: 'Remove Photo',
        onPress: async () => setImageUri(null),
        style: 'destructive',
      });
    }
    Alert.alert('Select Option', 'Choose Image Source', options);
  };

  const handleImgResponse = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorCode) return;
    if (response.assets && response.assets.length > 0) {
      setImageUri(response.assets[0].uri ?? null);
    }
  };

  const handleSignUp = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Name is required.';
    if (!cnic.trim()) newErrors.cnic = 'CNIC is required.';
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number is required.';
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Enter a valid email address.';
    if (!password) newErrors.password = 'Password is required.';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm your password.';
    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);

      Alert.alert(`Signed up as: ${name} (${job || 'No role selected'})`);
    }, 1200);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.root}>
        {/* Soft background shapes */}
        <View style={styles.bgDecorTop} />
        <View style={styles.bgDecorBottom} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.hero}>
              <Image
                source={require('../../assets/images/MFD.png')}
                style={styles.emblem}
                resizeMode="contain"
              />
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>
                Join the Marine Fisheries Portal to manage trips, activities and lots — all in one place.
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              {/* Photo */}
              <View style={styles.photoWrap}>
                <TouchableOpacity onPress={handleImagePress} activeOpacity={0.9}>
                  <Image
                    style={styles.profileImage}
                    source={
                      imageUri
                        ? { uri: imageUri }
                        : require('../../assets/images/placeholderIMG.png')
                    }
                  />
                  <View style={styles.cameraBadge}>
                    <MaterialIcons name="photo-camera" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.imgText}>Tap to add your profile photo</Text>
              </View>

              {/* Name */}
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="badge" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  placeholder="Your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={t => {
                    setName(t);
                    if (errors.name) setErrors(p => ({ ...p, name: '' }));
                  }}
                  style={styles.input}
                  returnKeyType="next"
                />
              </View>
              {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              {/* CNIC */}
              <Text style={styles.inputLabel}>CNIC</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="badge" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  placeholder="12345-1234567-1"
                  placeholderTextColor="#9CA3AF"
                  value={cnic}
                  onChangeText={t => {
                    const v = maskCNIC(t);
                    setCnic(v);
                    if (errors.cnic) setErrors(p => ({ ...p, cnic: '' }));
                  }}
                  keyboardType="number-pad"
                  maxLength={15}
                  style={styles.input}
                />
              </View>
              {!!errors.cnic && <Text style={styles.errorText}>{errors.cnic}</Text>}

              {/* Role (custom pills — NO overflow) */}
              <Text style={styles.inputLabel}>I am a</Text>
              <RoleSelector value={job} onChange={setJob} />

              {/* Phone */}
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="call" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  placeholder="03XX-XXXXXXX"
                  placeholderTextColor="#9CA3AF"
                  value={phoneNumber}
                  onChangeText={t => {
                    const v = maskPhonePK(t);
                    setPhoneNumber(v);
                    if (errors.phoneNumber) setErrors(p => ({ ...p, phoneNumber: '' }));
                  }}
                  keyboardType="number-pad"
                  maxLength={12}
                  style={styles.input}
                />
              </View>
              {!!errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

              {/* Email */}
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="mail-outline" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={t => {
                    setEmail(t);
                    if (errors.email) setErrors(p => ({ ...p, email: '' }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
              {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              {/* Password */}
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="lock-outline" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={t => {
                    setPassword(t);
                    if (errors.password) setErrors(p => ({ ...p, password: '' }));
                  }}
                  secureTextEntry={!showPass}
                  style={styles.input}
                  returnKeyType="next"
                />
                <TouchableOpacity style={styles.eye} onPress={() => setShowPass(s => !s)}>
                  <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={20} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>
              {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              {/* Confirm Password */}
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="lock-outline" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={t => {
                    setConfirmPassword(t);
                    if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: '' }));
                  }}
                  secureTextEntry={!showCPass}
                  style={styles.input}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.eye} onPress={() => setShowCPass(s => !s)}>
                  <MaterialIcons name={showCPass ? 'visibility-off' : 'visibility'} size={20} color={TEXT_MUTED} />
                </TouchableOpacity>
              </View>
              {!!errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

              {/* CTAs */}
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={loading}
                style={[styles.primaryBtn, loading && { opacity: 0.85 }]}
                activeOpacity={0.9}
              >
                <MaterialIcons name="person-add-alt" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>{loading ? 'Creating…' : 'Create Account'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setName('');
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setCnic('');
                  setPhoneNumber('');
                  setErrors({});
                  navigation.goBack();
                }}
                style={styles.secondaryBtn}
                activeOpacity={0.9}
              >
                <MaterialIcons name="close" size={18} color={GREEN} style={{ marginRight: 8 }} />
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>

              <Text style={styles.microcopy}>
                By creating an account, you agree to keep your information accurate and follow local regulations.
              </Text>

              {/* Already have account */}
              <View style={styles.switchRow}>
                <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login' as any)}>
                  <Text style={styles.link}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scrollContainer: { paddingHorizontal: 16, paddingVertical: 18 },

  /* Hero */
  hero: {
    alignItems: 'center',
    backgroundColor: GREEN,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  emblem: { width: 84, height: 84, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '800', color: SURFACE },
  subtitle: { fontSize: 12, color: SURFACE, textAlign: 'center', marginTop: 4 },

  /* Card */
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

  /* Photo */
  photoWrap: { alignItems: 'center', marginBottom: 6 },
  profileImage: {
    height: 112,
    width: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: GREEN,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: GREEN,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  imgText: { textAlign: 'center', fontWeight: '700', color: TEXT_MUTED, marginTop: 8, marginBottom: 8 },

  /* Inputs */
  inputLabel: { fontSize: 12, color: TEXT_MUTED, marginTop: 8, marginBottom: 6, marginLeft: 2 },
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
   rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 6,
    // no gap for max RN support
  },
  rolePill: {
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: GREEN,
    borderRadius: 12,
    backgroundColor: '#F2FBF3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* 2 columns on narrow screens */
  rolePill2Col: {
    flexBasis: '48%',
    maxWidth: '48%',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  /* 3 columns on wider screens */
  rolePill3Col: {
    flexBasis: '31%',
    maxWidth: '45%',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  rolePillActive: { backgroundColor: GREEN },
  rolePillText: {
    color: GREEN,
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
  },
  rolePillTextActive: { color: '#FFFFFF' },

  /* Role: equal width pills (no overflow) */
  
  /* Errors */
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 6, marginLeft: 2 },

  /* Buttons */
  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 12,
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
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  link: { color: GREEN, fontSize: 12, fontWeight: '800' },

  /* Soft shapes */
  bgDecorTop: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#E8F5E9',
    opacity: 0.8,
  },
  bgDecorBottom: {
    position: 'absolute',
    bottom: -110,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#E0F2FE',
    opacity: 0.7,
  },
});

export default SignUp;
