// src/redux/actions/authActions.ts
import { Dispatch } from 'redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT } from '../types';
import type { AuthUser, AppRole, AuthAction } from '../types';
import { api, setAuthToken } from '../../services/https';

function mapRole(serverUserType?: string | null): AppRole | null {
  const r = (serverUserType || '').toLowerCase();
  if (r.includes('fisher')) return 'fisherman';
  if (r.includes('middle') || r.includes('auction')) return 'middle_man';
  if (r.includes('export')) return 'exporter';
  if (r.includes('mfd') || r.includes('staff')) return 'mfd_staff';
  if (r.includes('fcs')) return 'fcs';
  if (r.includes('super')) return 'mfd_staff';
  return null;
}

export const login = (email: string, password: string) => {
  return async (dispatch: Dispatch<AuthAction>) => {
    dispatch({ type: LOGIN_REQUEST });
    try {
      console.groupCollapsed('[AUTH] login request');
      console.log('email:', email);

      const json = await api('/login', {
        method: 'POST',
        body: { email, password },
      });

      const token = json?.data?.token as string | undefined;
      const user = json?.data?.user;
      console.log('server user_type:', user?.user_type);
      console.log('server id/name/email:', user?.id, user?.name, user?.email);

      if (!token || !user) throw new Error('Malformed login response.');
      const mapped = mapRole(user?.user_type);
      if (!mapped)
        throw new Error(`Unsupported role: ${user?.user_type ?? 'unknown'}`);

      const tokenPreview = `${token.slice(0, 8)}…${token.slice(-4)}`;
      console.log('mapped role:', mapped);
      console.log('token:', tokenPreview);
      console.groupEnd();

      const authUser: AuthUser = {
        id: user.id, // NEW

        email: user.email,
        name: user.name,
        role: mapped,
        token,
        profile: user, // NEW – keep the full server user
      };

      await setAuthToken(token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(authUser));

      dispatch({ type: LOGIN_SUCCESS, payload: authUser });

      // ⬇️ return BOTH the mapped user and the raw response (for UI display)
      return { authUser, raw: json };
    } catch (e: any) {
      console.groupCollapsed('[AUTH] login failed');
      console.log('error:', e?.message || e);
      console.groupEnd();
      dispatch({ type: LOGIN_FAILURE, payload: e?.message || 'Login failed' });
      throw e;
    }
  };
};

export const loadSession = () => {
  return async (dispatch: Dispatch<AuthAction>) => {
    dispatch({ type: LOGIN_REQUEST });
    try {
      const cached = await AsyncStorage.getItem('auth_user');
      const user = cached ? (JSON.parse(cached) as AuthUser) : null;
      const token = user?.token ?? null;
      await setAuthToken(token);
      if (user && token) {
        dispatch({ type: LOGIN_SUCCESS, payload: user });
      } else {
        dispatch({ type: LOGIN_FAILURE, payload: null as any });
      }
    } catch {
      dispatch({ type: LOGIN_FAILURE, payload: null as any });
    }
  };
};

export const fetchProfile = () => {
  return async (_dispatch: Dispatch<AuthAction>) => {
    const json = await api('/user');
    return json?.data;
  };
};

export const logout = () => {
  return async (dispatch: Dispatch<AuthAction>) => {
    try {
      await api('/logout', { method: 'POST' });
    } catch {}
    await setAuthToken(null);
    await AsyncStorage.multiRemove(['auth_user']);
    dispatch({ type: LOGOUT });
  };
};
