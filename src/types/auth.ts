export interface AuthUser {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  email: string;
  is_super_admin: boolean;
  is_active: boolean;
  must_change_password: boolean;
  has_full_access: boolean;
  permissions: string[];
}

export interface LoginRequest {
  matricule: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  user: AuthUser;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  tokenExpiresAt: number | null;
  error: string | null;
}
