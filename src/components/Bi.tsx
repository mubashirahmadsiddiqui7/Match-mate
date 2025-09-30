import React from 'react';
import { Text } from 'react-native';

export function bi(en?: string | null, ur?: string | null) {
  if (!en && !ur) return '';
  if (!en) return String(ur);
  if (!ur) return String(en);
  return `${en} / ${ur}`;
}

export function Bi({ en, ur, style }: { en: string; ur: string; style?: any }) {
  return <Text style={style}>{bi(en, ur)}</Text>;
}


