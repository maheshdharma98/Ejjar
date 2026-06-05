import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {User} from '../types';

const USER_KEY = 'ejjar_user';

interface AuthStore {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,

  login: async (phone: string, _otp: string) => {
    set({isLoading: true});
    await new Promise(resolve => setTimeout(resolve, 800));

    const user: User = {
      id: 'contractor_' + phone.replace(/\D/g, '').slice(-6),
      phone,
      name: 'Contractor User',
      createdAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({user, isLoggedIn: true, isLoading: false});
  },

  logout: async () => {
    await AsyncStorage.removeItem(USER_KEY);
    set({user: null, isLoggedIn: false});
  },

  loadUser: async () => {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      if (raw) {
        const user: User = JSON.parse(raw);
        set({user, isLoggedIn: true});
      }
    } catch {}
  },
}));
