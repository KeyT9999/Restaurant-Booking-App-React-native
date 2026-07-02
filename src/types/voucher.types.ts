export interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'platform' | 'restaurant' | 'loyalty' | 'referral' | 'system' | 'compensation';
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  startDate: string;
  endDate: string | null;
  globalUsageLimit: number | null;
  perCustomerLimit: number;
  restaurantId: string | null;
  status: 'active' | 'inactive' | 'expired' | 'paused' | 'disabled' | 'scheduled';
}

export interface CustomerVoucher {
  id: string;
  customerId: string;
  voucherId: Voucher;
  savedAt: string;
  usedAt: string | null;
  isUsed: boolean;
}
