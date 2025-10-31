import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  gql,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { Observable } from "@apollo/client/utilities";

// Load error messages for better debugging (Apollo Client 3.8+)
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  import("@apollo/client/dev").then(
    ({ loadDevMessages, loadErrorMessages }) => {
      loadDevMessages();
      loadErrorMessages();
    }
  );
}
// import { tokenStorage } from "@/lib/auth/authService";

// HTTP-only cookie'ler için refresh token mekanizması
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

const ensureRefreshPromise = () => {
  if (!refreshPromise) {
    console.log("[Apollo Debug] Creating new refresh promise");
    isRefreshing = true;
    refreshPromise = refreshToken()
      .then((refreshSuccess) => {
        console.log("[Apollo Debug] refreshToken returned:", refreshSuccess);
        if (!refreshSuccess) {
          throw new Error("Token refresh failed");
        }
      })
      .catch((error) => {
        console.error("[Apollo Debug] Refresh promise rejected:", error);
        throw error;
      })
      .finally(() => {
        console.log("[Apollo Debug] Clearing refresh promise");
        isRefreshing = false;
        refreshPromise = null;
      });
  } else {
    console.log("[Apollo Debug] Reusing existing refresh promise");
  }

  return refreshPromise;
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

// Helper function to check if error is unauthorized
const isUnauthorizedError = (error: any): boolean => {
  if (!error) return false;

  const message = error.message || "";
  const extensions = error.extensions || {};

  return (
    message.includes("Admin authentication required") ||
    message.includes("Unauthorized") ||
    message.includes("401") ||
    extensions.code === "UNAUTHENTICATED" ||
    extensions.code === "UNAUTHORIZED" ||
    extensions.originalError?.statusCode === 401
  );
};

// Error Link - hataları yakalar ve token refresh işlemi yapar
const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward, response }: any) => {
    console.log("[Apollo Debug] ========== ErrorLink triggered ==========");
    console.log("[Apollo Debug] graphQLErrors:", graphQLErrors);
    console.log("[Apollo Debug] networkError:", networkError);
    console.log("[Apollo Debug] operation:", operation?.operationName);
    console.log("[Apollo Debug] response:", response);
    console.log("[Apollo Debug] response?.errors:", response?.errors);

    // Collect all errors from different sources
    let allErrors: any[] = [];

    // Get errors from graphQLErrors
    if (graphQLErrors) {
      allErrors = [...graphQLErrors];
      graphQLErrors.forEach(({ message, locations, path, extensions }: any) => {
        console.error(
          `[Apollo Debug] GraphQL error: Message: ${message}, Location: ${JSON.stringify(
            locations
          )}, Path: ${path}, Extensions: ${JSON.stringify(extensions)}`
        );
      });
    }

    // Get errors from response.errors
    if (response?.errors) {
      allErrors = [...allErrors, ...response.errors];
      response.errors.forEach((error: any, index: number) => {
        console.log(`[Apollo Debug] response.errors[${index}]:`, error);
        console.log(
          `[Apollo Debug] response.errors[${index}].message:`,
          error?.message
        );
        console.log(
          `[Apollo Debug] response.errors[${index}].extensions:`,
          error?.extensions
        );
      });
    }

    // Get errors from networkError.result.errors
    if ((networkError as any)?.result?.errors) {
      allErrors = [...allErrors, ...(networkError as any).result.errors];
      (networkError as any).result.errors.forEach(
        (error: any, index: number) => {
          console.log(
            `[Apollo Debug] networkError.result.errors[${index}]:`,
            error
          );
          console.log(
            `[Apollo Debug] networkError.result.errors[${index}].message:`,
            error?.message
          );
        }
      );
    }

    // Check for logout required error (refresh token invalid)
    const logoutRequiredError = allErrors.find(
      (error: any) =>
        error?.extensions?.logoutRequired === true ||
        (error?.extensions?.code === "UNAUTHENTICATED" &&
          error?.message?.includes("Session expired"))
    );

    if (logoutRequiredError) {
      console.log(
        "[Apollo Debug] Logout required error detected, logging out and redirecting..."
      );
      handleLogout();
      // Return an Observable that immediately errors
      return new Observable((observer) => {
        observer.error(new Error("Session expired. Please login again."));
      });
    }

    // Check for unauthorized error in all error sources
    const unauthorizedError = allErrors.find(isUnauthorizedError);

    console.log("[Apollo Debug] unauthorizedError found:", !!unauthorizedError);
    console.log("[Apollo Debug] isRefreshing:", isRefreshing);

    if (unauthorizedError) {
      // Check if this is the refresh endpoint itself
      if (
        operation?.operationName === "AdminRefreshTokens" ||
        operation?.query?.definitions?.[0]?.name?.value === "AdminRefreshTokens"
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

      console.log(
        "[Apollo Debug] Triggering refresh flow for unauthorized error"
      );
      return new Observable((observer) => {
        let subscription: any = null;

        ensureRefreshPromise()
          .then(
            () =>
              new Promise((resolve) => {
                // Allow browser to apply Set-Cookie before retry
                setTimeout(resolve, 50);
              })
          )
          .then(() => {
            console.log(
              "[Apollo Debug] Refresh completed, retrying original request:",
              operation?.operationName
            );
            subscription = forward(operation).subscribe({
              next: (value: any) => {
                console.log("[Apollo Debug] Retry request succeeded");
                observer.next(value);
              },
              error: (error: any) => {
                console.error("[Apollo Debug] Retry request failed:", error);
                observer.error(error);
              },
              complete: () => {
                console.log("[Apollo Debug] Retry request completed");
                observer.complete();
              },
            });
          })
          .catch((refreshError) => {
            console.error(
              "[Apollo Debug] Refresh promise failed, logging out:",
              refreshError
            );
            handleLogout();
            observer.error(refreshError);
          });

        return () => {
          if (subscription) {
            subscription.unsubscribe();
          }
        };
      });
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
        console.log("[Apollo Debug] Triggering refresh flow for network 401");
        return new Observable((observer) => {
          let subscription: any = null;

          ensureRefreshPromise()
            .then(
              () =>
                new Promise((resolve) => {
                  // Allow browser to apply Set-Cookie before retry
                  setTimeout(resolve, 50);
                })
            )
            .then(() => {
              subscription = forward(operation).subscribe(observer);
            })
            .catch((refreshError) => {
              console.error(
                "[Apollo Debug] Refresh promise failed during network 401:",
                refreshError
              );
              handleLogout();
              observer.error(refreshError);
            });

          return () => {
            if (subscription) {
              subscription.unsubscribe();
            }
          };
        });
      }
    }

    // Continue with normal flow if no 401 error
    console.log("[Apollo Debug] No 401 error, continuing with normal flow");
    return forward(operation);
  }
);

// Apollo Client oluştur
export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "none",
    },
    query: {
      errorPolicy: "none",
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
