import React, { useRef, useState } from 'react';
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
  Keyboard,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { registerUser, type CreateUserBody } from '../../services/users';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { isRTL, getTextAlign } from '../../utils/rtl';

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
  const { t } = useTranslation();
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
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formLevelError, setFormLevelError] = useState<string>('');
  const scrollRef = useRef<ScrollView>(null);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Input styles (no red borders — errors shown as text only)
  const getInputStyle = (fieldName: string) => [styles.input];
  const getPasswordInputStyle = (fieldName: string) => [styles.passwordInput];

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
    const hasAnyError = Object.keys(newErrors).length > 0;
    if (hasAnyError) {
      const firstMessage = Object.values(newErrors)[0];
      setFormLevelError(firstMessage || 'Please review the highlighted fields.');
      // Ensure user sees the alert
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      });
    } else {
      setFormLevelError('');
    }
    return !hasAnyError;
  };

  // Map form user types to API user types
  const mapUserTypeToAPI = (userType: UserType | null): string | undefined => {
    const mapping: Record<UserType, string> = {
      'Fisherman': 'fishermen',  // Backend expects 'fishermen' (plural)
      'FCS': 'fcs',
      'Middleman': 'middle_man',
      'Exporter': 'exporter',
      'MFD': 'mfd_staff',
    };
    return userType ? mapping[userType] : undefined;
  };


  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({}); // Clear any existing errors
    
    try {
      // Prepare the user data for API
      const userData: CreateUserBody = {
        name: formData.displayName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        user_type: mapUserTypeToAPI(formData.userType),
        phone: formData.phoneNumber,
        first_name: formData.firstName,
        last_name: formData.lastName,
        display_name: formData.displayName,
        is_verified: false,
        is_active: true,
      };

      // Add user-type specific fields
      if (formData.userType === 'Fisherman') {
        userData.boat_registration_number = formData.boatRegistrationNumber;
        userData.fishing_zone = formData.fishingZone;
        userData.port_location = formData.portLocation;
      }

      if (formData.userType === 'FCS') {
        userData.fcs_name = formData.fcsName;
        userData.fcs_license_number = formData.fcsLicenseNumber;
        userData.fcs_address = formData.fcsAddress;
        userData.fcs_phone = formData.fcsPhone;
        userData.fcs_email = formData.fcsEmail;
      }

      if (formData.userType === 'Middleman') {
        userData.company_name = formData.companyName;
        userData.fcs_license_number_middleman = formData.fcsLicenseNumberMiddleman;
        userData.business_address = formData.businessAddress;
        userData.business_phone = formData.businessPhone;
        userData.business_email = formData.businessEmail;
      }

      if (formData.userType === 'Exporter') {
        userData.company_name_exporter = formData.companyNameExporter;
        userData.export_license_number = formData.exportLicenseNumber;
        userData.business_address_exporter = formData.businessAddressExporter;
        userData.business_phone_exporter = formData.businessPhoneExporter;
        userData.business_email_exporter = formData.businessEmailExporter;
      }

      if (formData.userType === 'MFD') {
        userData.mfd_employee_id = formData.mfdEmployeeId;
      }

      // Debug: Log the user data being sent
      console.log('Sending user data:', JSON.stringify(userData, null, 2));
      
      // Call the API
      await registerUser(userData);
      
      Toast.show({
        type: 'success',
        text1: 'Account Created Successfully!',
        text2: `Your account has been created. Please wait for admin approval before you can login.`,
        visibilityTime: 4000,
        autoHide: true,
        onHide: () => navigation.navigate('Login' as any)
      });
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle server validation errors
      if (error?.response?.errors) {
        const serverErrors: Record<string, string> = {};
        
        // Map server field names to form field names
        const fieldMapping: Record<string, string> = {
          'first_name': 'firstName',
          'last_name': 'lastName',
          'display_name': 'displayName',
          'phone': 'phoneNumber',
          'email': 'email',
          'password': 'password',
          'password_confirmation': 'confirmPassword',
          'user_type': 'userType',
          'boat_registration_number': 'boatRegistrationNumber',
          'fishing_zone': 'fishingZone',
          'port_location': 'portLocation',
          'fcs_name': 'fcsName',
          'fcs_license_number': 'fcsLicenseNumber',
          'fcs_address': 'fcsAddress',
          'fcs_phone': 'fcsPhone',
          'fcs_email': 'fcsEmail',
          'company_name': 'companyName',
          'fcs_license_number_middleman': 'fcsLicenseNumberMiddleman',
          'business_address': 'businessAddress',
          'business_phone': 'businessPhone',
          'business_email': 'businessEmail',
          'company_name_exporter': 'companyNameExporter',
          'export_license_number': 'exportLicenseNumber',
          'business_address_exporter': 'businessAddressExporter',
          'business_phone_exporter': 'businessPhoneExporter',
          'business_email_exporter': 'businessEmailExporter',
          'mfd_employee_id': 'mfdEmployeeId',
        };
        
        // Process server validation errors
        Object.entries(error.response.errors).forEach(([serverField, messages]) => {
          const formField = fieldMapping[serverField] || serverField;
          const errorMessage = Array.isArray(messages) ? messages[0] : String(messages);
          serverErrors[formField] = errorMessage;
        });
        
        setErrors(serverErrors);
        const firstError = Object.values(serverErrors)[0];
        setFormLevelError(firstError || 'Please check the form for errors.');
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        });
      } else {
        // Handle other types of errors
        const statusText = error?.response?.status ? ` (Code ${error.response.status})` : '';
        const message = error?.message || 'Failed to create account. Please try again.';
        setFormLevelError(`Account creation failed${statusText}. ${message}`);
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        });
      }
    } finally {
      setLoading(false);
    }
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
            style={getInputStyle('firstName')}
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
            style={getInputStyle('lastName')}
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
            style={getInputStyle('displayName')}
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
                  style={getInputStyle('phoneNumber')}
            placeholder="Enter phone number"
            placeholderTextColor={PLACEHOLDER}
            value={formData.phoneNumber}
            onChangeText={(value) => updateFormData('phoneNumber', value)}
                />
                {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
              </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
            style={getInputStyle('email')}
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
              style={getPasswordInputStyle('password')}
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
              style={getPasswordInputStyle('confirmPassword')}
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
    <View style={styles.container}>
        <LanguageSwitcher />
        <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image
              source={require('../../assets/images/MFD.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={[styles.portalTitle, { textAlign: getTextAlign() }]}>{t('auth.portalTitle')}</Text>
            <Text style={[styles.portalDescription, { textAlign: getTextAlign() }]}>"{t('auth.signUpSubtitle')}"</Text>
            <View style={[styles.poweredByRow, isRTL() && { flexDirection: 'row-reverse' }]}>
              <MaterialIcons name="account-balance" size={16} color={TEXT_MUTED} />
              <Text style={[styles.poweredByText, { textAlign: getTextAlign() }]}>{t('auth.poweredBy')}</Text>
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
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'interactive'}
              showsVerticalScrollIndicator={false}
              ref={scrollRef}
            >
              {!!formLevelError && (
                <View style={styles.formAlert}>
                  <View style={styles.formAlertHeader}>
                    <MaterialIcons name="error-outline" size={20} color="#DC2626" />
                    <Text style={styles.formAlertTitle}>We found some issues</Text>
                    <TouchableOpacity onPress={() => setFormLevelError('')} style={styles.formAlertDismiss}>
                      <MaterialIcons name="close" size={18} color={TEXT_MUTED} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.formAlertText}>{formLevelError}</Text>
                </View>
              )}
              <View style={styles.formHeader}>
                <Text style={[styles.title, { textAlign: getTextAlign() }]}>{t('auth.signUpTitle')}</Text>
                <Text style={[styles.subtitle, { textAlign: getTextAlign() }]}>{t('auth.signUpSubtitle')}</Text>
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

              {/* Validation Error Alert removed as requested */}

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
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 6,
    minHeight: 140,
  },
  headerLogo: { width: 120, height: 120 },
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
    color: TEXT_DARK,
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
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.9,
  },
  poweredByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent'
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
    fontSize: 11,
    color: TEXT_MUTED,
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
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
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: TEXT_DARK,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: TEXT_DARK,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  inputError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  validationErrorAlert: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    marginHorizontal: 4,
  },
  validationErrorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  validationErrorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginLeft: 8,
  },
  validationErrorSubtitle: {
    fontSize: 14,
    color: '#7F1D1D',
    marginBottom: 8,
  },
  validationErrorList: {
    marginLeft: 8,
  },
  validationErrorItem: {
    fontSize: 13,
    color: '#7F1D1D',
    marginBottom: 4,
    lineHeight: 18,
  },
  validationErrorMore: {
    fontSize: 12,
    color: '#7F1D1D',
    opacity: 0.9,
  },
  formAlert: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  formAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  formAlertTitle: {
    flex: 1,
    marginLeft: 8,
    color: '#7F1D1D',
    fontSize: 14,
    fontWeight: '700',
  },
  formAlertDismiss: {
    padding: 4,
  },
  formAlertText: {
    color: '#7F1D1D',
    fontSize: 12,
  },
  buttonContainer: {
    marginTop: 24,
  },
  createButton: {
    backgroundColor: GREEN,
    borderRadius: 12,
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
    borderRadius: 12,
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