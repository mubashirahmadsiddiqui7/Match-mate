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
  Button,
  Image,
  Alert
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';

type loginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
const Login = () => {
  const navigation = useNavigation<loginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(`Logged in as: ${email}`);
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
        <Image source={require('./assets/images/MFD.png')} style={styles.image} />
        <View style={styles.formContainer}>
          <View style={styles.loginHeader}>
            <Text style={styles.loginText}>Enter Login Details</Text>
          </View>

          <View style={styles.loginBox}>
            {/* Email Input */}
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#999999"
            />
            {emailError !== '' && (
              <Text style={styles.errorText}>{emailError}</Text>
            )}

            {/* Password Input */}
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#999999"
            />
            {passwordError !== '' && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}

            {/* Remember me and Forgot password */}
            <View style={styles.rememberRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[styles.checkbox, rememberMe && styles.checkedBox]}
                >
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Keep me logged in</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => Alert.alert('Forgot password pressed')}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Buttons */}
            <View style={styles.buttonColumn}>
              <View style={{ flex: 1, marginRight: 5, padding: 5 }}>
                <Button
                  title={loading ? 'Loading...' : 'LOGIN'}
                  onPress={handleLogin}
                  color="#1f720dff"
                />
              </View>
              <View style={{ flex: 1, marginRight: 5, padding: 5 }}>
                <Button
                  title="Create New Account"
                  onPress={() => {
                    setEmail('');
                    setPassword('');
                    navigation.navigate('SignUp');
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
    backgroundColor: '#ffffffff',
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  loginBox: {
    backgroundColor: '#ffffffff',
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
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#000000ff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkedBox: {
    backgroundColor: '#ffffffff',
    borderColor: '#49650fff',
  },
  checkmark: {
    color: '#000000ff',
    fontSize: 12,
  },
  rememberText: {
    color: '#000000ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  forgotPassword: {
    color: '#000000ff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonColumn: {
    flexDirection: 'column',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -5,
    marginLeft: 4,
  },
  loginText: {
    color: '#ffffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginHeader: {
    backgroundColor: '#1f720dff',
    paddingVertical: 15,
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  image:{
    width: 350,
    height: 350,
    alignSelf: 'center',
    margin: 70,
    marginTop: -10,
    marginBottom: 18,
  }
});

export default Login;
