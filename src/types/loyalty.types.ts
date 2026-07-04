export type LoyaltyTransactionType =
  | 'earn_deposit'
  | 'earn_completed'
  | 'redeem_deposit'
  | 'redeem_voucher'
  | 'refund'
  | 'admin_adjust';

export interface LoyaltyHistoryItem {
  id: string;
  points: number;
  type: LoyaltyTransactionType;
  referenceId: string | null;
  description: string;
  expiresAt: string | null;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltySummary {
  loyaltyPoints: number;
  totalPointsEarned: number;
  history: LoyaltyHistoryItem[];
}

export interface LoyaltyPreview {
  depositAmount: number;
  userCoins: number;
  coinsToApply: number;
  finalAmount: number;
}
