import { create } from "zustand";
import * as authService from "@/services/auth.service";
import { User } from "@/types/user.types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  initialized: boolean;

  initializeAuth: () => Promise<void>;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: false,
  isLoggingIn: false,
  initialized: false,

  login: async (email, password) => {
    set({ isLoggingIn: true });

    try {
      const user = await authService.login(email, password);

      set({
        user,
        isAuthenticated: true,
      });
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    await authService.logout();

    set({
      user: null,
      isAuthenticated: false,
    });
  },

  initializeAuth: async () => {
    const state = useAuthStore.getState();

    console.log("🚀 initializeAuth called");
    console.log("📦 current state:", state);

    if (state.initialized || state.isInitializing) {
      console.log("⏭️ skipped initializeAuth");
      return;
    }

    set({ isInitializing: true });

    try {
      const user = await authService.getUser();

      console.log("✅ initializeAuth success", user);

      set({
        user,
        isAuthenticated: true,
        initialized: true,
      });

      console.log("📦 state after success:", useAuthStore.getState());
    } catch (err) {
      console.log("❌ initializeAuth failed", err);

      set({
        user: null,
        isAuthenticated: false,
        initialized: true,
      });

      console.log("📦 state after fail:", useAuthStore.getState());
    } finally {
      set({
        isInitializing: false,
      });

      console.log("🏁 initializeAuth finished");
    }
  },

  fetchUser: async () => {
    try {
      const user = await authService.getUser();

      set({
        user,
        isAuthenticated: true,
        initialized: true,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        initialized: true,
      });
    } finally {
      set({
        isLoggingIn: false,
      });
    }
  },

  setUser: (user) => {
    // 👈 add this
    set({ user });
  },
}));
