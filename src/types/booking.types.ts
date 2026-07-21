import { User } from './user.types';
import { Restaurant, MenuItem } from './restaurant.types';

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  zone: string | null;
  status: 'available' | 'occupied' | 'reserved' | 'inactive' | 'maintenance';
  depositAmount: number;
  note: string | null;
  isActive: boolean;
}

export interface PreOrderItem {
  menuItemId: string;
  nameSnapshot?: string;
  priceSnapshot?: string | number;
  quantity: number;
  note?: string | null;
}

export interface Booking {
  id: string;
  customerId: string | User;
  restaurantId: string | Restaurant;
  bookingDate: string;
  bookingTime: string;
  numberOfGuests: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  specialRequests: string | null;
  occasion: 'birthday' | 'anniversary' | 'business' | 'date' | 'family' | 'other' | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  depositAmount: number;
  depositPaid: boolean;
  depositPaidAt?: string | null;
  paymentId?: string | null;
  tableNumbers: string[];
  reviewed: boolean;
  reviewId?: string | null;
  checkedInAt?: string | null;
  preOrderItems: {
    menuItemId: string | MenuItem;
    nameSnapshot: string;
    priceSnapshot: number;
    quantity: number;
    note: string | null;
  }[];
  voucherCode?: string | null;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  cancellationPolicyCode?: string | null;
  cancellationFeeRateBasisPoints?: number;
  cancellationFeeAmount?: number;
  refundAmount?: number;
  refundMethod?: 'BOOKEAT_WALLET' | string | null;
  refundStatus?: string | null;
}

export interface CancellationPreview {
  canCancel: boolean;
  bookingDateTime: string;
  serverTime: string;
  remainingMinutes: number;
  policyCode: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'CANCELLATION_CLOSED';
  depositPaid: number;
  cancellationFeeRate: number;
  cancellationFeeRateBasisPoints: number;
  cancellationFeeAmount: number;
  refundAmount: number;
  refundMethod: 'BOOKEAT_WALLET';
  message: string;
}

export interface CancellationResult {
  bookingId: string;
  bookingStatus: 'cancelled';
  cancelledAt: string;
  policyCode: string;
  depositPaid: number;
  cancellationFeeRate: number;
  cancellationFeeRateBasisPoints: number;
  cancellationFeeAmount: number;
  refundAmount: number;
  refundMethod: 'BOOKEAT_WALLET';
  refundStatus: string;
  walletBalance: number;
  walletTransactionId: string | null;
  refundId: string | null;
  alreadyProcessed: boolean;
}

export interface BookingPayload {
  restaurantId: string;
  bookingDate: string; // ISO date string (YYYY-MM-DD)
  bookingTime: string; // HH:mm
  numberOfGuests: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  specialRequests?: string | null;
  occasion?: string | null;
  tableNumbers: string[];
  preOrderItems?: {
    menuItemId: string;
    quantity: number;
    note?: string | null;
  }[];
  voucherCode?: string | null;
}
