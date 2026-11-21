export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: AuthUser;
    tokens: AuthTokens;
  };
  message?: string;
}
