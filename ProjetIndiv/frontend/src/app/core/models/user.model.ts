export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}
