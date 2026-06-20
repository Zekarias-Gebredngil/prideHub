export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EVENT_PLANNER' | 'VENDOR' | 'CLIENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING_VERIFICATION';

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isTwoFactorEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  profile?: ClientProfile;
  vendorProfile?: VendorProfile;
}

export interface ClientProfile {
  id: string;
  userId: string;
  company?: string;
  address?: string;
  city?: string;
  country: string;
  bio?: string;
  totalSpent: number;
  totalBookings: number;
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  description?: string;
  categoryId: string;
  category?: VendorCategory;
  city?: string;
  basePrice?: number;
  priceUnit?: string;
  isVerified: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  averageRating: number;
  totalReviews: number;
}

export interface VendorCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
