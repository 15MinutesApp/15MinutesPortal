import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { gql } from "@apollo/client";
import { Observable } from "@apollo/client/utilities";
// import { tokenStorage } from "@/lib/auth/authService";

// HTTP-only cookie'ler için refresh token mekanizması
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  console.log(
    "[Apollo Debug] Processing queue, queue length:",
    failedQueue.length,
    "error:",
    error
  );
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      console.log("[Apollo Debug] Rejecting queued request due to error");
      reject(error);
    } else {
      console.log("[Apollo Debug] Resolving queued request");
      resolve();
    }
  });

  failedQueue = [];
};

// Refresh token fonksiyonu
const refreshToken = async (): Promise<boolean> => {
  console.log(
    "[Apollo Debug] refreshToken called, isRefreshing:",
    isRefreshing
  );
  try {
    console.log("[Apollo Debug] Calling /api/auth/refresh endpoint");
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // HTTP-only cookie'leri dahil et
    });

    console.log("[Apollo Debug] Refresh response status:", response.status);

    const result = await response.json();
    console.log("[Apollo Debug] Refresh response data:", result);

    if (response.status === 200 && !result.error) {
      // Yeni token'lar cookie'ye otomatik olarak set edilecek
      console.log(
        "[Apollo Debug] Token refresh successful, cookies should be updated"
      );
      return true;
    }

    console.log(
      "[Apollo Debug] Token refresh failed - status not 200 or has error"
    );
    return false;
  } catch (error) {
    console.error("[Apollo Debug] Token refresh failed with error:", error);
    return false;
  }
};

// Logout function
const handleLogout = async () => {
  console.log("[Apollo Debug] handleLogout called");
  try {
    console.log("[Apollo Debug] Calling logout endpoint");
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    console.log("[Apollo Debug] Logout endpoint called successfully");
  } catch (error) {
    console.error("[Apollo Debug] Logout request failed:", error);
  } finally {
    if (typeof window !== "undefined") {
      console.log("[Apollo Debug] Redirecting to login page");
      window.location.href = "/login";
    }
  }
};

// HTTP Link - proxy endpoint kullanıyoruz, credentials: 'include' ile HTTP-only cookie'leri dahil et
const httpLink = createHttpLink({
  uri: "/api/graphql",
  credentials: "include", // HTTP-only cookie'leri dahil et
});

// Auth Link - HTTP-only cookie'ler otomatik olarak gönderilir
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
    },
  };
});

