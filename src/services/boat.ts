// src/services/boat.ts
import { api } from './https';

export interface Boat {
  id: number;
  name: string | null;
  registration_number: string;
  type: string | null;
  boat_type?: string | null;
  boat_license_no?: string | null;
  mfd_approved_no?: string | null;
  length_m?: string | null;
  width_m?: string | null;
  capacity_crew?: number | null;
  capacity_weight_kg?: number | null;
  number_of_fish_holds?: number | null;
  boat_size?: string | null;
  boat_capacity?: string | null;
  engine_power?: string | null;
  year_built?: number | null;
  fishing_equipment?: string | null;
  safety_equipment?: string | null;
  insurance_info?: string | null;
  license_info?: string | null;
  notes?: string | null;
  home_port?: string | null;
  status: 'active' | 'maintenance' | 'retired';
  documents?: any | null;
  created_at: string;
  updated_at: string;
  owner_id?: number;
  user_id?: number;
  owner?: {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    user_type: string;
    role: string;
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    nationality?: string | null;
    phone: string;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
    country?: string | null;
    boat_registration_number?: string | null;
    fishing_zone: string;
    port_location: string;
    fcs_license_number?: string | null;
    export_license_number?: string | null;
    mfd_employee_id?: string | null;
    company_name?: string | null;
    company_id?: string | null;
    business_address?: string | null;
    business_phone?: string | null;
    business_email?: string | null;
    is_verified: boolean;
    verified_at?: string | null;
    verification_status: string;
    verification_document?: string | null;
    profile_description?: string | null;
    bio?: string | null;
    website?: string | null;
    profile_picture?: string | null;
    cover_picture?: string | null;
    phone_verified_at?: string | null;
    last_login_at?: string | null;
    is_active: boolean;
    preferences?: any | null;
    created_at: string;
    updated_at: string;
  };
}

export interface CreateBoatData {
  registration_number: string;
  status: 'active' | 'maintenance' | 'retired';

  // optionals
  name?: string;
  owner_id?: number | string;
  user_id?: number | string;
  type?: string;
  boat_license_no?: string;
  mfd_approved_no?: string;
  boat_type?: string;
  length_m?: number | string;
  width_m?: number | string;
  capacity_crew?: number | string;
  capacity_weight_kg?: number | string;
  number_of_fish_holds?: number | string;
  boat_size?: number | string;
  boat_capacity?: number | string;
  engine_power?: string;
  year_built?: number | string;
  fishing_equipment?: string;
  safety_equipment?: string;
  insurance_info?: string;
  license_info?: string;
  notes?: string;
  home_port?: string;
  photos?: Array<{ uri: string; name?: string; type?: string }>;
}

export interface UpdateBoatData extends Partial<CreateBoatData> {
  id: number;
}

