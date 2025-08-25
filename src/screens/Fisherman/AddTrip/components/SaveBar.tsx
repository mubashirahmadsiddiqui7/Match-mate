// src/screens/Fisherman/AddTrip/components/SaveBar.tsx
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useFormContext, useWatch } from 'react-hook-form';
import { s } from '../styles';
import type { FormValues } from '../types';

type Props = {
  gpsAvailable: boolean;
  onSave: () => void;
};

export default function SaveBar({ gpsAvailable, onSave }: Props) {
  const { control } = useFormContext<FormValues>();
  const tripCost = useWatch({ control, name: 'tripCost' });

  // Validate only trip cost now
  const costValid = Number(tripCost) >= 0;
  const disabled = !gpsAvailable || !costValid;

  return (
    <TouchableOpacity
      style={[s.button, disabled && s.buttonDisabled]}
      onPress={onSave}
      disabled={disabled}
    >
      <Text style={s.buttonText}>Save Trip</Text>
    </TouchableOpacity>
  );
}
