// src/screens/Fisherman/AddTrip/components/SectionCard.tsx
import React, { PropsWithChildren } from 'react';
import { View, Text } from 'react-native';
import { s } from '../styles';
import { Bi } from '../../../../components/Bi';

type Props = PropsWithChildren<{ title: string; subtitle?: string }>;

export default function SectionCard({ title, subtitle, children }: Props) {
  return (
    <View style={s.cardWrap}>
      <Text style={s.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={s.sectionSubtitle}>{subtitle}</Text>}
      <View style={s.cardBody}>
        {children}
      </View>
    </View>
  );
}
