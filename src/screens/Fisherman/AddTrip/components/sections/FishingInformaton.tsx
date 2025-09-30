// src/screens/Fisherman/AddTrip/components/sections/CrewSafetySection.tsx
import React from 'react';
import TextField from '../fields/TextField';

export default function FishingInformation() {
  return (
    <>
      <TextField
        name="targetSpecies"
        label="Target Species"
        placeholder="e.g., Tuna, Mackerel"
        rules={{ required: 'Target species is required' }}
      />
      <TextField
        name="estimatedCatch"
        label="Estimated Catch weight (kg)"
        placeholder="e.g., 500"
        keyboardType="numeric"
      />
       <TextField
        name="equipmentCost"
        label="Operational Cost (Rs)"
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
    </>
  );
}
