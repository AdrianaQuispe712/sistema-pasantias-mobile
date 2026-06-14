import apiClient from "./client";

export const getDashboard = async () => {
  const response = await apiClient.get("/jefe/dashboard");
  return response.data;
};
