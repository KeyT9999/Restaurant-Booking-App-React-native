export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  address: string | null;
  role: 'customer' | 'restaurant_owner' | 'admin';
  avatarUrl: string | null;
  emailVerified: boolean;
  active: boolean;
  loyaltyPoints: number;
  totalPointsEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: User;
}
