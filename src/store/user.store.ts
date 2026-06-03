import { create } from "zustand";
import { AdminUser, getUsers } from "@/services/adminuser.service";

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  department?: string;
  password?: string;
  password_confirmation?: string;
}

interface UserStore {
  users: AdminUser[];
  loading: boolean;
  error: string | null;

  fetchUsers: (force?: boolean) => Promise<void>;
  setUsers: (users: AdminUser[] | ((prev: AdminUser[]) => AdminUser[])) => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async (force = false) => {
    // Deduplicate: skip if already loading or if data exists and force is false
    if (get().loading || (get().users.length > 0 && !force)) return;

    set({ loading: true, error: null });
    try {
      const data = await getUsers();
      set({ users: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch users." });
    } finally {
      set({ loading: false });
    }
  },

  setUsers: (users) => {
    set((state) => ({
      users: typeof users === "function" ? users(state.users) : users,
    }));
  },
}));
