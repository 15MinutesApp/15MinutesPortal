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

export const ADMIN_REFRESH_TOKENS = gql`
  mutation AdminRefreshTokens($refreshToken: String!) {
    Admin_refreshTokens(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

// Admin Queries
export const ADMIN_ME = gql`
  query AdminMe {
    Admin_me {
      id
      email
      createdAt
    }
  }
`;

export const ADMIN_USERS = gql`
  query AdminUsers($page: Int!, $limit: Int!) {
    Admin_users(page: $page, limit: $limit) {
      id
      email
      createdAt
    }
  }
`;

export const ADMIN_UPDATE_INTEREST_STATUS = gql`
  mutation AdminUpdateInterest($input: UpdateInterestInput!) {
    Admin_updateInterest(input: $input) {
      id
      isActive
    }
  }
`;

export const ADMIN_CREATE_INTEREST = gql`
  mutation AdminCreateInterest($input: CreateInterestInput!) {
    Admin_createInterest(input: $input) {
      id
      name
      thumbnail
      userCount
      isActive
      interestCategory {
        id
        name
      }
    }
  }
`;

export const ADMIN_CREATE_INTEREST_CATEGORY = gql`
  mutation AdminCreateInterestCategory($input: CreateInterestCategoryInput!) {
    Admin_createInterestCategory(input: $input) {
      id
      name
      thumbnail
      userCount
      isActive
    }
  }
`;

export const ADMIN_UPDATE_INTEREST = gql`
  mutation AdminUpdateInterest($input: UpdateInterestInput!) {
    Admin_updateInterest(input: $input) {
      id
      name
      thumbnail
      userCount
      isActive
      interestCategory {
        id
        name
      }
    }
  }
`;

export const ADMIN_UPDATE_INTEREST_CATEGORY = gql`
  mutation AdminUpdateInterestCategory($input: UpdateInterestCategoryInput!) {
    Admin_updateInterestCategory(input: $input) {
      id
      name
      thumbnail
      userCount
      isActive
    }
  }
`;

export const ADMIN_DELETE_INTEREST = gql`
  mutation AdminDeleteInterest($id: ID!) {
    Admin_deleteInterest(id: $id)
  }
`;

export const ADMIN_DELETE_INTEREST_CATEGORY = gql`
  mutation AdminDeleteInterestCategory($id: ID!) {
    Admin_deleteInterestCategory(id: $id)
  }
`;

export const ADMIN_INTEREST_CATEGORIES = gql`
  query AdminInterestCategories {
    Admin_interestCategories {
      id
      name
      thumbnail
      userCount
      interestCount
      interests {
        id
        name
        thumbnail
        userCount
      }
    }
  }
`;

export const ADMIN_INTERESTS = gql`
  query AdminInterests {
    Admin_interests {
      id
      name
      thumbnail
      userCount
      interestCategory {
        id
        name
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
