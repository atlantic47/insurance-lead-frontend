import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  plan: string;
  trialEndsAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  tenant: TenantInfo | null;
  isLoading: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) => Promise<void>;
  registerTenant: (data: {
    companyName: string;
    subdomain: string;
    adminEmail: string;
    adminPassword: string;
    adminFirstName: string;
    adminLastName: string;
    adminPhone?: string;
    plan?: string;
  }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      tenant: null,
      isLoading: false,
      isHydrated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          const { access_token, user, tenant } = response.data;

          set({ user, token: access_token, tenant, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const { access_token, user } = response.data;

          set({ user, token: access_token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      registerTenant: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.registerTenant(data);
          const { access_token, user, tenant } = response.data;

          set({ user, token: access_token, tenant, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, tenant: null });
      },

      checkAuth: async () => {
        const currentState = get();

        if (!currentState.token) {
          set({ user: null, token: null, tenant: null, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.me();
          set({ user: response.data, isLoading: false });
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ user: null, token: null, tenant: null, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tenant: state.tenant
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      },
    }
  )
);
