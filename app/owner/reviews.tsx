import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, RefreshControl, Platform, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function ReviewsScreen() {
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reply Form states
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchReviews = async (showLoading = true) => {
    if (!activeRestaurant?.id) return;
    if (showLoading) setLoading(true);

    try {
      const res = await ownerApi.getReviews(activeRestaurant.id);
      if (res.success) {
        setReviews(res.data?.reviews || res.data || []);
      }
    } catch (error) {
      console.error('Error fetching owner reviews:', error);
      showToast('Không thể tải đánh giá nhà hàng', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setReviews([]);
    fetchReviews();
  }, [activeRestaurant]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews(false);
  };

  const openReplyModal = (review: any) => {
    setSelectedReview(review);
    setReplyText(review.ownerReply?.content || '');
    setReplyModalVisible(true);
  };

  const handleSaveReply = async () => {
    if (!selectedReview?._id && !selectedReview?.id) return;
    if (!replyText.trim()) {
      showToast('Vui lòng nhập nội dung phản hồi', 'error');
      return;
    }

    const reviewId = selectedReview._id || selectedReview.id;
    setSubmittingReply(true);

    try {
      const res = await ownerApi.replyReview(reviewId, replyText.trim());
      if (res.success) {
        showToast('Đã gửi phản hồi thành công!', 'success');
        setReplyModalVisible(false);
        setReplyText('');
        fetchReviews(false);
      } else {
        showToast(res.message || 'Thao tác thất bại', 'error');
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Stats calculation
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '0.0';

  // Stars count mapping
  const starCounts = [0, 0, 0, 0, 0]; // index 0 for 1 star, index 4 for 5 stars
  reviews.forEach((r) => {
    const starIdx = Math.min(Math.max(1, Math.round(r.rating)), 5) - 1;
    starCounts[starIdx]++;
  });

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Phản hồi & Đánh giá" showBack={true} />

      {loading && reviews.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={T.color.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.color.primary} />}
        >
          {/* Summary Breakdown Header */}
          <View style={styles.summaryCard}>
            <View style={styles.avgSection}>
              <Text style={styles.avgNumber}>{avgRating}</Text>
              <View style={styles.starsRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <FontAwesome
                    key={i}
                    name={i < Math.round(Number(avgRating)) ? 'star' : 'star-o'}
                    size={12}
                    color="#F59E0B"
                  />
                ))}
              </View>
              <Text style={styles.reviewCountText}>{totalReviews} đánh giá</Text>
            </View>

            <View style={styles.dividerVertical} />

            <View style={styles.progressSection}>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = starCounts[stars - 1];
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <View key={stars} style={styles.progressBarRow}>
                    <Text style={styles.starNumText}>{stars}★</Text>
                    <View style={styles.progressBarBackground}>
                      <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.progressBarValText}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* List of reviews */}
          <View style={styles.reviewsList}>
            {reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome name="comments-o" size={40} color={T.color.text3} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyText}>Chưa có đánh giá nào từ khách hàng</Text>
              </View>
            ) : (
              reviews.map((item) => {
                const customerName = item.customerName || item.customer?.fullName || 'Khách ẩn danh';
                const createdDate = new Date(item.createdAt).toLocaleDateString('vi-VN');
                const hasReply = !!item.ownerReply?.content;

                return (
                  <View key={item._id || item.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.customerRow}>
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarInitial}>{customerName[0]?.toUpperCase()}</Text>
                        </View>
                        <View>
                          <Text style={styles.customerName}>{customerName}</Text>
                          <View style={styles.starsRow}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <FontAwesome
                                key={i}
                                name={i < item.rating ? 'star' : 'star-o'}
                                size={10}
                                color="#F59E0B"
                              />
                            ))}
                            <Text style={styles.dateText}>{createdDate}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.reviewComment}>{item.comment || 'Khách hàng không để lại bình luận.'}</Text>

                    {/* Owner reply content */}
                    {hasReply && (
                      <View style={styles.replyBox}>
                        <View style={styles.replyBoxHeader}>
                          <FontAwesome name="reply" size={10} color={T.color.primary} style={{ marginRight: 6 }} />
                          <Text style={styles.replyTitle}>Phản hồi từ bạn</Text>
                        </View>
                        <Text style={styles.replyContent}>{item.ownerReply.content}</Text>
                      </View>
                    )}

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.replyBtn}
                        onPress={() => openReplyModal(item)}
                      >
                        <FontAwesome name={hasReply ? 'edit' : 'reply'} size={11} color={T.color.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.replyBtnText}>{hasReply ? 'Sửa phản hồi' : 'Phản hồi khách'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={replyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReplyModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {selectedReview?.ownerReply?.content ? 'Sửa phản hồi' : 'Phản hồi đánh giá'}
                    </Text>
                    <TouchableOpacity onPress={() => setReplyModalVisible(false)}>
                      <FontAwesome name="times" size={18} color={T.color.text2} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <Text style={styles.modalLabel}>Đánh giá của khách:</Text>
                    <Text style={styles.modalGuestComment} numberOfLines={3}>
                      "{selectedReview?.comment || 'Không có bình luận'}"
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: T.space.md, marginBottom: T.space.xs }}>
                      <Text style={styles.modalLabel}>Nội dung phản hồi:</Text>
                      <TouchableOpacity onPress={Keyboard.dismiss} style={{ paddingVertical: 2, paddingHorizontal: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                        <Text style={{ color: T.color.primary, fontSize: 11, fontWeight: '600' }}>Ẩn bàn phím</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      placeholder="Nhập lời cảm ơn hoặc phản hồi của bạn..."
                      placeholderTextColor={T.color.placeholder}
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                      numberOfLines={5}
                      style={styles.replyInput}
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelBtnModal}
                      onPress={() => setReplyModalVisible(false)}
                    >
                      <Text style={styles.cancelBtnTextModal}>Huỷ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.submitBtn}
                      disabled={submittingReply}
                      onPress={handleSaveReply}
                    >
                      {submittingReply ? (
                        <ActivityIndicator color="#0C0F16" />
                      ) : (
                        <Text style={styles.submitBtnText}>Gửi phản hồi</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingTop: T.space.md,
    paddingBottom: T.space['3xl'],
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    padding: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    marginBottom: T.space.xl,
  },
  avgSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avgNumber: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reviewCountText: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 6,
  },
  dividerVertical: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: T.space.lg,
  },
  progressSection: {
    flex: 1.5,
    justifyContent: 'center',
    gap: 3,
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starNumText: {
    color: T.color.text3,
    fontSize: 10.5,
    width: 18,
    textAlign: 'right',
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  progressBarValText: {
    color: T.color.text3,
    fontSize: 10.5,
    width: 18,
  },
  reviewsList: {
    gap: T.space.md,
  },
  emptyContainer: {
    paddingVertical: T.space['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: T.color.text3,
    fontSize: 12.5,
    textAlign: 'center',
  },
  card: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    padding: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.space.md,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.md,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.color.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: T.color.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  dateText: {
    color: T.color.text3,
    fontSize: 10,
    marginLeft: 6,
  },
  reviewComment: {
    color: T.color.text2,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: T.space.md,
  },
  replyBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderLeftWidth: 2,
    borderLeftColor: T.color.primary,
    padding: T.space.md,
    borderRadius: T.radius.sm,
    marginBottom: T.space.md,
  },
  replyBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyTitle: {
    color: T.color.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  replyContent: {
    color: T.color.text2,
    fontSize: 12.5,
    lineHeight: 17,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: T.space.sm,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  replyBtnText: {
    color: T.color.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: T.color.card,
    borderTopLeftRadius: T.radius.xl,
    borderTopRightRadius: T.radius.xl,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
    marginBottom: T.space.lg,
  },
  modalTitle: {
    color: T.color.text1,
    fontSize: 15.5,
    fontWeight: '700',
  },
  modalBody: {
    gap: T.space.xs,
  },
  modalLabel: {
    color: T.color.text3,
    fontSize: 11.5,
    fontWeight: '600',
  },
  modalGuestComment: {
    color: T.color.text2,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: T.space.md,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    marginTop: 4,
  },
  replyInput: {
    backgroundColor: T.color.bg,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.md,
    height: 100,
    paddingHorizontal: T.space.md,
    paddingTop: T.space.md,
    color: '#FFFFFF',
    fontSize: 13,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: T.space.md,
    marginTop: T.space.xl,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  cancelBtnModal: {
    flex: 1,
    height: 42,
    borderRadius: T.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.color.border,
  },
  cancelBtnTextModal: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1.5,
    height: 42,
    borderRadius: T.radius.sm,
    backgroundColor: T.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#0C0F16',
    fontSize: 13,
    fontWeight: '700',
  },
});
