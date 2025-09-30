import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage, isCurrentLanguageRTL } from '../i18n';
import PALETTE from '../theme/palette';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.language || 'en').startsWith('ur') ? 'ur' : 'en';
  const isRTL = isCurrentLanguageRTL();
  const insets = useSafeAreaInsets();

  const switchLanguage = () => {
    const newLanguage = currentLanguage === 'ur' ? 'en' : 'ur';
    changeLanguage(newLanguage);
  };
  
  const containerStyle = {
    position: 'absolute' as const,
    bottom: Math.max(insets.bottom, 0) + 16,
    right: 16,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Pressable
        onPress={switchLanguage}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          isRTL && styles.rtlButton
        ]}
      >
        <Icon 
          name="language" 
          size={16} 
          color="#fff" 
          style={[styles.icon, isRTL && styles.rtlIcon]} 
        />
        <Text style={[styles.buttonText, isRTL && styles.rtlText]}>{currentLanguage === 'ur' ? 'English' : 'اردو'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', zIndex: 1000 },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  rtlButton: {
    flexDirection: 'row-reverse',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  icon: {
    marginRight: 6,
  },
  rtlIcon: {
    marginRight: 0,
    marginLeft: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  rtlText: {
    textAlign: 'right',
  },
});
