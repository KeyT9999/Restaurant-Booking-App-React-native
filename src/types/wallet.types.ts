export interface BookEatWallet {
  id: string | null;
  balance: number;
  status: 'active' | 'frozen' | string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WalletTransaction {
  id: string;
  bookingId: string | null;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: string;
  referenceId: string | null;
  description: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface WalletPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
