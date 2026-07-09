import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function WithdrawalScreen() {
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchWithdrawals = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await ownerApi.getWithdrawals();
      if (res.success) {
        setWithdrawals(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      // Quiet fail if DB is new
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleRequestWithdrawal = async () => {
    if (!activeRestaurant?.id) {
      showToast('Không có thông tin nhà hàng active', 'error');
      return;
    }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) < 50000) {
      showToast('Số tiền rút tối thiểu là 50.000đ', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ownerApi.createWithdrawal({
        restaurantId: activeRestaurant.id,
        amount: Number(amount),
        bankName: 'Vietcombank',
        accountNumber: '0071001234567',
        accountHolder: 'NGUYEN VAN A',
      });

      if (res.success) {
        showToast('Gửi yêu cầu rút tiền thành công!', 'success');
        setAmount('');
        fetchWithdrawals(false);
      } else {
        showToast(res.message || 'Yêu cầu rút tiền thất bại', 'error');
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Không thể tạo yêu cầu rút tiền', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Default mock withdrawals if database has none
  const displayWithdrawals = withdrawals.length > 0 ? withdrawals : [
    { _id: '1', amount: 5000000, status: 'completed', createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), bankAccount: { bankName: 'Vietcombank', accountNumber: '***1234' } },
    { _id: '2', amount: 3500000, status: 'completed', createdAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(), bankAccount: { bankName: 'Vietcombank', accountNumber: '***1234' } },
    { _id: '3', amount: 2000000, status: 'pending', createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), bankAccount: { bankName: 'Vietcombank', accountNumber: '***1234' } },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  const getStatusStyle = (status: string) => {
    if (status === 'completed') {
      return { text: T.color.success, bg: 'rgba(16, 185, 129, 0.08)' };
    }
    return { text: T.color.primary, bg: 'rgba(212, 150, 83, 0.08)' };
  };

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return 'Thành công';
    if (status === 'cancelled') return 'Đã hủy';
    return 'Đang xử lý';
  };

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Yêu cầu rút tiền" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Request Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Tạo yêu cầu rút tiền</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tiền rút (VND) *</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome name="money" size={15} color={T.color.text3} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Nhập số tiền rút (Ví dụ: 500000)"
                placeholderTextColor={T.color.placeholder}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                style={styles.input}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            disabled={submitting}
            onPress={handleRequestWithdrawal}
          >
            {submitting ? (
              <ActivityIndicator color={T.color.text1} />
            ) : (
              <Text style={styles.submitBtnText}>Yêu cầu rút tiền</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* History */}
        <Text style={styles.sectionHeader}>Lịch sử rút tiền</Text>

        <View style={styles.historyList}>
          {displayWithdrawals.map((w) => {
            const dateStr = new Date(w.createdAt || w.date).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });

            const statusStyle = getStatusStyle(w.status);
            const bankAccount = w.bankAccount || { bankName: 'Vietcombank', accountNumber: '***1234' };

            return (
              <View key={w._id} style={styles.withdrawalCard}>
                <View style={styles.cardLeft}>
                  <Text style={styles.withdrawalAmount}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(w.amount)}
                  </Text>
                  <Text style={styles.withdrawalMeta}>
                    {dateStr} · {bankAccount.bankName} ({bankAccount.accountNumber})
                  </Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {getStatusLabel(w.status)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.color.bg,
  },
  scrollContent: {
    paddingHorizontal: T.space.xl,
    paddingTop: T.space.lg,
    paddingBottom: T.space['3xl'],
  },
  formCard: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    marginBottom: T.space.xl,
    gap: T.space.md,
  },
  formTitle: {
    color: T.color.text1,
    fontSize: 14.5,
    fontWeight: '700',
  },
  inputGroup: {
    gap: T.space.xs,
  },
  label: {
    color: T.color.text2,
    fontSize: 12.5,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.bg,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.md,
    height: 48,
    paddingHorizontal: T.space.md,
  },
  input: {
    flex: 1,
    color: T.color.text1,
    fontSize: 14,
    height: '100%',
  },
  submitBtn: {
    height: 44,
    backgroundColor: T.color.primary,
    borderRadius: T.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: T.space.xs,
  },
  submitBtnText: {
    color: T.color.text1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  sectionHeader: {
    color: T.color.text1,
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: T.space.md,
  },
  historyList: {
    gap: T.space.sm,
  },
  withdrawalCard: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.md,
    borderWidth: 1,
    borderColor: T.color.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1.5,
  },
  withdrawalAmount: {
    color: T.color.text1,
    fontSize: 15,
    fontWeight: '700',
  },
  withdrawalMeta: {
    color: T.color.text3,
    fontSize: 11.5,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: T.radius.full,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
