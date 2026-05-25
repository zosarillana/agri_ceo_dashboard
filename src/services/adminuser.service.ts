import api from "@/lib/api";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  department: string | null;
  created_at: string;
}

export interface AdminUpdateUserPayload {
  id: number;
  name?: string;
  email?: string;
  department?: string;
  password?: string;
  password_confirmation?: string;
}

// ─── GET all users ────────────────────────────────────────────
export const getUsers = async (): Promise<AdminUser[]> => {
  console.log("📋 getUsers() called");
  const res = await api.get("/api/admin/users");
  console.log("✅ getUsers success:", res.data);
  return res.data.users;
};

// ─── UPDATE any user by ID ────────────────────────────────────
export const adminUpdateUser = async (
  payload: AdminUpdateUserPayload
): Promise<AdminUser> => {
  console.log("✏️ adminUpdateUser() called", payload);
  const res = await api.put("/api/admin/users/update", payload);
  console.log("✅ adminUpdateUser success:", res.data);
  return res.data.user;
};

// ─── DELETE any user by ID ────────────────────────────────────
export const adminDeleteUser = async (id: number): Promise<void> => {
  console.log("🗑️ adminDeleteUser() called", id);
  await api.delete("/api/admin/users/delete", { data: { id } });
  console.log("✅ adminDeleteUser success");
};