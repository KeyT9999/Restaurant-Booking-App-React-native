import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { walletApi } from '@/src/api/wallet.api';
import { BookEatWallet, WalletPagination, WalletTransaction } from '@/src/types/wallet.types';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { formatCurrency } from '@/src/utils/format';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';

const EMPTY_PAGE: WalletPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };
const TYPE_LABELS: Record<string, string> = {
  CREDIT_BOOKING_REFUND: 'Hoàn tiền hủy đặt bàn',
  DEBIT_BOOKING_PAYMENT: 'Thanh toán booking bằng ví',
  CREDIT_BOOKING_PAYMENT_REVERSAL: 'Hoàn lại giao dịch thanh toán',
  CREDIT_ADMIN_ADJUSTMENT: 'BookEat điều chỉnh cộng',
  DEBIT_ADMIN_ADJUSTMENT: 'BookEat điều chỉnh trừ',
};

export default function CustomerWalletScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [wallet, setWallet] = useState<BookEatWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pagination, setPagination] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (page = 1, refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [walletResponse, transactionResponse] = await Promise.all([
        walletApi.getMyWallet(),
        walletApi.getTransactions({ page, limit: 20 }),
      ]);
      setWallet(walletResponse.data.wallet);
      setTransactions(transactionResponse.data.transactions);
      setPagination(transactionResponse.data.pagination);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể tải Ví BookEat', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { load(1); }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backButton} />
        <Text style={[typography.titleSM, styles.title]}>Ví BookEat</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(pagination.page, true)} tintColor={T.color.primary} colors={[T.color.primary]} />}
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <View>
              <Text style={styles.balanceLabel}>SỐ DƯ KHẢ DỤNG</Text>
              <Text style={styles.balanceValue}>{formatCurrency(wallet?.balance || 0)}</Text>
            </View>
            <View style={styles.walletIcon}><FontAwesome name="credit-card" size={22} color={T.color.primary} /></View>
          </View>
          <Text style={styles.balanceHint}>Dùng số dư này để thanh toán tiền cọc cho booking tiếp theo.</Text>
          <View style={styles.statusRow}><View style={styles.statusDot} /><Text style={styles.statusText}>{wallet?.status === 'frozen' ? 'Ví đang tạm khóa' : 'Ví đang hoạt động'}</Text></View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
          <Text style={styles.totalText}>{pagination.total} giao dịch</Text>
        </View>

        {loading ? (
          <View style={styles.stateCard}><ActivityIndicator color={T.color.primary} /><Text style={styles.stateText}>Đang tải giao dịch...</Text></View>
        ) : transactions.length === 0 ? (
          <View style={styles.stateCard}>
            <FontAwesome name="inbox" size={30} color={T.color.text3} />
            <Text style={styles.stateTitle}>Chưa có giao dịch ví</Text>
            <Text style={styles.stateText}>Khoản hoàn booking đầu tiên sẽ xuất hiện tại đây.</Text>
          </View>
        ) : transactions.map((transaction) => <TransactionCard key={transaction.id} transaction={transaction} onBookingPress={(bookingId) => router.push(`/booking/${bookingId}`)} />)}

        {pagination.totalPages > 1 && (
          <View style={styles.pagination}>
            <Button label="Trang trước" size="sm" variant={pagination.page <= 1 || loading ? 'disabled' : 'outline'} onPress={() => load(pagination.page - 1)} fullWidth={false} />
            <Text style={styles.pageText}>{pagination.page}/{pagination.totalPages}</Text>
            <Button label="Trang sau" size="sm" variant={pagination.page >= pagination.totalPages || loading ? 'disabled' : 'outline'} onPress={() => load(pagination.page + 1)} fullWidth={false} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TransactionCard({ transaction, onBookingPress }: { transaction: WalletTransaction; onBookingPress: (id: string) => void }) {
  const credit = transaction.amount > 0;
  return (
    <View style={styles.transactionCard}>
      <View style={[styles.transactionIcon, credit ? styles.creditIcon : styles.debitIcon]}>
        <FontAwesome name={credit ? 'arrow-down' : 'arrow-up'} size={15} color={credit ? T.color.success : T.color.error} />
      </View>
      <View style={styles.transactionCopy}>
        <Text style={styles.transactionTitle}>{TYPE_LABELS[transaction.type] || transaction.description}</Text>
        {!!transaction.description && <Text style={styles.description}>{transaction.description}</Text>}
        <Text style={styles.date}>{new Date(transaction.createdAt).toLocaleString('vi-VN')}</Text>
        {!!transaction.bookingId && <Pressable onPress={() => onBookingPress(transaction.bookingId!)} hitSlop={8}><Text style={styles.bookingLink}>Booking #{String(transaction.bookingId).slice(-8).toUpperCase()}</Text></Pressable>}
      </View>
      <View style={styles.amountCopy}>
        <Text style={[styles.amount, { color: credit ? T.color.success : T.color.error }]}>{credit ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}</Text>
        <Text style={styles.afterBalance}>Sau GD: {formatCurrency(transaction.balanceAfter)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.color.bg }, header: { paddingTop: 60, paddingHorizontal: T.space.lg, paddingBottom: T.space.md, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: T.color.border }, backButton: { marginRight: T.space.md }, title: { color: T.color.text1, fontWeight: '700' }, content: { padding: T.space.lg, paddingBottom: T.space['3xl'], gap: T.space.md },
  balanceCard: { padding: T.space.xl, borderRadius: T.radius.xl, borderWidth: 1, borderColor: 'rgba(212,150,83,0.28)', backgroundColor: T.color.elevated }, balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, balanceLabel: { color: T.color.text2, fontSize: 11, fontWeight: '700', letterSpacing: 1 }, balanceValue: { marginTop: T.space.sm, color: T.color.text1, fontSize: 34, fontWeight: '800', letterSpacing: -1 }, walletIcon: { width: 48, height: 48, borderRadius: T.radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(212,150,83,0.12)', borderWidth: 1, borderColor: 'rgba(212,150,83,0.25)' }, balanceHint: { marginTop: T.space.lg, color: T.color.text2, fontSize: 12, lineHeight: 18 }, statusRow: { marginTop: T.space.md, flexDirection: 'row', alignItems: 'center', gap: 7 }, statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.color.success }, statusText: { color: T.color.success, fontSize: 11, fontWeight: '600' },
  sectionHead: { marginTop: T.space.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { color: T.color.text1, fontSize: 17, fontWeight: '700' }, totalText: { color: T.color.text3, fontSize: 11 },
  stateCard: { minHeight: 150, borderRadius: T.radius.lg, borderWidth: 1, borderColor: T.color.border, backgroundColor: T.color.card, alignItems: 'center', justifyContent: 'center', padding: T.space.xl, gap: T.space.sm }, stateTitle: { color: T.color.text1, fontSize: 14, fontWeight: '700' }, stateText: { color: T.color.text2, fontSize: 12, textAlign: 'center' },
  transactionCard: { flexDirection: 'row', alignItems: 'flex-start', padding: T.space.md, gap: T.space.md, borderRadius: T.radius.lg, borderWidth: 1, borderColor: T.color.border, backgroundColor: T.color.card }, transactionIcon: { width: 38, height: 38, borderRadius: T.radius.md, alignItems: 'center', justifyContent: 'center' }, creditIcon: { backgroundColor: 'rgba(16,185,129,0.1)' }, debitIcon: { backgroundColor: 'rgba(244,63,94,0.1)' }, transactionCopy: { flex: 1 }, transactionTitle: { color: T.color.text1, fontSize: 13, fontWeight: '700' }, description: { marginTop: 3, color: T.color.text2, fontSize: 11, lineHeight: 16 }, date: { marginTop: 6, color: T.color.text3, fontSize: 10 }, bookingLink: { marginTop: 4, color: T.color.primary, fontSize: 11, fontWeight: '700' }, amountCopy: { alignItems: 'flex-end' }, amount: { fontSize: 14, fontWeight: '800' }, afterBalance: { marginTop: 6, color: T.color.text3, fontSize: 9 },
  pagination: { marginTop: T.space.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: T.space.md }, pageText: { color: T.color.text2, fontSize: 12 },
});
