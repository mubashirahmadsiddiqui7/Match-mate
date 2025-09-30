// src/services/fishSpecies.ts
import { api, upload, unwrap } from './https';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

/** One species row */
export type FishSpecies = {
  id: number | string;
  species_name: string;
  quantity_kg: number;
  type: 'caught' | 'discarded' | string;
  grade?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateFishSpeciesBody = {
  // Server validator expects these names
  species_name: string;                 // required
  quantity?: number;                    // preferred key
  quantity_kg?: number;                 // legacy support; will be mapped to quantity
  type: 'catch' | 'discard';            // required
  grade?: 'A' | 'B' | 'C' | 'D' | null; // optional
  notes?: string | null;                // optional
  // Any additional client-only fields are ignored
  [extra: string]: any;
};

export type UploadablePhoto = {
  uri: string;
  name?: string;
  type?: string;
};

/** Create species for an activity */
export async function createFishSpecies(
  fishingActivityId: number | string,
  body: CreateFishSpeciesBody,
) {
  const payload = {
    fishing_activity_id: fishingActivityId,
    species_name: body.species_name,
    // Send both keys to satisfy varying server validators
    quantity_kg: body.quantity_kg ?? body.quantity ?? 0,
    quantity: body.quantity ?? body.quantity_kg ?? 0,
    type: body.type,
    grade: body.grade ?? null,
    notes: body.notes ?? null,
  };
  const json = await api(`/fishing-activities/${fishingActivityId}/add-fish-species`, {
    method: 'POST',
    body: payload,
  });
  return unwrap<FishSpecies>(json);
}

/** Create species with photos using multipart form-data (server expects file uploads). */
export async function createFishSpeciesWithPhotos(
  fishingActivityId: number | string,
  body: CreateFishSpeciesBody,
  photos: UploadablePhoto[],
) {
  console.log('[FishSpecies] Preparing multipart upload for', photos.length, 'photos');

  const form = new FormData();

  // Required fields
  form.append('fishing_activity_id', String(fishingActivityId));
  form.append('species_name', body.species_name);
  form.append('quantity_kg', String(body.quantity_kg ?? body.quantity ?? 0));
  form.append('quantity', String(body.quantity ?? body.quantity_kg ?? 0));
  form.append('type', body.type);
  if (body.grade != null) form.append('grade', String(body.grade));
  if (body.notes != null) form.append('notes', String(body.notes));
  if ((body as any).activity_code) form.append('activity_code', String((body as any).activity_code));
  if ((body as any).trip_code) form.append('trip_code', String((body as any).trip_code));

  // Photos [] (server validates photos.0 as image)
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    if (!p?.uri) continue;
    const uri = p.uri.startsWith('file://') || p.uri.startsWith('content://') ? p.uri : `file://${p.uri}`;
    const name = p.name || uri.split('/').pop() || `photo_${i}.jpg`;
    const type = p.type || (name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
    // iOS requires stripping file:// sometimes; RN handles both
    form.append('photos[]', { uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri, name, type } as any);
  }

  console.log('[FishSpecies] Multipart form ready. Fields appended, sending upload...');

  const json = await upload(`/fishing-activities/${fishingActivityId}/add-fish-species`, form);
  console.log('[FishSpecies] API response received');
  return unwrap<FishSpecies>(json);
}

/** List species for an activity */
export async function listFishSpecies(fishingActivityId: number | string) {
  const json = await api(
    `/fishing-activities/${fishingActivityId}/fish-species`,
    { method: 'GET' },
  );
  return unwrap<FishSpecies[] | { data: FishSpecies[] }>(json);
}