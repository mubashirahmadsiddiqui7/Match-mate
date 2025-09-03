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
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../types';
import { StackNavigationProp } from '@react-navigation/stack';

/* ===== Theme ===== */
const GREEN = '#1f720d';
const GREEN_LIGHT = '#E8F5E9';
const TEXT_DARK = '#0B1220';
const TEXT_MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const PLACEHOLDER = '#9CA3AF';

type Nav = StackNavigationProp<RootStackParamList, 'Login'>;

type UserType = 'Fisherman' | 'FCS' | 'Middleman' | 'Exporter' | 'MFD';

interface FormData {
  // Account Type
  userType: UserType | null;
  
  // Fisherman Details
  boatRegistrationNumber: string;
  fishingZone: string;
  portLocation: string;
  
  // FCS Details
  fcsName: string;
  fcsLicenseNumber: string;
  fcsAddress: string;
  fcsPhone: string;
  fcsEmail: string;
  
  // Middleman Details
  companyName: string;
  fcsLicenseNumberMiddleman: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  
  // Exporter Details
  companyNameExporter: string;
  exportLicenseNumber: string;
  businessAddressExporter: string;
  businessPhoneExporter: string;
  businessEmailExporter: string;
  
  // MFD Details
  mfdEmployeeId: string;
  
  // Personal Information
  firstName: string;
  lastName: string;
  displayName: string;
  
  // Contact Information
  phoneNumber: string;
  email: string;
  
  // Security
  password: string;
  confirmPassword: string;
}

