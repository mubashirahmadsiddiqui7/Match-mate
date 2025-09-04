// src/redux/types.ts
export type AppRole =
  | 'fisherman'
  | 'middle_man'
  | 'exporter'
  | 'mfd_staff'
  | 'fcs'
  | 'super_admin';

export interface AuthUser {
  id: number; // NEW

  name: string;
  email: string;
  role: AppRole;
  token: string;
    profile: any;               // NEW – raw server user object (or make a typed interface)

}

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
};

export const LOGIN_REQUEST = 'LOGIN_REQUEST' as const;
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS' as const;
export const LOGIN_FAILURE = 'LOGIN_FAILURE' as const;
export const LOGOUT = 'LOGOUT' as const;

export type AuthAction =
  | { type: typeof LOGIN_REQUEST }
  | { type: typeof LOGIN_SUCCESS; payload: AuthUser }
  | { type: typeof LOGIN_FAILURE; payload: string | null }
  | { type: typeof LOGOUT };
