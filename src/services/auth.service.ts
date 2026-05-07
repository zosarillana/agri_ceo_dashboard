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

    console.log("✅ /api/user success:", res.data);
    console.log("🍪 cookies:", document.cookie);

    return res.data;
  } catch (err: any) {
    console.log("❌ /api/user failed");
    console.log("Status:", err?.response?.status);
    console.log("Data:", err?.response?.data);
    console.log("🍪 cookies:", document.cookie);

    throw err;
  }
};