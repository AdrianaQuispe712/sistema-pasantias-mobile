import apiClient from "./client";

export const getEmpresa = async () => {
  const response = await apiClient.get("/gerente/empresa");
  return response.data;
};

export const updateEmpresa = async (data) => {
  const response = await apiClient.put("/gerente/empresa", data);
  return response.data;
};
