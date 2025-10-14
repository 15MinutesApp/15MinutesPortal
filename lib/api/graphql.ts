/**
 * GraphQL API Client
 * Handles all GraphQL requests to the backend
 */

// Use proxy endpoint to avoid CORS issues
const GRAPHQL_ENDPOINT = "/api/graphql";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: {
      code?: string;
    };
  }>;
}

export class GraphQLError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "GraphQLError";
  }
}

/**
 * Generic GraphQL request function
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, any>,
  token?: string
): Promise<T> {
  console.log("GraphQL Request:", {
    endpoint: GRAPHQL_ENDPOINT,
    query: query.substring(0, 100) + "...",
    variables,
    hasToken: !!token,
  });

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const requestBody = {
      query,
      variables,
    };

    console.log("Request body:", requestBody);

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HTTP Error Response:", errorText);
      throw new GraphQLError(
        `HTTP Error: ${response.statusText} (${response.status})`,
        "HTTP_ERROR",
        response.status
      );
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      const error = result.errors[0];
      console.error("GraphQL Error:", error);
      throw new GraphQLError(
        error.message,
        error.extensions?.code || "GRAPHQL_ERROR"
      );
    }

    if (!result.data) {
      throw new GraphQLError("No data returned from GraphQL", "NO_DATA");
    }

    return result.data;
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Network or other errors
    throw new GraphQLError(
      error instanceof Error ? error.message : "Unknown error occurred",
      "NETWORK_ERROR"
    );
  }
}
