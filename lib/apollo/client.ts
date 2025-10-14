import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { gql } from "@apollo/client";
import { tokenStorage } from "@/lib/auth/authService";

// HTTP Link - proxy endpoint kullanıyoruz
const httpLink = createHttpLink({
  uri: "/api/graphql",
});

// Auth Link - token'ı header'a ekler
const authLink = setContext((_, { headers }) => {
  // Server-side rendering sırasında localStorage'a erişmeyi engelle
  if (typeof window === "undefined") {
    return { headers };
  }

  const token = tokenStorage.getAccessToken();

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Error Link - hataları yakalar
const errorLink = onError((error) => {
  const graphQLErrors = (error as any).graphQLErrors as any[] | undefined;
  const networkError = (error as any).networkError as unknown | undefined;

  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }: any) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

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
