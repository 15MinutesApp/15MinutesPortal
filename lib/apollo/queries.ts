import { gql } from "@apollo/client";

// Admin Login Mutations
export const ADMIN_START_PASSWORD_LOGIN = gql`
  mutation AdminStartPasswordLogin($email: String!, $password: String!) {
    Admin_startPasswordLogin(email: $email, password: $password)
  }
`;

export const ADMIN_VERIFY_TOTP = gql`
  mutation AdminVerifyTotp($challengeToken: String!, $totpCode: String!) {
    Admin_verifyTotp(challengeToken: $challengeToken, totpCode: $totpCode) {
      accessToken
      refreshToken
    }
  }
`;

export const ADMIN_VERIFY_BACKUP_CODE = gql`
  mutation AdminVerifyBackupCode(
    $challengeToken: String!
    $backupCode: String!
  ) {
    Admin_verifyBackupCode(
      challengeToken: $challengeToken
      backupCode: $backupCode
    ) {
      accessToken
      refreshToken
    }
  }
`;

// Admin Queries
export const ADMIN_USERS = gql`
  query AdminUsers($page: Int!, $limit: Int!) {
    Admin_users(page: $page, limit: $limit) {
      id
      email
      createdAt
    }
  }
`;

export const ADMIN_INTERESTS = gql`
  query AdminInterests {
    Admin_interests {
      id
      name
      thumbnail
      interestCategory {
        id
        name
        thumbnail
      }
    }
  }
`;

// Test Query
export const TEST_CONNECTION = gql`
  query TestConnection {
    __schema {
      types {
        name
      }
    }
  }
`;
