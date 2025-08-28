/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import TextField from '../fields/TextField';
import { useFormContext } from 'react-hook-form';
import NetInfo from '@react-native-community/netinfo';

import {
  fetchFishermenList,
  type Fisherman,
} from '../../../../../services/fisherman';
import {
  readFishermenCache,
  writeFishermenCache,
} from '../../../../../offline/fishermenCache';
import PALETTE from '../../../../../theme/palette';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/store';

const pad = (n: number) => String(n).padStart(2, '0');
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
export const parseYmd12h = (s?: string) => {
  if (!s) return new Date();
  const re = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?$/i;
  const m = re.exec(s.trim());
  if (!m) return new Date();
  const [, ys, ms, ds, hs, mins, ap] = m;
  const y = parseInt(ys, 10);
  const mo = parseInt(ms, 10) - 1;
  const d = parseInt(ds, 10);
  let H = 0,
    Mi = 0;
  if (hs && mins && ap) {
    let h12 = parseInt(hs, 10) % 12;
    if (/pm/i.test(ap)) h12 += 12;
    H = h12;
    Mi = parseInt(mins, 10);
  }
  const dt = new Date(y, mo, d, H, Mi);
  return isNaN(dt.getTime()) ? new Date() : dt;
};

export default function BasicInfoSection() {
  const auth = useSelector((s: RootState) => (s as any).auth);
  const authUser = auth?.user;
  console.log('AuthUser in FishermanHome:', authUser);
  const profile = useMemo(
    () => authUser?.profile ?? authUser ?? {},
    [authUser],
  );

  const [details, setDetails] = useState<any>(profile);

  const name =
    details?.name ||
    `${details?.first_name ?? ''} ${details?.last_name ?? ''}`.trim() ||
    'Fisherman';
  const { watch, setValue } = useFormContext();
  const departureDT: string = watch('departure_time');

  const [loading, setLoading] = useState<boolean>(false);
  const [fishermen, setFishermen] = useState<Fisherman[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean>(false);

  useEffect(() => {
    if (!departureDT) {
      setValue('departure_time', formatYmd12h(new Date()), {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [departureDT, setValue]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(s => setOnline(!!s.isConnected));
    NetInfo.fetch()
      .then(s => setOnline(!!s.isConnected))
      .catch(() => {});
    return () => {
      unsub && unsub();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      const cached = await readFishermenCache();
      if (!cancelled && Array.isArray(cached) && cached.length > 0) {
        setFishermen(cached as any);
      }
      try {
        setLoading(true);
        const net = await NetInfo.fetch();
        if (net.isConnected) {
          const data = await fetchFishermenList();
          const list = Array.isArray(data) ? data : [];
          if (!cancelled) {
            setFishermen(list);
            const slim = list.map((f: Fisherman) => ({
              id: f.id,
              name: f.name,
            }));
            writeFishermenCache(slim);
          }
        } else if (!cached?.length) {
          if (!cancelled) setError('Offline and no saved list found');
        }
      } catch (e: any) {
        if (!cancelled) {
          if (!cached?.length)
            setError(e?.message || 'Failed to load fishermen');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const retryFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFishermenList();
      const list = Array.isArray(data) ? data : [];
      setFishermen(list);
      const slim = list.map((f: Fisherman) => ({ id: f.id, name: f.name }));
      writeFishermenCache(slim);
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh list');
    } finally {
      setLoading(false);
    }
  }, []);

  const fisherOptions = useMemo(
    () => fishermen.map(f => ({ label: f.name, value: String(f.id) })),
    [fishermen],
  );

  // const onChangeDate = (event: DateTimePickerEvent, date?: Date) => {
  //   if (Platform.OS === 'android') setShowDatePicker(false);
  //   if (event.type === 'dismissed') return;
  //   const current = parseYmd12h(departureDT);
  //   const picked = date ?? current;
  //   const merged = new Date(
  //     picked.getFullYear(),
  //     picked.getMonth(),
  //     picked.getDate(),
  //     current.getHours(),
  //     current.getMinutes(),
  //   );
  //   setValue('departure_time', formatYmd12h(merged), {
  //     shouldValidate: true,
  //     shouldDirty: true,
  //   });
  // };

  // const onChangeTime = (event: DateTimePickerEvent, date?: Date) => {
  //   if (Platform.OS === 'android') setShowTimePicker(false);
  //   if (event.type === 'dismissed') return;
  //   const current = parseYmd12h(departureDT);
  //   const picked = date ?? current;
  //   const merged = new Date(
  //     current.getFullYear(),
  //     current.getMonth(),
  //     current.getDate(),
  //     picked.getHours(),
  //     picked.getMinutes(),
  //   );
  //   setValue('departure_time', formatYmd12h(merged), {
  //     shouldValidate: true,
  //     shouldDirty: true,
  //   });
  // };

  const hasList = fisherOptions.length > 0;

  return (
    <>
      {/* <DropdownField
        name="fisherman"
        label="Fisherman"
        options={fisherOptions}
        placeholder={
          loading
            ? 'Loading…'
            : hasList
            ? 'Select Fisherman'
            : error
            ? 'No data — retry or enter ID'
            : 'No data yet'
        }
        disabled={loading || !hasList}
        rules={{ required: 'Fisherman is required' }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 8,
        }}
      >
        {loading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ActivityIndicator size="small" color={PALETTE.green700} />
            <Text style={{ color: PALETTE.text600 }}>
              Fetching latest list…
            </Text>
          </View>
        )}
        {!loading && !!error && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: PALETTE.warn, marginRight: 10 }}>
              {error}
            </Text>
            <Pressable
              onPress={retryFetch}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: PALETTE.border,
                  backgroundColor: PALETTE.surface,
                },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={{ color: PALETTE.green700, fontWeight: '700' }}>
                Retry
              </Text>
            </Pressable>
          </View>
        )}
        {!loading && hasList && (
          <Text style={{ color: PALETTE.text600 }}>
            {online ? 'Online' : 'Offline'} • {fisherOptions.length} found
          </Text>
        )}
      </View>

      {!hasList && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: PALETTE.text600, marginBottom: 6 }}>
            No list available — enter Fisherman ID manually:
          </Text>

          <TextField
            name="fisherman"
            label="Fisherman ID"
            placeholder="e.g., 2"
            keyboardType="numeric"
            rules={{ required: 'Fisherman is required' }}
          />
        </View>
      )} */}
      <View style={{ marginBottom: 12 }}>
        <Text
          style={{ fontWeight: '700', marginBottom: 6, color: PALETTE.text900 }}
        >
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
      <TextField
        name="boatNameId"
        label="Boat Registration No"
        placeholder="e.g., KHY-44"
        rules={{ required: 'Boat registration number is required' }}
      />
      <TextField
        name="tripType"
        label="Trip Type"
        placeholder="Select Trip Type"
        rules={{ required: 'Trip type is required' }}
      />
    </>
  );
}
