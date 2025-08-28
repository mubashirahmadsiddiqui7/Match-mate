// src/services/fishSpecies.ts
import { api } from './https';

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
  /** Optional pretty codes (just for audit/logs on server) */
  activity_code?: string | null; // e.g., "ACT-20250826-007"
  trip_code?: string | null;     // e.g., "TRIP-20250826-009"

  species_name: string;          // e.g., "Tuna"
  quantity_kg: number;           // weight in KG
  type: 'catch' | 'discard';  // classification
  grade?: string | null;         // optional quality grade
  notes?: string | null;         // optional free text
};

function unwrap<T>(j: any): T {
  return (j?.data ?? j) as T;
}

/** Create species for an activity */
export async function createFishSpecies(
  fishingActivityId: number | string,
  body: CreateFishSpeciesBody,
) {
  const json = await api(
    `/fishing-activities/${fishingActivityId}/add-fish-species`,
    { method: 'POST', body },
  );
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