import { create } from "zustand";
import {
  CreateDepartmentPayload,
  Department,
  DepartmentUser,
  UpdateDepartmentPayload,
} from "@/types/department.types";
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  getDepartmentUsers,
  getDepartments,
  updateDepartment,
} from "@/services/department.service";

interface DepartmentState {
  departments: Department[];
  selectedDepartment: Department | null;
  departmentUsers: DepartmentUser[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDepartments: () => Promise<void>;
  fetchDepartment: (id: number) => Promise<void>;
  fetchDepartmentUsers: (id: number) => Promise<void>;
  addDepartment: (payload: CreateDepartmentPayload) => Promise<void>;
  editDepartment: (id: number, payload: UpdateDepartmentPayload) => Promise<void>;
  removeDepartment: (id: number) => Promise<void>;
  setSelectedDepartment: (department: Department | null) => void;
  clearError: () => void;
}

export const useDepartmentStore = create<DepartmentState>((set) => ({
  departments: [],
  selectedDepartment: null,
  departmentUsers: [],
  isLoading: false,
  error: null,

  fetchDepartments: async () => {
    set({ isLoading: true, error: null });
    try {
      const departments = await getDepartments();
      set({ departments });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch departments." });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDepartment: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const department = await getDepartment(id);
      set({ selectedDepartment: department });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch department." });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDepartmentUsers: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const users = await getDepartmentUsers(id);
      set({ departmentUsers: users });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch department users." });
    } finally {
      set({ isLoading: false });
    }
  },

  addDepartment: async (payload: CreateDepartmentPayload) => {
    set({ isLoading: true, error: null });
    try {
      const newDepartment = await createDepartment(payload);
      set((state) => ({ departments: [...state.departments, newDepartment] }));
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to create department." });
    } finally {
      set({ isLoading: false });
    }
  },

  editDepartment: async (id: number, payload: UpdateDepartmentPayload) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await updateDepartment(id, payload);
      set((state) => ({
        departments: state.departments.map((d) => (d.id === id ? updated : d)),
        selectedDepartment:
          state.selectedDepartment?.id === id ? updated : state.selectedDepartment,
      }));
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to update department." });
    } finally {
      set({ isLoading: false });
    }
  },

  removeDepartment: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDepartment(id);
      set((state) => ({
        departments: state.departments.filter((d) => d.id !== id),
        selectedDepartment:
          state.selectedDepartment?.id === id ? null : state.selectedDepartment,
      }));
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to delete department." });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedDepartment: (department) => set({ selectedDepartment: department }),

  clearError: () => set({ error: null }),
}));