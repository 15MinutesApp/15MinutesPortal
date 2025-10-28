import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;

// Queue to store requests that need to be retried after token refresh
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
  config: InternalAxiosRequestConfig;
}> = [];

// Process queued requests after token refresh
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      // Retry the request with the same config
      axios.request(config).then(resolve).catch(reject);
    }
  });

  failedQueue = [];
};

// Refresh token function - calls GraphQL mutation
const refreshToken = async (): Promise<string | null> => {
  try {
    const response = await axios.post(
      "/api/auth/refresh",
      {},
      {
        withCredentials: true, // Include HTTP-only cookies
      }
    );

    if (response.data.data?.Admin_refreshTokens) {
      const { accessToken, refreshToken: newRefreshToken } =
        response.data.data.Admin_refreshTokens;
      console.log("[Axios] Token refresh successful");
      return accessToken;
    }

    throw new Error("No token data in response");
  } catch (error) {
    console.error("[Axios] Token refresh failed:", error);
    return null;
  }
};

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true, // Always include HTTP-only cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - logs requests
axiosInstance.interceptors.request.use(
  (config) => {
    console.log("[Axios] Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles 401 errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Check if error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if the failed endpoint is the refresh endpoint itself
      if (originalRequest.url === "/auth/refresh") {
        console.log("[Axios] Refresh token is invalid, logging out");
        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
            config: originalRequest,
          });
        });
      }

      // Start refresh process
      isRefreshing = true;
      originalRequest._retry = true;

      console.log("[Axios] 401 detected, attempting token refresh...");

      const newToken = await refreshToken();

      if (newToken) {
        console.log("[Axios] Token refresh successful, retrying request");
        processQueue(null, newToken);
        isRefreshing = false;

        // Retry the original request
        return axiosInstance(originalRequest);
      } else {
        console.log("[Axios] Token refresh failed, logging out");
        isRefreshing = false;
        processQueue(new Error("Token refresh failed"), null);

        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
