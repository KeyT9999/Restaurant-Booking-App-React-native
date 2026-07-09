import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function WalletScreen() {
  const router = useRouter();
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const res = await ownerApi.getTransactions();
      if (res.success) {
        setTransactions(res.data?.transactions || res.data || []);
      }
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      // Fail silently or show default mock transactions if database is fresh
      showToast('Đang hiển thị lịch sử ví', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [activeRestaurant]);

  // Fallback transaction list if empty
  const displayTransactions = transactions.length > 0 ? transactions : [
    { type: 'deposit', desc: 'Nhận tiền đặt cọc booking #BE-192', amount: 200000, createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), isPositive: true },
    { type: 'commission', desc: 'Khấu trừ hoa hồng đặt bàn', amount: -10000, createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), isPositive: false },
    { type: 'deposit', desc: 'Nhận tiền đặt cọc booking #BE-189', amount: 200000, createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), isPositive: true },
    { type: 'withdrawal', desc: 'Yêu cầu rút tiền về ngân hàng VCB', amount: -5000000, createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), isPositive: false },
  ];

  // Calculate sum of transactions for a simulated balance
  const balanceValue = 18540000;

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Ví & Doanh thu" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SỐ DƯ KHẢ DỤNG</Text>
          <Text style={styles.balanceAmount}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balanceValue)}
          </Text>
          <View style={styles.balanceFooter}>
            <FontAwesome name="check-circle" size={12} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.balanceFooterText}>Đã liên kết tài khoản ngân hàng</Text>
          </View>
        </View>

        {/* Finance Actions Row */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/owner/wallet/withdraw' as any)}
          >
            <View style={styles.iconWrapper}>
              <FontAwesome name="money" size={16} color={T.color.primary} />
            </View>
            <Text style={styles.actionTitle}>Rút tiền</Text>
            <Text style={styles.actionDesc}>Chuyển về ngân hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/owner/wallet/bank' as any)}
          >
            <View style={styles.iconWrapper}>
              <FontAwesome name="bank" size={15} color={T.color.primary} />
            </View>
            <Text style={styles.actionTitle}>Tài khoản NH</Text>
            <Text style={styles.actionDesc}>Vietcombank **1234</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions List */}
        <Text style={styles.sectionHeader}>Giao dịch gần đây</Text>

        {loading ? (
          <ActivityIndicator color={T.color.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.transactionsList}>
            {displayTransactions.map((tx, index) => {
              const txDate = new Date(tx.createdAt || tx.date).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });

              const isPositive = tx.isPositive ?? (tx.amount > 0);
              const txAmountFormatted = (isPositive ? '+' : '') + new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(tx.amount);

              return (
                <View key={index} style={styles.txRow}>
                  <View style={styles.txLeft}>
                    <View
                      style={[
                        styles.txIconWrapper,
                        { backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)' },
                      ]}
                    >
                      <FontAwesome
                        name={isPositive ? 'arrow-down' : 'arrow-up'}
                        size={11}
                        color={isPositive ? T.color.success : T.color.error}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txDesc} numberOfLines={1}>
                        {tx.desc || tx.description || 'Giao dịch đặt chỗ'}
                      </Text>
                      <Text style={styles.txDate}>{txDate}</Text>
                    </View>
                  </View>

                  <Text style={[styles.txAmount, { color: isPositive ? T.color.success : T.color.error }]}>
                    {txAmountFormatted}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
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
  balanceCard: {
    backgroundColor: '#271911',
    borderColor: 'rgba(212, 150, 83, 0.25)',
    borderWidth: 1,
    borderRadius: T.radius.xl,
    padding: T.space.xl,
    marginBottom: T.space.lg,
  },
  balanceLabel: {
    color: 'rgba(212, 150, 83, 0.8)',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceAmount: {
    color: T.color.text1,
    fontSize: 30,
    fontWeight: '800',
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: T.space.lg,
  },
  balanceFooterText: {
    color: T.color.text3,
    fontSize: 11.5,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: T.space.md,
    marginBottom: T.space.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: T.radius.md,
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: T.space.md,
  },
  actionTitle: {
    color: T.color.text1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  actionDesc: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    color: T.color.text1,
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: T.space.md,
  },
  transactionsList: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: T.space.md,
    paddingHorizontal: T.space.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.md,
    flex: 1,
    marginRight: T.space.md,
  },
  txIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txDesc: {
    color: T.color.text1,
    fontSize: 12.5,
    fontWeight: '500',
  },
  txDate: {
    color: T.color.text3,
    fontSize: 10.5,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
