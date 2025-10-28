import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { gql } from "@apollo/client";
// import { tokenStorage } from "@/lib/auth/authService";

// HTTP-only cookie'ler için refresh token mekanizması
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Refresh token fonksiyonu
const refreshToken = async (): Promise<string | null> => {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // HTTP-only cookie'leri dahil et
    });

    const result = await response.json();

    if (response.status !== 200 || result.error) {
      throw new Error(result.error || "Token refresh failed");
    }

    // Yeni token'lar cookie'ye otomatik olarak set edilecek
    return result.data?.Admin_refreshTokens?.accessToken || null;
  } catch (error) {
    console.error("[Apollo Client] Token refresh failed:", error);
    return null;
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
  ({ graphQLErrors, networkError, operation, forward }: any) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }: any) => {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        );
      });

      // 401 Unauthorized hatası kontrolü
      const unauthorizedError = graphQLErrors.find(
        (error: any) =>
          error.message.includes("Admin authentication required") ||
          error.message.includes("Unauthorized") ||
          error.message.includes("401")
      );

      if (unauthorizedError) {
        if (!isRefreshing) {
          isRefreshing = true;
          console.log(
            "[Apollo Client] 401 detected, attempting token refresh..."
          );

          refreshToken()
            .then((newToken) => {
              console.log("[Apollo Client] Token refresh successful");
              processQueue(null, newToken);
              isRefreshing = false;

              // Başarılı refresh sonrası orijinal request'i tekrar dene
              if (forward) {
                console.log(
                  "[Apollo Client] Retrying original request after refresh"
                );
                return forward(operation);
              }
            })
            .catch((refreshError) => {
              console.error(
                "[Apollo Client] Token refresh failed:",
                refreshError
              );
              processQueue(refreshError, null);
              isRefreshing = false;

              // Refresh başarısız olursa kullanıcıyı login sayfasına yönlendir
              if (typeof window !== "undefined") {
                console.log(
                  "[Apollo Client] Redirecting to login due to refresh failure"
                );
                window.location.href = "/login";
              }
            });
        } else {
          // Already refreshing, wait for it to complete
          return new Promise((resolve) => {
            failedQueue.push({
              resolve,
              reject: () => {},
            });
          });
        }
      }
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
    }

    return forward(operation);
  }
);

// Apollo Client oluştur
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
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
