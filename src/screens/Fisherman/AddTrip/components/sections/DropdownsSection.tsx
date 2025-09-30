/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import DropdownField from '../fields/DropdownField';
import { PORTS } from '../../constants';
import { Text, View } from 'react-native';
import PALETTE from '../../../../../theme/palette';
import { formatYmd12h } from './BasicInfoSection';
import { useFormContext } from 'react-hook-form';
import TextField from '../fields/TextField';

export default function DropdownsSection() {
  const { watch } = useFormContext();

  const departureDT: string = watch('departure_time');

  return (
    <>
      <View style={{ marginTop: 12 }}>
        <Text
          style={{ fontWeight: '700', marginBottom: 6, color: PALETTE.text900 }}
        >
          Departure (Date & Time)
        </Text>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: PALETTE.border,
            backgroundColor: PALETTE.surface,
          }}
        >
          <Text style={{ color: PALETTE.text600 }}>
            {departureDT || formatYmd12h(new Date())}
          </Text>
        </View>
      </View>
      <DropdownField
        name="departure_port"
        label="Departure Port"
        options={PORTS}
        rules={{ required: 'Departure port is required' }}
      />

      <DropdownField
        name="destination_port"
        label="Destination Port"
        options={PORTS}
        rules={{ required: 'Destination port is required' }}
      />
       <TextField
        name="tripPurpose"
        label="Trip Purpose"
        placeholder="Describe the purpose of this trip"
      />
    </>
  );
}
