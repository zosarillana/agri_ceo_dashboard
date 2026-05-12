// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.30.3:8081",
  withCredentials: true,
  withXSRFToken: true,
});

export default api;
