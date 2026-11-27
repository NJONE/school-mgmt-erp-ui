export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}
export interface CreateUserRequest {
  email: string;
  displayName: string;
  password: string;
  schoolId?: string;
  branchId?: string;
  academicSessionId?: string;
  roleKeys?: string[];
  permissions?: string[];
  isPlatformAdmin?: boolean;
  tenantId?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
  isPlatformAdmin?: boolean;
  tenantId?: string | null;
  schoolId?: string | null;
  branchId?: string | null;
  academicSessionId?: string | null;
  roleKeys?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  expiresIn?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: AuthUser;
    tokens: AuthTokens;
  };
  message?: string;
}
