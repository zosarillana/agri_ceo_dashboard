import api from "@/lib/api";
import {
  CreateDepartmentPayload,
  Department,
  DepartmentUser,
  UpdateDepartmentPayload,
} from "@/types/department.types";

export const getDepartments = async (): Promise<Department[]> => {
  console.log("📋 getDepartments() called");

  const res = await api.get("/api/admin/departments");

  console.log("✅ getDepartments success:", res.data);
  return res.data.departments;
};

export const getDepartment = async (id: number): Promise<Department> => {
  console.log("🔍 getDepartment() called — id:", id);

  const res = await api.get(`/api/admin/departments/${id}`);

  console.log("✅ getDepartment success:", res.data);
  return res.data;
};

export const createDepartment = async (
  payload: CreateDepartmentPayload
): Promise<Department> => {
  console.log("➕ createDepartment() called");

  const res = await api.post("/api/admin/departments", payload);

  console.log("✅ createDepartment success:", res.data);
  return res.data;
};

export const updateDepartment = async (
  id: number,
  payload: UpdateDepartmentPayload
): Promise<Department> => {
  console.log("✏️ updateDepartment() called — id:", id);

  const res = await api.put(`/api/admin/departments/${id}`, payload);

  console.log("✅ updateDepartment success:", res.data);
  return res.data;
};

export const deleteDepartment = async (id: number): Promise<void> => {
  console.log("🗑️ deleteDepartment() called — id:", id);

  await api.delete(`/api/admin/departments/${id}`);

  console.log("✅ deleteDepartment success");
};

export const getDepartmentUsers = async (
  id: number
): Promise<DepartmentUser[]> => {
  console.log("👥 getDepartmentUsers() called — id:", id);

  const res = await api.get(`/api/admin/departments/${id}/users`);

  console.log("✅ getDepartmentUsers success:", res.data);
  return res.data;
};