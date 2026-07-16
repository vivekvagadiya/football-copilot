import axiosInstance from "./axios";
import endpoints from "./endpoints";
import { tokenService } from "./tokenService";

export const loginUser = async (data) => {
  try {
    const response = await axiosInstance.post("/auth/login", data);
    if (response.data) {
      const { accessToken, refreshToken } = response.data.data;
      tokenService.setTokens({ accessToken, refreshToken });
    }
    return response?.data;
  } catch (error) {
    // Return consistent error structure
    throw error?.errors?.[0] || error;
  }
};

export const logoutApi = async () => {
  try {
    const response = await axiosInstance.post("/auth/logout");
    return response?.data?.data;
  } catch (error) {
    throw error?.errors?.[0] || error;
  } finally {
    tokenService.clearTokens();
  }
};

export const forgotPassword = async (data) => {
  try {
    const response = await axiosInstance.post(
      endpoints.auth.forgotPassword,
      data,
    );
    return response?.data;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const resetPassword = async (data) => {
  try {
    const response = await axiosInstance.post(
      endpoints.auth.resetPassword,
      data,
    );
    return response?.data;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};

export const registerUser = async (data) => {
  try {
    const response = await axiosInstance.post("auth/register", data);
    return response?.data;
  } catch (error) {
    throw error?.errors?.[0] || error;
  }
};
