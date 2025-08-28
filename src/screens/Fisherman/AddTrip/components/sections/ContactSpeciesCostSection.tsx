import React from 'react';
import TextField from '../fields/TextField';

export default function ContactSpeciesCostSection() {
  return (
    <>
      <TextField
        name="emergencyContact"
        label="Emergency Contact"
        placeholder="Contact Number"
        keyboardType="phone-pad"
      />

      <TextField
        name="targetSpecies"
        label="Target Species"
        placeholder="e.g., Tuna, Mackerel"
        rules={{ required: 'Target species is required' }}
      />

      <TextField
        name="crewCount"
        label="Total crew members (1–50)"
        placeholder="e.g., 5"
        keyboardType="numeric"
        rules={{
          required: 'Crew count is required',
          validate: (v: any) => {
            const num = Number(v);
            if (isNaN(num)) return 'Crew count must be a number';
            if (num < 1) return 'Crew count must be at least 1';
            if (num > 50) return 'Crew count cannot exceed 50';
            return true;
          },
        }}
      />
{/* 
      <TextField
        name="fuelCost"
        label="Fuel Cost (Rs)"
        placeholder="0.00"
        keyboardType="decimal-pad"
      /> */}
      <TextField
        name="estimatedCatch"
        label="Estimated Catch weight (kg)"
        placeholder="0"
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
