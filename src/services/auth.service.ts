import api from "@/lib/api";
import axios from "axios";

const getCsrfCookie = async () => {
  await axios.get("http://localhost:8000/sanctum/csrf-cookie", {
    withCredentials: true,
    withXSRFToken: true,
  });
};

export const login = async (email: string, password: string) => {
  await getCsrfCookie();
  await api.post("/api/login", { email, password });
  const res = await api.get("/api/user");
  return res.data;
};

export const logout = async () => {
  await getCsrfCookie(); // 👈 add this
  await api.post("/api/logout");
};

export const getUser = async () => {
  const res = await api.get("/api/user");
  return res.data;
};