import axiosInstance from "./axios";

export const getDashboardData = async () => {
  try {
    const response = await axiosInstance.get("/football/dashboard");
    return response?.data;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};
