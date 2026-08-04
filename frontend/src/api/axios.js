import axios from "axios";
import { tokenService } from "./tokenService";
import { toast } from "sonner";

// Create a toast event system for non-React contexts
let toastHandler = null;

export const setToastHandler = (handler) => {
  toastHandler = handler;
};

/**
 * Extracts a human-friendly error message from a raw error response message,
 * especially handling stringified Google GenAI/Gemini quota errors.
 */
const getCleanErrorMessage = (msg) => {
  if (!msg) return "Something went wrong";

  if (typeof msg === "string" && msg.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.error?.message) {
        const cleanMsg = parsed.error.message;

        // Check if it's a Rate Limit / Resource Exhausted error
        if (parsed.error.status === "RESOURCE_EXHAUSTED" || parsed.error.code === 429) {
          const retryMatch = cleanMsg.match(/Please retry in (\d+(\.\d+)?s)/i);
          const seconds = retryMatch ? Math.round(parseFloat(retryMatch[1])) : null;

          const baseMsg = "Gemini API quota exceeded.";
          if (seconds) {
            return `${baseMsg} Please retry in ${seconds}s.`;
          }
          return baseMsg;
        }

        // Default cleanup (remove URL details to keep toaster clean)
        return cleanMsg.replace(/For more information.*$/gi, "").trim();
      }
    } catch (e) {
      // Fail silent, return raw message if parsing fails
    }
  }

  return msg;
};

const showToast = (type, message, options = {}) => {
  if (type === "success") {
    toast.success(message, options);
  } else if (type === "error") {
    toast.error(message, options);
  } else {
    toast(message, options);
  }
};

//  Main API client
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

//  Separate client for refresh (NO interceptors)
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers = [];

//  Notify queued requests
const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

//  Add subscriber
const addSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// ============================
//  REQUEST INTERCEPTOR
// ============================
axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenService.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Show success toast for successful operations (optional)
    const method = response.config.method?.toUpperCase();
    const url = response.config.url;

    // Show success for POST/PUT/DELETE operations (but not for login/register as they handle their own toasts)
    // if (['POST', 'PUT', 'DELETE'].includes(method) &&
    //     !url?.includes('/auth/login') &&
    //     !url?.includes('/auth/register') &&
    //     response.data?.message) {
    //   showToast("success", response.data.message);
    // }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 1. NETWORK ERRORS (Server is down)
    if (!error.response) {
      showToast(
        "error",
        "Network error. Please check your internet connection.",
      );
      return Promise.reject(error);
    }

    const status = error.response.status;
    const rawErrorMessage = error.response.data?.message || "Something went wrong";
    const errorMessage = getCleanErrorMessage(rawErrorMessage);

    // 2. LOGOUT LOGIC (Session Versioning / Refresh Failed)
    // We handle the specific 401 redirect errors in the catch block below.

    // 3. OTHER ERRORS (403, 400, 404, 500, 429)
    // We ignore 401 here because it might be refreshed successfully.
    if (status !== 401) {
      // Enhanced error handling with specific messages
      let errorTitle = "Error";
      switch (status) {
        case 400:
          errorTitle = "Bad Request";
          break;
        case 403:
          errorTitle = "Access Denied";
          break;
        case 404:
          errorTitle = "Not Found";
          break;
        case 429:
          errorTitle = "Rate Limit Exceeded";
          break;
        case 500:
          errorTitle = "Server Error";
          break;
      }

      showToast("error", `${errorTitle}: ${errorMessage}`, {
        duration: status === 500 || status === 429 ? 6000 : 4000, // Longer duration for rate limits/server errors
      });
      return Promise.reject(error.response?.data || error);
    }

    // --- 401 Handling Logic ---
    if (originalRequest.url.includes("/auth/login")) {
      showToast("error", errorMessage); // Wrong password/email
      return Promise.reject(error.response?.data || error);
    }

    if (
      originalRequest._retry ||
      originalRequest.url.includes("/auth/refresh")
    ) {
      return Promise.reject(error.response?.data || error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        addSubscriber((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = tokenService.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token available");

      const response = await refreshClient.post("/auth/refresh", {
        refreshToken,
      });
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      tokenService.setTokens({ accessToken, refreshToken: newRefreshToken });
      onRefreshed(accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return axiosInstance(originalRequest);
    } catch (err) {
      // 4. SESSION KILLED (Single session logic triggered here)
      const sessionError =
        err.response?.data?.message || "Session expired. Please login again.";

      showToast("error", sessionError, { id: "session-expired" }); // Use an ID to prevent duplicate toasts

      refreshSubscribers = [];
      tokenService.clearTokens();
      window.location.href = "/login";

      return Promise.reject(err.response?.data || err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosInstance;
