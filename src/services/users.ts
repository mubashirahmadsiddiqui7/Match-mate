// src/services/users.ts
import { api, unwrap, BASE_URL } from './https';
import { stripUndefined } from '../utils/json';


/** Generic ID type */
export type ID = number | string;

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
};

export type UserRole = string;
export type UserType = string;

export type User = {
  id: number;
  name: string;
  email: string;
  role?: UserRole | null;
  user_type?: UserType | null;
  is_verified?: boolean;
  is_active?: boolean;
  phone?: string | null;

  // common profile fields seen in your payload
  first_name?: string | null;
  last_name?: string | null;
  national_id?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  fishing_zone?: string | null;
  port_location?: string | null;
  boat_registration_number?: string | null;
  profile_picture?: string | null;

  created_at?: string;
  updated_at?: string;
  [k: string]: any;
};

export type CreateUserBody = {
  name: string;
  email: string;
  password: string;
  password_confirmation?: string;
  role?: UserRole;
  user_type?: UserType;
  phone?: string;
  is_verified?: boolean;
  is_active?: boolean;
  
  // Personal Information
  first_name?: string;
  last_name?: string;
  display_name?: string;
  
  // Fisherman Details
  boat_registration_number?: string;
  fishing_zone?: string;
  port_location?: string;
  
  // FCS Details
  fcs_name?: string;
  fcs_license_number?: string;
  fcs_address?: string;
  fcs_phone?: string;
  fcs_email?: string;
  
  // Middleman Details
  company_name?: string;
  fcs_license_number_middleman?: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  
  // Exporter Details
  company_name_exporter?: string;
  export_license_number?: string;
  business_address_exporter?: string;
  business_phone_exporter?: string;
  business_email_exporter?: string;
  
  // MFD Details
  mfd_employee_id?: string;
};

/** Include all fields your Profile screen can edit */
export type UpdateUserBody = Partial<{
  name: string;
  email: string;
  password: string;
  role: UserRole;
  user_type: UserType;
  phone: string;
  is_verified: boolean;
  is_active: boolean;

  first_name: string;
  last_name: string;
  national_id: string;
  address: string;
  city: string;
  province: string;
  country: string;
  fishing_zone: string;
  port_location: string;
  boat_registration_number: string;
  profile_picture: string; // if you send a URL/base64; file uploads usually use multipart
}>;

export type ListParams = { page?: number; per_page?: number; };

export type SearchUsersParams = {
  q?: string;
  user_type?: UserType;
  is_verified?: boolean;
  is_active?: boolean;
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
  page?: number;
  per_page?: number;
};


/* =========================
 * Admin endpoints (kept)
 * ========================= */
export async function listUsers(params?: ListParams) {
  const json = await api('/users', { query: params });
  return unwrap<Paginated<User>>(json);
}
export async function createUser(body: CreateUserBody) {
  const json = await api('/users', { method: 'POST', body: stripUndefined(body) });
  return unwrap<User>(json);
}

// Special function for user registration that doesn't require authentication
export async function registerUser(body: CreateUserBody) {
  const url = `${BASE_URL}/register`;
  
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(stripUndefined(body)),
  });

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const text = await response.text();

  let json: any = null;
  if (contentType.includes('application/json')) {
    try {
      json = text ? JSON.parse(text) : {};
    } catch {}
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    
    if (json) {
      if (json.message) {
        errorMessage = json.message;
      }
      
      // Handle validation errors specifically
      if (json.errors) {
        const validationErrors = Object.entries(json.errors)
          .map(([field, messages]) => {
            const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const errorList = Array.isArray(messages) ? messages.join(', ') : String(messages);
            return `${fieldName}: ${errorList}`;
          })
          .join('\n');
        errorMessage = `Validation errors:\n${validationErrors}`;
      }
    } else if (text) {
      errorMessage = text.slice(0, 200);
    }
    
    const err: any = new Error(errorMessage);
    err.status = response.status;
    err.response = json ?? text;
    throw err;
  }

  if (!json) throw new Error('Invalid server response (expected JSON).');

  if (json.success === false) {
    const msg = json.message || (json.errors ? Object.values(json.errors).flat()?.join('\n') : 'Request failed');
    throw new Error(msg);
  }

  return unwrap<User>(json);
}
export async function updateUser(id: ID, body: UpdateUserBody) {
  const json = await api(`/users/${id}`, { method: 'PUT', body: stripUndefined(body) });
  return unwrap<User>(json);
}
export async function deleteUser(id: ID) {
  const json = await api(`/users/${id}`, { method: 'DELETE' });
  return unwrap<{ success: boolean }>(json);
}
export async function verifyUser(id: ID) {
  const json = await api(`/users/${id}/verify`, { method: 'POST' });
  return unwrap<User>(json);
}
export async function deactivateUser(id: ID) {
  const json = await api(`/users/${id}/deactivate`, { method: 'POST' });
  return unwrap<User>(json);
}
export async function filterUsersByRole(role: UserRole, params?: ListParams) {
  const json = await api(`/users/filter/role/${encodeURIComponent(role)}`, { query: params });
  return unwrap<Paginated<User>>(json);
}
export async function searchUsers(params: SearchUsersParams) {
  const json = await api('/users/search', { query: stripUndefined(params) });
  return unwrap<Paginated<User>>(json);
}

/* =========================
 * Self-service (current user)
 * ========================= */

/** Read current user (GET /user) */
export async function getUser(): Promise<User> {
  const json = await api('/user', { method: 'GET' });
  console.log('current user details', json);
  return unwrap<User>(json);
}

/** Update current user — NO id required. Preferred path: PUT /user */
export async function updateMe(body: UpdateUserBody): Promise<User> {
  const clean = stripUndefined(body);
  try {
    const json = await api('/user', { method: 'PUT', body: clean });
    return unwrap<User>(json);
  } catch (e: any) {
    // If your server only allows PATCH for /user, retry seamlessly.
    if (e?.status === 405) {
      const json = await api('/user', { method: 'PUT', body: clean });
      return unwrap<User>(json);
    }
    throw e;
  }
}
