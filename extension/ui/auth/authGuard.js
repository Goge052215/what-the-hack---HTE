import { apiRequest } from "../api/client.js";

export const getCurrentUser = async () => {
  const response = await apiRequest("/api/auth/me");
  if (!response.ok) return null;
  return response.data;
};
