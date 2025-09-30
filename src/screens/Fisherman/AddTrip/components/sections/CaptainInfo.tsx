// src/screens/Fisherman/AddTrip/components/sections/CrewSafetySection.tsx
import React from 'react';
import TextField from '../fields/TextField';

export default function CaptainInfo() {
  return (
    <>
      <TextField
        name="captainNameId"
        label="Captain Name / کپتان کا نام"
        placeholder="e.g, Captain Ahmed Khan / مثال: کپتان احمد خان"
        rules={{ required: 'Captain name is required' }}
      />
      <TextField
        name="captainPhone"
        label="Captain Mobile Number / کپتان کا موبائل نمبر"
        placeholder="+92 300 1234567"
        keyboardType="phone-pad"
        rules={{ required: 'Captain Mobile Number is required' }}
      />
      <TextField
        name="crewNo"
        label="Number of Crew / عملے کی تعداد"
        placeholder="e.g. 5 / مثال: 5"
        keyboardType="numeric"
        rules={{
          required: 'Crew count is required',
        }}
      />
      <TextField
        name="port_clearance_no"
        label="Port Clearance No / پورٹ کلیئرنس نمبر"
        placeholder="eg. PC-2024-001 / مثال: PC-2024-001"
        rules={{ required: 'Port clearance No. is required' }}
      />
    </>
  );
}
