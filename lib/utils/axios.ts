import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;

// Queue to store requests that need to be retried after token refresh
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
  config: InternalAxiosRequestConfig;
}> = [];

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true, // Always include HTTP-only cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Process queued requests after token refresh
const processQueue = (error: any = null) => {
  console.log(
    "[Axios Debug] Processing queue, queue length:",
    failedQueue.length,
    "error:",
    error
  );
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      console.log(
        "[Axios Debug] Rejecting queued request due to error:",
        config.url
      );
      reject(error);
    } else {
      console.log("[Axios Debug] Retrying queued request:", config.url);
      // Retry the request with the same config
      axiosInstance.request(config).then(resolve).catch(reject);
    }
  });

  failedQueue = [];
};

// Logout function
const handleLogout = async () => {
  console.log("[Axios Debug] handleLogout called");
  try {
    console.log("[Axios Debug] Calling logout endpoint");
    await axiosInstance.post("/auth/logout");
    console.log("[Axios Debug] Logout endpoint called successfully");
  } catch (error) {
    console.error("[Axios Debug] Logout request failed:", error);
  } finally {
    if (typeof window !== "undefined") {
      console.log("[Axios Debug] Redirecting to login page");
      window.location.href = "/login";
    }
  }
};

// Refresh token function - uses raw axios to avoid interceptor loop
const refreshToken = async (): Promise<boolean> => {
  console.log("[Axios Debug] refreshToken called, isRefreshing:", isRefreshing);
  try {
    // Use raw axios instance without interceptors to avoid infinite loop
    // But we still need withCredentials for cookies
    console.log("[Axios Debug] Calling /api/auth/refresh endpoint");
    const response = await axios.post(
      "/api/auth/refresh",
      {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("[Axios Debug] Refresh response status:", response.status);
    console.log("[Axios Debug] Refresh response data:", response.data);

    if (response.status === 200) {
      // Tokens are automatically set as HTTP-only cookies by the server
      // No need to manually store them
      console.log(
        "[Axios Debug] Token refresh successful, cookies should be updated"
      );
      return true;
    }

    console.log("[Axios Debug] Token refresh failed - status not 200");
    return false;
  } catch (error: any) {
    console.error("[Axios Debug] Token refresh failed with error:", error);
    console.error(
      "[Axios Debug] Error response:",
      error.response?.status,
      error.response?.data
    );
    console.error("[Axios Debug] Error message:", error.message);
    return false;
  }
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const fullURL = (config.baseURL || "") + (config.url || "");
    console.log(
      "[Axios Debug] Request interceptor - method:",
      config.method,
      "url:",
      config.url,
      "fullURL:",
      fullURL
    );
    console.log(
      "[Axios Debug] Request config has _retry flag:",
      (config as any)._retry
    );
    console.log(
      "[Axios Debug] Request config has _skipAuthRefresh flag:",
      (config as any)._skipAuthRefresh
    );
    return config;
  },
  (error) => {
    console.error("[Axios Debug] Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles 401 errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      "[Axios Debug] Response interceptor - status:",
      response.status,
      "url:",
      response.config.url
    );
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _skipAuthRefresh?: boolean;
    };

    console.log(
      "[Axios Debug] Response interceptor error - status:",
      error.response?.status,
      "url:",
      originalRequest?.url
    );
    console.log("[Axios Debug] Error response data:", error.response?.data);
    console.log(
      "[Axios Debug] Original request _retry flag:",
      originalRequest?._retry
    );
    console.log(
      "[Axios Debug] Original request _skipAuthRefresh flag:",
      originalRequest?._skipAuthRefresh
    );
    console.log("[Axios Debug] isRefreshing flag:", isRefreshing);

    // Check if this request should skip auth refresh
    if (originalRequest?._skipAuthRefresh) {
      console.log("[Axios Debug] Skipping auth refresh for this request");
      return Promise.reject(error);
    }

    // Check if error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      const requestUrl = originalRequest.url || "";
      console.log("[Axios Debug] 401 error detected for URL:", requestUrl);

      // Check if the failed endpoint is the refresh endpoint itself
      if (
        requestUrl === "/auth/refresh" ||
        requestUrl.includes("/auth/refresh")
      ) {
        console.log(
          "[Axios Debug] Refresh token endpoint returned 401 - refresh token is invalid, logging out"
        );
        await handleLogout();
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        console.log(
          "[Axios Debug] Already refreshing, queueing this request. Queue length:",
          failedQueue.length
        );
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
            config: originalRequest,
          });
        });
      }

      // Start refresh process
      console.log("[Axios Debug] Starting refresh process");
      isRefreshing = true;
      originalRequest._retry = true;

      console.log("[Axios Debug] Calling refreshToken function");

      const refreshSuccess = await refreshToken();

      console.log("[Axios Debug] refreshToken returned:", refreshSuccess);
      console.log("[Axios Debug] Setting isRefreshing to false");

      if (refreshSuccess) {
        console.log(
          "[Axios Debug] Token refresh successful, processing queue and retrying original request"
        );
        isRefreshing = false;
        processQueue(null);

        // Retry the original request
        console.log(
          "[Axios Debug] Retrying original request:",
          originalRequest.url
        );
        return axiosInstance(originalRequest);
      } else {
        console.log("[Axios Debug] Token refresh failed, logging out");
        isRefreshing = false;
        processQueue(new Error("Token refresh failed"));

        await handleLogout();
        return Promise.reject(error);
      }
    }

    console.log("[Axios Debug] Not a 401 error or already retried, rejecting");
    return Promise.reject(error);
  }
);

export default axiosInstance;
