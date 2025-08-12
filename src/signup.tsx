import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TextInput,
  Button,
  Image,
  Alert,
} from 'react-native';
import {
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import RadioGroup from 'react-native-radio-buttons-group';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';

const SignUp = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Login'>>();
  const [name, setName] = useState('');
  const [cnic, setCnic] = useState('');
  const [job, setJob] = useState<string | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
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

  const radioButtons = useMemo(
    () => [
      {
        id: '1',
        label: 'Fisherman',
        value: 'Fisherman',
        labelStyle: { fontSize: 12 },
      },
      {
        id: '2',
        label: 'Middleman',
        value: 'Middleman',
        labelStyle: { fontSize: 12 },
      },
      {
        id: '3',
        label: 'Exporter',
        value: 'Exporter',
        labelStyle: { fontSize: 12 },
      },
    ],
    [],
  );

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
        onPress: async () => {
          setImageUri(null);
        },
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
    const newErrors: {
      name?: string;
      cnic?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      phoneNumber?: string;
    } = {};

    if (!name.trim()) newErrors.name = 'Name is required.';
    if (!cnic.trim()) newErrors.cnic = 'CNIC is required.';
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number is required.';
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Enter a valid email address.';
    }
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
      Alert.alert(`Signed up as: ${name} (${job || 'No job selected'})`);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('./assets/images/EmblemGOP.png')}
          style={styles.image}
        />

        <View style={styles.formContainer}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Sign Up</Text>
          </View>

          <View style={styles.box}>
            {/* Profile Photo */}
            <TouchableOpacity onPress={handleImagePress}>
              <Image
                style={styles.profileImage}
                source={
                  imageUri
                    ? { uri: imageUri }
                    : require('./assets/images/placeholderIMG.png')
                }
              />
              <Text style={styles.imgText}>Upload Profile Photo</Text>
            </TouchableOpacity>

            {/* Name */}
            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={text => {
                setName(text);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              style={styles.input}
              placeholderTextColor="#999999"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            {/* CNIC */}
            <TextInput
              placeholder="CNIC"
              value={cnic}
              onChangeText={text => {
                setCnic(text);
                if (errors.cnic) setErrors(prev => ({ ...prev, cnic: '' }));
              }}
              style={styles.input}
              placeholderTextColor="#999999"
              keyboardType="numeric"
            />
            {errors.cnic && <Text style={styles.errorText}>{errors.cnic}</Text>}

            {/* Job Selection */}
            <View style={styles.radioGroup}>
              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
                I am a:
              </Text>
              <RadioGroup
                radioButtons={radioButtons}
                onPress={setJob}
                selectedId={job}
                layout="row"
              />
            </View>
            {/* Phone Number */}
            <TextInput
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={text => {
                setPhoneNumber(text);
                if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }));
              }}
              style={styles.input}
              placeholderTextColor="#999999"
              keyboardType="numeric"
            />
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            {/* Email */}
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#999999"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            {/* Password */}
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (errors.password)
                  setErrors(prev => ({ ...prev, password: '' }));
              }}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#999999"
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {/* Confirm Password */}
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                if (errors.confirmPassword)
                  setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#999999"
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Button
                  title={loading ? 'Loading...' : 'SAVE'}
                  onPress={handleSignUp}
                  color="#1f720dff"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Button
                  title="CANCEL"
                  onPress={() => {
                    setName('');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setErrors({});
                    navigation.goBack();
                  }}
                  color="#000000"
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  image: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#1f720dff',
    paddingVertical: 15,
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  profileImage: {
    height: 200,
    width: 200,
    borderRadius: 160,
    marginBottom: 5,
    alignSelf: 'center',
    borderColor: '#1f720dff',
    borderWidth: 1,
  },
  imgText: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  radioGroup: {
    alignItems: 'center',
    marginVertical: 10,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#000000ff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
});

export default SignUp;
