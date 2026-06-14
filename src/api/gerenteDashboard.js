import apiClient from "./client";

export const getDashboard = async () => {
  const response = await apiClient.get("/gerente/dashboard");
  return response.data;
};
