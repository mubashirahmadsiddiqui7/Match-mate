// src/screens/Fisherman/AddTrip/components/sections/CrewSafetySection.tsx
import React from 'react';
import TextField from '../fields/TextField';

export default function FuelIceInformation() {
  return (
    <>
      <TextField
        name="fuel_quantity"
        label="Fuel Quantity / فیول کی مقدار"
        placeholder="e.g., 500 / مثال: 500"
        keyboardType="numeric"
        rules={{ required: 'Fuel quantity is required' }}
      />

      <TextField
        name="ICE"
        label="ICE Quantity(kg) / آئس کی مقدار(کلو)"
        placeholder="e.g., 100kg / مثال: 100kg"
        keyboardType="numeric"
        rules={{ required: 'ICE quantity is required' }}
      />
    </>
  );
}