// Error Link - hataları yakalar ve token refresh işlemi yapar
const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward, response }: any) => {
    console.log("[Apollo Debug] ========== ErrorLink triggered ==========");
    console.log("[Apollo Debug] graphQLErrors:", graphQLErrors);
    console.log("[Apollo Debug] networkError:", networkError);
    console.log("[Apollo Debug] operation:", operation?.operationName);
    console.log("[Apollo Debug] response:", response);

    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }: any) => {
        console.error(
          `[Apollo Debug] GraphQL error: Message: ${message}, Location: ${JSON.stringify(
            locations
          )}, Path: ${path}, Extensions: ${JSON.stringify(extensions)}`
        );
      });

      // 401 Unauthorized hatası kontrolü
      const unauthorizedError = graphQLErrors.find(
        (error: any) =>
          error.message?.includes("Admin authentication required") ||
          error.message?.includes("Unauthorized") ||
          error.message?.includes("401") ||
          error.extensions?.code === "UNAUTHENTICATED" ||
          error.extensions?.originalError?.statusCode === 401
      );

      console.log(
        "[Apollo Debug] unauthorizedError found:",
        !!unauthorizedError
      );
      console.log("[Apollo Debug] isRefreshing:", isRefreshing);

      if (unauthorizedError) {
        // Check if this is the refresh endpoint itself
        if (
          operation?.operationName === "AdminRefreshTokens" ||
          operation?.query?.definitions?.[0]?.name?.value ===
            "AdminRefreshTokens"
        ) {
          console.log(
            "[Apollo Debug] Refresh token endpoint returned 401 - refresh token is invalid, logging out"
          );
          handleLogout();
          // Return an Observable that immediately errors
          return new Observable((observer) => {
            observer.error(new Error("Refresh token is invalid"));
          });
        }

        if (!isRefreshing) {
          isRefreshing = true;
          console.log("[Apollo Debug] Starting refresh process");

          // Return an Observable that handles the refresh and retry
          return new Observable((observer) => {
            let subscription: any = null;
            refreshToken()
              .then((refreshSuccess) => {
                console.log(
                  "[Apollo Debug] refreshToken returned:",
                  refreshSuccess
                );
                isRefreshing = false;

                if (refreshSuccess) {
                  console.log(
                    "[Apollo Debug] Token refresh successful, processing queue and retrying request"
                  );
                  processQueue(null);

                  // Retry the original request
                  console.log(
                    "[Apollo Debug] Retrying original request:",
                    operation?.operationName
                  );
                  subscription = forward(operation).subscribe({
                    next: (value: any) => {
                      console.log("[Apollo Debug] Retry request succeeded");
                      observer.next(value);
                    },
                    error: (error: any) => {
                      console.error(
                        "[Apollo Debug] Retry request failed:",
                        error
                      );
                      observer.error(error);
                    },
                    complete: () => {
                      console.log("[Apollo Debug] Retry request completed");
                      observer.complete();
                    },
                  });
                } else {
                  console.log(
                    "[Apollo Debug] Token refresh failed, logging out"
                  );
                  processQueue(new Error("Token refresh failed"));

                  handleLogout();
                  observer.error(new Error("Token refresh failed"));
                }
              })
              .catch((refreshError) => {
                console.error(
                  "[Apollo Debug] Token refresh failed with exception:",
                  refreshError
                );
                isRefreshing = false;
                processQueue(refreshError);

                handleLogout();
                observer.error(refreshError);
              });

            // Return cleanup function
            return () => {
              if (subscription) {
                subscription.unsubscribe();
              }
            };
          });
        } else {
          // Already refreshing, queue this request
          console.log(
            "[Apollo Debug] Already refreshing, queueing this request. Queue length:",
            failedQueue.length
          );
          return new Observable((observer) => {
            let subscription: any = null;
            failedQueue.push({
              resolve: () => {
                console.log("[Apollo Debug] Queued request being retried");
                subscription = forward(operation).subscribe({
                  next: (value: any) => observer.next(value),
                  error: (error: any) => observer.error(error),
                  complete: () => observer.complete(),
                });
              },
              reject: (error: any) => {
                console.error("[Apollo Debug] Queued request rejected:", error);
                observer.error(error);
              },
            });

            // Return cleanup function
            return () => {
              if (subscription) {
                subscription.unsubscribe();
              }
            };
          });
        }
      }
    }

    if (networkError) {
      console.error(`[Apollo Debug] Network error:`, networkError);
      // Check if it's a 401 network error
      if (
        (networkError as any)?.statusCode === 401 ||
        (networkError as any)?.status === 401
      ) {
        console.log("[Apollo Debug] Network 401 error detected");
        // Same handling as GraphQL 401 error
        if (!isRefreshing) {
          isRefreshing = true;
          return new Observable((observer) => {
            let subscription: any = null;
            refreshToken()
              .then((refreshSuccess) => {
                isRefreshing = false;
                if (refreshSuccess) {
                  processQueue(null);
                  subscription = forward(operation).subscribe(observer);
                } else {
                  processQueue(new Error("Token refresh failed"));
                  handleLogout();
                  observer.error(networkError);
                }
              })
              .catch((refreshError) => {
                isRefreshing = false;
                processQueue(refreshError);
                handleLogout();
                observer.error(refreshError);
              });

            // Return cleanup function
            return () => {
              if (subscription) {
                subscription.unsubscribe();
              }
            };
          });
        } else {
          // Already refreshing, queue this request
          return new Observable((observer) => {
            let subscription: any = null;
            failedQueue.push({
              resolve: () => {
                subscription = forward(operation).subscribe(observer);
              },
              reject: (error: any) => {
                observer.error(error);
              },
            });

            // Return cleanup function
            return () => {
              if (subscription) {
                subscription.unsubscribe();
              }
            };
          });
        }
      }
    }

    // Continue with normal flow if no 401 error
    console.log("[Apollo Debug] No 401 error, continuing with normal flow");
    return forward(operation);
  }
);

// Apollo Client oluştur
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all", // Keep "all" so errors are returned in data, but errorLink still handles them
    },
    query: {
      errorPolicy: "all", // Keep "all" so errors are returned in data, but errorLink still handles them
    },
  },
});

// Test connection function
export const testApolloConnection = async () => {
  try {
    const result = await apolloClient.query({
      query: gql`
        query TestConnection {
          __schema {
            types {
              name
            }
          }
        }
      `,
    });
    console.log("Apollo Client connection successful:", result);
    return true;
  } catch (error) {
    console.error("Apollo Client connection failed:", error);
    return false;
  }
};