export interface BoatListResponse {
  success: boolean;
  data: {
    current_page: number;
    data: Boat[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

const appendIfPresent = (fd: FormData, key: string, val?: any) => {
  if (val === undefined || val === null) return;
  const s = String(val).trim();
  if (s.length === 0) return;
  fd.append(key, s);
};

// Get all boats with pagination
export const getBoats = async (page: number = 1, perPage: number = 10): Promise<BoatListResponse> => {
  const res = await api(`/boats`, { method: 'GET', query: { page, per_page: perPage } });
  return res;
};

// Get boat by ID
export const getBoatById = async (id: number): Promise<Boat> => {
  const res = await api(`/boats/${id}`, { method: 'GET' });
  console.log('Raw API response for boat', id, ':', JSON.stringify(res, null, 2));
  
  // Handle the API response structure: { success: true, data: { boat data } }
  if (res && res.data) {
    console.log('Extracted boat data:', JSON.stringify(res.data, null, 2));
    return res.data;
  }
  
  console.error('Invalid response format:', res);
  throw new Error('Invalid response format from server');
};

// Create new boat
export const createBoat = async (boatData: CreateBoatData): Promise<Boat> => {
  const formData = new FormData();

  // required
  appendIfPresent(formData, 'registration_number', boatData.registration_number);
  appendIfPresent(formData, 'status', boatData.status);

  // optional strings / numerics
  appendIfPresent(formData, 'name', boatData.name);
  appendIfPresent(formData, 'owner_id', boatData.owner_id);
  appendIfPresent(formData, 'user_id', boatData.user_id);
  appendIfPresent(formData, 'type', boatData.type);
  appendIfPresent(formData, 'boat_license_no', boatData.boat_license_no);
  appendIfPresent(formData, 'mfd_approved_no', boatData.mfd_approved_no);
  appendIfPresent(formData, 'boat_type', boatData.boat_type);
  appendIfPresent(formData, 'length_m', boatData.length_m);
  appendIfPresent(formData, 'width_m', boatData.width_m);
  appendIfPresent(formData, 'capacity_crew', boatData.capacity_crew);
  appendIfPresent(formData, 'capacity_weight_kg', boatData.capacity_weight_kg);
  appendIfPresent(formData, 'number_of_fish_holds', boatData.number_of_fish_holds);
  appendIfPresent(formData, 'boat_size', boatData.boat_size);
  appendIfPresent(formData, 'boat_capacity', boatData.boat_capacity);
  appendIfPresent(formData, 'engine_power', boatData.engine_power);
  appendIfPresent(formData, 'year_built', boatData.year_built);
  appendIfPresent(formData, 'fishing_equipment', boatData.fishing_equipment);
  appendIfPresent(formData, 'safety_equipment', boatData.safety_equipment);
  appendIfPresent(formData, 'insurance_info', boatData.insurance_info);
  appendIfPresent(formData, 'license_info', boatData.license_info);
  appendIfPresent(formData, 'notes', boatData.notes);
  appendIfPresent(formData, 'home_port', boatData.home_port);

  // photos[]
  boatData.photos?.forEach((p, idx) => {
    const uri = p.uri;
    const ext = uri.match(/\.(jpe?g|png|gif)$/i)?.[0]?.toLowerCase() ?? '.jpg';
    const type =
      p.type ??
      (ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg');
    const name = p.name ?? `photo_${idx}${ext}`;
    formData.append('photos[]', { uri, name, type } as any);
  });

  // DO NOT set Content-Type; RN will add multipart boundary
  const res = await api('/boats', { method: 'POST', body: formData });
  return res;
};

// Update boat
export const updateBoat = async (boatData: UpdateBoatData): Promise<Boat> => {
  const { id, ...payload } = boatData;
  const formData = new FormData();

  // Only append fields provided
  Object.entries(payload).forEach(([k, v]) => {
    if (k === 'photos' && Array.isArray(v)) {
      (v as any[]).forEach((p, idx) => {
        const uri = p.uri;
        const ext = uri.match(/\.(jpe?g|png|gif)$/i)?.[0]?.toLowerCase() ?? '.jpg';
        const type =
          p.type ??
          (ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg');
        const name = p.name ?? `photo_${idx}${ext}`;
        formData.append('photos[]', { uri, name, type } as any);
      });
    } else {
      appendIfPresent(formData, k, v as any);
    }
  });

  const res = await api(`/boats/${id}`, { method: 'POST', body: formData, headers: { 'X-HTTP-Method-Override': 'PUT' } });
  return res;
};

// Delete boat
export const deleteBoat = async (id: number): Promise<void> => {
  await api(`/boats/${id}`, { method: 'DELETE' });
};

// Search boats
export const searchBoats = async (query: string, page = 1, perPage = 10): Promise<BoatListResponse> => {
  const res = await api(`/boats/search`, { method: 'GET', query: { q: query, page, per_page: perPage } });
  return res;
};

// Get boats by type
export const getBoatsByType = async (type: string, page = 1, perPage = 10): Promise<BoatListResponse> => {
  const res = await api(`/boats/type/${encodeURIComponent(type)}`, { method: 'GET', query: { page, per_page: perPage } });
  return res;
};

// Get user's boats
export const getUserBoats = async (page = 1, perPage = 10): Promise<BoatListResponse> => {
  const res = await api(`/user/boats`, { method: 'GET', query: { page, per_page: perPage } });
  return res;
};
