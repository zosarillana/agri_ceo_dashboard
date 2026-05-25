import api from "@/lib/api";

/**
 * LOGIN
 */
export const login = async (email: string, password: string) => {
  console.log("🔐 login() called");

  // 1. Get CSRF cookie (required by Sanctum)
  await api.get("/sanctum/csrf-cookie");

  // 2. Login request
  await api.post("/api/login", { email, password });

  // 3. Immediately fetch user
  const res = await api.get("/api/user");

  console.log("✅ login success:", res.data);
  return res.data;
};

/**
 * LOGOUT
 */
export const logout = async () => {
  console.log("🚪 logout() called");

  await api.post("/api/logout");

  console.log("✅ logout success");
};

/**
 * GET CURRENT USER (FOR REFRESH / SESSION RESTORE)
 */
export const getUser = async () => {
  console.log("🔄 getUser() called");

  try {
    const res = await api.get("/api/user");

    return res.data;
  } catch (err: any) {
    console.error("❌ /api/user failed", err);
    throw err;
  }
};

/**
 * REGISTER USER
 */
export const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
  department?: string;
}) => {
  const res = await api.post("/api/register", payload);
  return res.data;
};
