/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import TextField from '../fields/TextField';
import { useFormContext } from 'react-hook-form';
import PALETTE from '../../../../../theme/palette';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/store';

const pad = (n: number) => String(n).padStart(2, '0');

export const parseYmd12h = (s?: string) => {
  if (!s) return new Date();
  const re = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?$/i;
  const m = re.exec(s.trim());
  if (!m) return new Date();
  const [, ys, ms, ds, hs, mins, ap] = m;
  const y = parseInt(ys, 10);
  const mo = parseInt(ms, 10) - 1;
  const d = parseInt(ds, 10);
  let H = 0, Mi = 0;
  if (hs && mins && ap) {
    let h12 = parseInt(hs, 10) % 12;
    if (/pm/i.test(ap)) h12 += 12;
    H = h12;
    Mi = parseInt(mins, 10);
  }
  const dt = new Date(y, mo, d, H, Mi);
  return isNaN(dt.getTime()) ? new Date() : dt;
};

export const formatYmd12h = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  let h = d.getHours();
  const m = pad(d.getMinutes());
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${yyyy}-${mm}-${dd} ${pad(h)}:${m} ${ap}`;
};

export default function BasicInfoSection() {
  const auth = useSelector((s: RootState) => (s as any).auth);
  const authUser = auth?.user;
  const profile = useMemo(
    () => authUser?.profile ?? authUser ?? {},
    [authUser],
  );

  const { watch, setValue } = useFormContext();
  const departureDT: string = watch('departure_time');

  // Prefill mandatory values from Redux
  useEffect(() => {
    // readonly display name (nice to have)
    if (profile?.name) setValue('fisherman', profile.name, { shouldDirty: false });
    // this is what the API actually needs
    if (profile?.id) setValue('fisherman_id', String(profile.id), { shouldDirty: false });
    // prefill boat reg if not already filled by defaultValues
    if (profile?.boat_registration_number) {
      setValue('boatNameId', profile.boat_registration_number, { shouldDirty: false });
    }
    // departure time (readonly display)
    if (!departureDT) {
      setValue('departure_time', formatYmd12h(new Date()), {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [profile, departureDT, setValue]);

  return (
    <>
      {/* Fisherman (read-only chips) */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontWeight: '700', marginBottom: 6, color: PALETTE.text900 }}>
          Fisherman
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
          <Text style={{ color: PALETTE.text600, fontWeight: '500' }}>
            {profile?.name || 'Fisherman'}
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontWeight: '700', marginBottom: 6, color: PALETTE.text900 }}>
          Fisherman ID
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
          <Text style={{ color: PALETTE.text600, fontWeight: '500' }}>
            {profile?.id ?? '—'}
          </Text>
        </View>
      </View>

      {/* Boat Registration No (kept editable, but prefilled) */}
      <TextField
        name="boatNameId"
        label="Boat Registration No"
        placeholder="e.g., KHY-44"
        rules={{ required: 'Boat registration number is required' }}
      />

      {/* Trip Type (keep as you like; Dropdown recommended elsewhere) */}
      <TextField
        name="tripType"
        label="Trip Type"
        placeholder="Select Trip Type"
        rules={{ required: 'Trip type is required' }}
      />
    </>
  );
}
