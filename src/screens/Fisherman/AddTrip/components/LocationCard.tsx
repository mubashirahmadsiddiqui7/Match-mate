// src/screens/Fisherman/AddTrip/components/LocationCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { s } from '../styles';

type Props = {
  gps: { lat: number; lng: number; accuracy?: number } | null;
  loading: boolean;
  onRecapture: () => void;
};

export default function LocationCard({ gps, loading, onRecapture }: Props) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Starting Location</Text>
      {gps ? (
        <Text style={s.cardText}>
          Lat {gps.lat.toFixed(5)}, Lng {gps.lng.toFixed(5)}
          {gps.accuracy ? ` (±${Math.round(gps.accuracy)}m)` : ''}
        </Text>
      ) : (
        <Text style={s.cardText}>No location yet</Text>
      )}

      <TouchableOpacity
        style={[s.buttonSecondary, loading && s.buttonDisabled, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]}
        onPress={onRecapture}
        disabled={loading}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color="#1f720d" />
            <Text style={s.buttonSecondaryText}>Getting location…</Text>
          </>
        ) : (
          <Text style={s.buttonSecondaryText}>Capture/Refresh Location</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
