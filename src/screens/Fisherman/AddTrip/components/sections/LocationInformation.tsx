// src/screens/Fisherman/AddTrip/components/sections/CrewSafetySection.tsx
import React from 'react';
import DropdownField from '../fields/DropdownField';
import { PORTS, SEA_TYPES } from '../../constants';

export default function LocationInformation() {
  return (
    <>
      <DropdownField
        name="departure_site"
        label="Port Location / بندرگاہ کا مقام"
        options={PORTS}
        rules={{ required: 'Departure site is required' }}
      />
      <DropdownField
        name="seaType"
        label="Type of Sea Going / سمندر کی قسم"
        options={SEA_TYPES}
      />
    </>
  );
}