const SignUp = () => {
  const navigation = useNavigation<Nav>();
  
  const [formData, setFormData] = useState<FormData>({
    userType: null,
    boatRegistrationNumber: '',
    fishingZone: '',
    portLocation: '',
    fcsName: '',
    fcsLicenseNumber: '',
    fcsAddress: '',
    fcsPhone: '',
    fcsEmail: '',
    companyName: '',
    fcsLicenseNumberMiddleman: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    companyNameExporter: '',
    exportLicenseNumber: '',
    businessAddressExporter: '',
    businessPhoneExporter: '',
    businessEmailExporter: '',
    mfdEmployeeId: '',
    firstName: '',
    lastName: '',
    displayName: '',
    phoneNumber: '+92 XXX XXXXXXX',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields for all users
    if (!formData.userType) newErrors.userType = 'Please select an account type';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.displayName.trim()) newErrors.displayName = 'Display name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Conditional validation based on user type
    if (formData.userType === 'Fisherman') {
      if (!formData.boatRegistrationNumber.trim()) newErrors.boatRegistrationNumber = 'Boat registration number is required';
      if (!formData.fishingZone.trim()) newErrors.fishingZone = 'Fishing zone is required';
      if (!formData.portLocation.trim()) newErrors.portLocation = 'Port location is required';
    }

    if (formData.userType === 'FCS') {
      if (!formData.fcsName.trim()) newErrors.fcsName = 'FCS name is required';
      if (!formData.fcsLicenseNumber.trim()) newErrors.fcsLicenseNumber = 'FCS license number is required';
      if (!formData.fcsAddress.trim()) newErrors.fcsAddress = 'Address is required';
      if (!formData.fcsPhone.trim()) newErrors.fcsPhone = 'Phone is required';
      if (!formData.fcsEmail.trim()) newErrors.fcsEmail = 'Email is required';
    }

    if (formData.userType === 'Middleman') {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!formData.fcsLicenseNumberMiddleman.trim()) newErrors.fcsLicenseNumberMiddleman = 'FCS license number is required';
      if (!formData.businessAddress.trim()) newErrors.businessAddress = 'Business address is required';
      if (!formData.businessPhone.trim()) newErrors.businessPhone = 'Business phone is required';
      if (!formData.businessEmail.trim()) newErrors.businessEmail = 'Business email is required';
    }

    if (formData.userType === 'Exporter') {
      if (!formData.companyNameExporter.trim()) newErrors.companyNameExporter = 'Company name is required';
      if (!formData.exportLicenseNumber.trim()) newErrors.exportLicenseNumber = 'Export license number is required';
      if (!formData.businessAddressExporter.trim()) newErrors.businessAddressExporter = 'Business address is required';
      if (!formData.businessPhoneExporter.trim()) newErrors.businessPhoneExporter = 'Business phone is required';
      if (!formData.businessEmailExporter.trim()) newErrors.businessEmailExporter = 'Business email is required';
    }

    if (formData.userType === 'MFD') {
      if (!formData.mfdEmployeeId.trim()) newErrors.mfdEmployeeId = 'MFD employee ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', `Account created successfully for ${formData.displayName} (${formData.userType})`);
    }, 1500);
  };

  const renderUserTypeSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="person" size={20} color={GREEN} />
        <Text style={styles.sectionTitle}>Account Type</Text>
      </View>
      <View style={styles.userTypeGrid}>
        {(['Fisherman', 'FCS', 'Middleman', 'Exporter', 'MFD'] as UserType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.userTypeCard,
              formData.userType === type && styles.userTypeCardActive
            ]}
            onPress={() => updateFormData('userType', type)}
          >
            <View style={styles.radioButton}>
              {formData.userType === type && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={[
              styles.userTypeText,
              formData.userType === type && styles.userTypeTextActive
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.userType && <Text style={styles.errorText}>{errors.userType}</Text>}
    </View>
  );

  const renderFishermanSection = () => {
    if (formData.userType !== 'Fisherman') return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="sailing" size={20} color={GREEN} />
          <Text style={styles.sectionTitle}>Fishermen Details</Text>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Boat Registration Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter boat registration number"
              placeholderTextColor={PLACEHOLDER}
              value={formData.boatRegistrationNumber}
              onChangeText={(value) => updateFormData('boatRegistrationNumber', value)}
            />
            {errors.boatRegistrationNumber && <Text style={styles.errorText}>{errors.boatRegistrationNumber}</Text>}
          </View>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fishing Zone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter fishing zone"
              placeholderTextColor={PLACEHOLDER}
              value={formData.fishingZone}
              onChangeText={(value) => updateFormData('fishingZone', value)}
            />
            {errors.fishingZone && <Text style={styles.errorText}>{errors.fishingZone}</Text>}
          </View>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Port Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter port location"
              placeholderTextColor={PLACEHOLDER}
              value={formData.portLocation}
              onChangeText={(value) => updateFormData('portLocation', value)}
            />
            {errors.portLocation && <Text style={styles.errorText}>{errors.portLocation}</Text>}
          </View>
                  </View>
              </View>
    );
  };

  const renderFCSSection = () => {
    if (formData.userType !== 'FCS') return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="account-balance" size={20} color={GREEN} />
          <Text style={styles.sectionTitle}>FCS</Text>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>FCS Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter FCS name"
              placeholderTextColor={PLACEHOLDER}
              value={formData.fcsName}
              onChangeText={(value) => updateFormData('fcsName', value)}
            />
            {errors.fcsName && <Text style={styles.errorText}>{errors.fcsName}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>FCS License Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter FCS license number"
              placeholderTextColor={PLACEHOLDER}
              value={formData.fcsLicenseNumber}
              onChangeText={(value) => updateFormData('fcsLicenseNumber', value)}
            />
            {errors.fcsLicenseNumber && <Text style={styles.errorText}>{errors.fcsLicenseNumber}</Text>}
          </View>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter address"
              placeholderTextColor={PLACEHOLDER}
              value={formData.fcsAddress}
              onChangeText={(value) => updateFormData('fcsAddress', value)}
            />
            {errors.fcsAddress && <Text style={styles.errorText}>{errors.fcsAddress}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone"
              placeholderTextColor={PLACEHOLDER}
              value={formData.fcsPhone}
              onChangeText={(value) => updateFormData('fcsPhone', value)}
            />
            {errors.fcsPhone && <Text style={styles.errorText}>{errors.fcsPhone}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
              placeholder="Enter email"
              placeholderTextColor={PLACEHOLDER}
              value={formData.fcsEmail}
              onChangeText={(value) => updateFormData('fcsEmail', value)}
                />
            {errors.fcsEmail && <Text style={styles.errorText}>{errors.fcsEmail}</Text>}
          </View>
        </View>
              </View>
    );
  };

  const renderMiddlemanSection = () => {
    if (formData.userType !== 'Middleman') return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="business" size={20} color={GREEN} />
          <Text style={styles.sectionTitle}>Middle Man</Text>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter company name"
              placeholderTextColor={PLACEHOLDER}
              value={formData.companyName}
              onChangeText={(value) => updateFormData('companyName', value)}
            />
            {errors.companyName && <Text style={styles.errorText}>{errors.companyName}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>FCS License Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter FCS license number"
              placeholderTextColor={PLACEHOLDER}
              value={formData.fcsLicenseNumberMiddleman}
              onChangeText={(value) => updateFormData('fcsLicenseNumberMiddleman', value)}
            />
            {errors.fcsLicenseNumberMiddleman && <Text style={styles.errorText}>{errors.fcsLicenseNumberMiddleman}</Text>}
          </View>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Business Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business address"
              placeholderTextColor={PLACEHOLDER}
              value={formData.businessAddress}
              onChangeText={(value) => updateFormData('businessAddress', value)}
            />
            {errors.businessAddress && <Text style={styles.errorText}>{errors.businessAddress}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Business Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business phone"
              placeholderTextColor={PLACEHOLDER}
              value={formData.businessPhone}
              onChangeText={(value) => updateFormData('businessPhone', value)}
            />
            {errors.businessPhone && <Text style={styles.errorText}>{errors.businessPhone}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Business Email</Text>
                <TextInput
                  style={styles.input}
              placeholder="Enter business email"
              placeholderTextColor={PLACEHOLDER}
              value={formData.businessEmail}
              onChangeText={(value) => updateFormData('businessEmail', value)}
                />
            {errors.businessEmail && <Text style={styles.errorText}>{errors.businessEmail}</Text>}
          </View>
        </View>
              </View>
    );
  };

  const renderExporterSection = () => {
    if (formData.userType !== 'Exporter') return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="local-shipping" size={20} color={GREEN} />
          <Text style={styles.sectionTitle}>Exporter</Text>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter company name"
              placeholderTextColor={PLACEHOLDER}
              value={formData.companyNameExporter}
              onChangeText={(value) => updateFormData('companyNameExporter', value)}
            />
            {errors.companyNameExporter && <Text style={styles.errorText}>{errors.companyNameExporter}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Export License Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter export license number"
              placeholderTextColor={PLACEHOLDER}
              value={formData.exportLicenseNumber}
              onChangeText={(value) => updateFormData('exportLicenseNumber', value)}
            />
            {errors.exportLicenseNumber && <Text style={styles.errorText}>{errors.exportLicenseNumber}</Text>}
          </View>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Business Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business address"
              placeholderTextColor={PLACEHOLDER}
              value={formData.businessAddressExporter}
              onChangeText={(value) => updateFormData('businessAddressExporter', value)}
            />
            {errors.businessAddressExporter && <Text style={styles.errorText}>{errors.businessAddressExporter}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Business Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business phone"
              placeholderTextColor={PLACEHOLDER}
              value={formData.businessPhoneExporter}
              onChangeText={(value) => updateFormData('businessPhoneExporter', value)}
            />
            {errors.businessPhoneExporter && <Text style={styles.errorText}>{errors.businessPhoneExporter}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Business Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business email"
              placeholderTextColor={PLACEHOLDER}
              value={formData.businessEmailExporter}
              onChangeText={(value) => updateFormData('businessEmailExporter', value)}
            />
            {errors.businessEmailExporter && <Text style={styles.errorText}>{errors.businessEmailExporter}</Text>}
          </View>
        </View>
      </View>
    );
  };

  const renderMFDSection = () => {
    if (formData.userType !== 'MFD') return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="admin-panel-settings" size={20} color={GREEN} />
          <Text style={styles.sectionTitle}>MFD Staff</Text>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>MFD Employee ID *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter MFD employee ID"
              placeholderTextColor={PLACEHOLDER}
              value={formData.mfdEmployeeId}
              onChangeText={(value) => updateFormData('mfdEmployeeId', value)}
            />
            {errors.mfdEmployeeId && <Text style={styles.errorText}>{errors.mfdEmployeeId}</Text>}
          </View>
        </View>
      </View>
    );
  };

  const renderPersonalInfoSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="person" size={20} color={GREEN} />
        <Text style={styles.sectionTitle}>Personal Information</Text>
      </View>
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter first name"
            placeholderTextColor={PLACEHOLDER}
            value={formData.firstName}
            onChangeText={(value) => updateFormData('firstName', value)}
          />
          {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter last name"
            placeholderTextColor={PLACEHOLDER}
            value={formData.lastName}
            onChangeText={(value) => updateFormData('lastName', value)}
          />
          {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
        </View>
      </View>
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Display Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter display name"
            placeholderTextColor={PLACEHOLDER}
            value={formData.displayName}
            onChangeText={(value) => updateFormData('displayName', value)}
          />
          {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}
        </View>
      </View>
    </View>
  );

  const renderContactSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="mail" size={20} color={GREEN} />
        <Text style={styles.sectionTitle}>Contact Information</Text>
      </View>
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
            placeholder="+92 XXX XXXXXXX"
            placeholderTextColor={PLACEHOLDER}
            value={formData.phoneNumber}
            onChangeText={(value) => updateFormData('phoneNumber', value)}
                />
              </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor={PLACEHOLDER}
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>
      </View>
              </View>
  );

  const renderSecuritySection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="lock" size={20} color={GREEN} />
        <Text style={styles.sectionTitle}>Security</Text>
      </View>
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password *</Text>
          <View style={styles.passwordContainer}>
                <TextInput
              style={styles.passwordInput}
              placeholder="Create password"
              placeholderTextColor={PLACEHOLDER}
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialIcons 
                name={showPassword ? 'visibility-off' : 'visibility'} 
                size={20} 
                color={TEXT_MUTED} 
              />
                </TouchableOpacity>
              </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Password *</Text>
          <View style={styles.passwordContainer}>
                <TextInput
              style={styles.passwordInput}
              placeholder="Confirm password"
              placeholderTextColor={PLACEHOLDER}
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <MaterialIcons 
                name={showConfirmPassword ? 'visibility-off' : 'visibility'} 
                size={20} 
                color={TEXT_MUTED} 
              />
                </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        </View>
      </View>
    </View>
  );

    return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.leftSection}>
              <View style={styles.logo}>
                <MaterialIcons name="waves" size={24} color={GREEN} />
              </View>
            </View>
            <View style={styles.centerSection}>
              <Text style={styles.portalTitle}>MFD Portal</Text>
              <Text style={styles.portalSubtitle}>MARINE FISHERIES DEPARTMENT</Text>
              <Text style={styles.portalDescription}>
                Join the Professional Fisheries Management Community
              </Text>
            </View>
            <View style={styles.rightSection}>
              <View style={styles.poweredBy}>
                <MaterialIcons name="flash-on" size={14} color="#fff" />
                <Text style={styles.poweredByText}>Powered by: Government of Pakistan</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Content */}
        <View style={styles.content}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formHeader}>
                <Text style={styles.title}>Create Professional Account</Text>
                <Text style={styles.subtitle}>Join the Marine Fisheries Department portal</Text>
              </View>

              {renderUserTypeSection()}
              {renderFishermanSection()}
              {renderFCSSection()}
              {renderMiddlemanSection()}
              {renderExporterSection()}
              {renderMFDSection()}
              {renderPersonalInfoSection()}
              {renderContactSection()}
              {renderSecuritySection()}

              <View style={styles.buttonContainer}>
              <TouchableOpacity
                  style={[styles.createButton, loading && styles.createButtonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
                >
                  <MaterialIcons name="person-add" size={20} color="#fff" />
                  <Text style={styles.createButtonText}>
                    {loading ? 'Creating...' : 'Create Professional Account'}
                  </Text>
              </TouchableOpacity>

                <Text style={styles.loginPrompt}>Already have an account?</Text>

              <TouchableOpacity
                  style={styles.signInButton}
                  onPress={() => navigation.navigate('Login' as any)}
                >
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                  <Text style={styles.signInButtonText}>Sign In</Text>
                </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: GREEN,
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80,
  },
  leftSection: {
    width: 60,
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GREEN,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  portalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  portalSubtitle: {
    fontSize: 11,
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.5,
    textAlign: 'center',
    opacity: 0.9,
  },
  portalDescription: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
  rightSection: {
    width: 60,
    alignItems: 'flex-end',
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  poweredByText: {
    fontSize: 9,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formHeader: {
    marginBottom: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GREEN,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
    marginLeft: 8,
  },
  userTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  userTypeCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTypeCardActive: {
    borderColor: GREEN,
    backgroundColor: GREEN_LIGHT,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GREEN,
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_DARK,
  },
  userTypeTextActive: {
    color: GREEN,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: TEXT_DARK,
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: TEXT_DARK,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 24,
  },
  createButton: {
    backgroundColor: GREEN,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loginPrompt: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 16,
  },
  signInButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SignUp;