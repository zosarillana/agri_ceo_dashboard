import api from "@/lib/api";
import { UpdateUserPayload } from "@/store/user.store";

export const updateUser = async (payload: UpdateUserPayload) => {
  console.log("✏️ updateUser() called");

  const res = await api.put("/api/user/update", payload);

  console.log("✅ updateUser success:", res.data);
  return res.data;
};