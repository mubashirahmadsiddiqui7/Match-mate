import { I18nManager } from 'react-native';
import { getCurrentLanguage } from '../i18n';

// RTL languages
const RTL_LANGUAGES = ['ur', 'ar', 'he', 'fa'];

// Check if current language is RTL
export const isRTL = () => {
  return RTL_LANGUAGES.includes(getCurrentLanguage());
};

// Get text alignment based on current language
export const getTextAlign = () => {
  return isRTL() ? 'right' : 'left';
};

// Get flex direction for RTL layouts
export const getFlexDirection = () => {
  return isRTL() ? 'row-reverse' : 'row';
};

// Get margin/padding direction
export const getMarginStart = (value: number) => {
  return isRTL() ? { marginRight: value } : { marginLeft: value };
};

export const getMarginEnd = (value: number) => {
  return isRTL() ? { marginLeft: value } : { marginRight: value };
};

export const getPaddingStart = (value: number) => {
  return isRTL() ? { paddingRight: value } : { paddingLeft: value };
};

export const getPaddingEnd = (value: number) => {
  return isRTL() ? { paddingLeft: value } : { paddingRight: value };
};

// Get border radius for RTL
export const getBorderRadius = (topLeft: number, topRight: number, bottomLeft: number, bottomRight: number) => {
  if (isRTL()) {
    return {
      borderTopLeftRadius: topRight,
      borderTopRightRadius: topLeft,
      borderBottomLeftRadius: bottomRight,
      borderBottomRightRadius: bottomLeft,
    };
  }
  return {
    borderTopLeftRadius: topLeft,
    borderTopRightRadius: topRight,
    borderBottomLeftRadius: bottomLeft,
    borderBottomRightRadius: bottomRight,
  };
};
