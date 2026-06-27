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
  vendorSubscription?: VendorSubscription;
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
  tokenType: string;
  // refreshToken no longer returned in body — it lives in HttpOnly cookie
  refreshToken?: string; // kept optional for backwards compatibility
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  ver: number;
  jti: string;
  iat: number;
  exp: number;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface ActiveSession {
  id: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  lastUsedAt?: string;
  createdAt: string;
  country?: string;
}

// ─── Commission / Financial ───────────────────────────────────────────────────

export type SubscriptionTier = 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'CANCELLED' | 'GRACE_PERIOD' | 'EXPIRED';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description?: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  commissionRate: number;
  maxListings?: number;
  isFeatured: boolean;
  hasAnalytics: boolean;
  hasEarlyPayout: boolean;
  hasDedicatedManager: boolean;
  hasApiAccess: boolean;
  trialDays: number;
  sortOrder: number;
}

export interface VendorSubscription {
  id: string;
  vendorId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: string;
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  autoRenew: boolean;
  currentPeriodStart: string;
  currentPeriodEnd?: string;
}

export interface VendorWallet {
  id: string;
  vendorId: string;
  availableBalance: number;
  pendingBalance: number;
  heldBalance: number;
  lifetimeEarnings: number;
  totalCommissionPaid: number;
  totalWithdrawn: number;
  totalRefunds: number;
  currency: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  telebirrNumber?: string;
  isPayoutEnabled: boolean;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export interface CommissionRule {
  id: string;
  name: string;
  type: string;
  status: string;
  priority: number;
  rate?: number;
  fixedAmount?: number;
  tiers?: any[];
  vendorId?: string;
  categoryId?: string;
  subscriptionTier?: SubscriptionTier;
  effectiveFrom: string;
  effectiveTo?: string;
  isEnabled: boolean;
}

export interface CommissionSettings {
  id: string;
  globalDefaultRate: number;
  platformFeeRate: number;
  currency: string;
  settlementFrequency: string;
  escrowHoldDays: number;
  minWithdrawalAmount: number;
}
