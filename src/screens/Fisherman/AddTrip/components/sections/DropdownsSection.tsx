import React from 'react';
import DropdownField from '../fields/DropdownField';
import { PORTS, SEA_TYPES } from '../../constants';

export default function DropdownsSection() {
  return (
    <>
      <DropdownField
        name="departure_site"
        label="Departure Site"
        options={PORTS}
        rules={{ required: 'Departure site is required' }}
      />

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

      <DropdownField
        name="seaType"
        label="Type of Sea Going"
        options={SEA_TYPES}
      />
    </>
  );
}
