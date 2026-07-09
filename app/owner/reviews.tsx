import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function OwnerReviewsScreen() {
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchReviews = async (showLoading = true) => {
    if (!activeRestaurant?.id) return;
    if (showLoading) setLoading(true);

    try {
      const res = await ownerApi.getReviews(activeRestaurant.id);
      if (res.success) {
        setReviews(res.data.reviews || res.data || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showToast('Không thể lấy danh sách đánh giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setReviews([]);
    fetchReviews();
  }, [activeRestaurant]);

  const openReplyModal = (reviewId: string) => {
    const review = reviews.find((r) => r.id === reviewId || r._id === reviewId);
    setSelectedReviewId(reviewId);
    setReplyText(review?.ownerReply?.comment || '');
    setModalVisible(true);
  };

  const handleSendReply = async () => {
    if (!selectedReviewId) return;
    if (replyText.trim().length === 0) {
      showToast('Vui lòng nhập nội dung phản hồi', 'error');
      return;
    }

    try {
      const res = await ownerApi.replyReview(selectedReviewId, replyText.trim());
      if (res.success) {
        showToast('Đã gửi phản hồi đánh giá!', 'success');
        setModalVisible(false);
        setReplyText('');
        fetchReviews(false);
      } else {
        showToast(res.message || 'Gửi phản hồi thất bại', 'error');
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  // Safe stats
  const averageRating = activeRestaurant?.stats?.averageRating || 0;
  const totalReviews = activeRestaurant?.stats?.totalReviews || 0;

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Đánh giá" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Rating Header Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.scoreCol}>
            <Text style={styles.ratingScore}>{averageRating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <FontAwesome
                  key={i}
                  name={i < Math.round(averageRating) ? 'star' : 'star-o'}
                  size={14}
                  color={T.color.primary}
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
            <Text style={styles.reviewCountText}>{totalReviews} đánh giá</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoCol}>
            <Text style={styles.infoTitle}>Nhận xét khách hàng</Text>
            <Text style={styles.infoSubtitle}>Xem và trực tiếp giải đáp thắc mắc, đóng góp ý kiến của thực khách.</Text>
          </View>
        </View>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="star-o" size={40} color={T.color.text3} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Chưa có lượt đánh giá nào dành cho nhà hàng</Text>
          </View>
        ) : (
          reviews.map((item) => {
            const reviewId = item.id || item._id;
            const reviewerName = item.customer?.fullName || item.customerId?.fullName || item.customerName || 'Khách hàng ẩn danh';
            const rating = item.rating || 5;
            const comment = item.comment || '(Không có nội dung nhận xét)';
            const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN');
            const hasReply = !!item.ownerReply?.comment;

            return (
              <View key={reviewId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.reviewerName}>{reviewerName}</Text>
                    <Text style={styles.reviewDate}>{dateStr}</Text>
                  </View>
                  <View style={styles.starsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FontAwesome
                        key={i}
                        name={i < rating ? 'star' : 'star-o'}
                        size={12}
                        color={T.color.primary}
                        style={{ marginLeft: 2 }}
                      />
                    ))}
                  </View>
                </View>

                {/* Comment */}
                <Text style={styles.commentText}>{comment}</Text>

                {/* Owner Reply if exists */}
                {hasReply && (
                  <View style={styles.replyBox}>
                    <View style={styles.replyBoxHeader}>
                      <FontAwesome name="reply" size={11} color={T.color.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.replyTitle}>Phản hồi từ nhà hàng:</Text>
                    </View>
                    <Text style={styles.replyContentText}>{item.ownerReply.comment}</Text>
                  </View>
                )}

                {/* Action button */}
                <TouchableOpacity
                  style={[styles.replyBtn, hasReply && styles.replyBtnEdit]}
                  onPress={() => openReplyModal(reviewId)}
                >
                  <FontAwesome
                    name={hasReply ? 'pencil' : 'comment-o'}
                    size={12}
                    color={hasReply ? T.color.text2 : T.color.text1}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.replyBtnText, hasReply && styles.replyBtnEditText]}>
                    {hasReply ? 'Sửa phản hồi' : 'Trả lời đánh giá'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Reply Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Phản hồi đánh giá</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={18} color={T.color.text2} />
              </TouchableOpacity>
            </View>

            <TextInput
              multiline
              numberOfLines={4}
              placeholder="Nhập nội dung phản hồi của nhà hàng..."
              placeholderTextColor={T.color.placeholder}
              value={replyText}
              onChangeText={setReplyText}
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSendReply}>
                <Text style={styles.modalSubmitText}>Gửi phản hồi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingTop: T.space.lg,
    paddingBottom: T.space['3xl'],
  },
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    marginBottom: T.space.lg,
    alignItems: 'center',
  },
  scoreCol: {
    alignItems: 'center',
    flex: 1,
  },
  ratingScore: {
    color: T.color.text1,
    fontSize: 32,
    fontWeight: '700',
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  reviewCountText: {
    color: T.color.text3,
    fontSize: 11,
  },
  divider: {
    width: 1,
    backgroundColor: T.color.border,
    height: '80%',
    marginHorizontal: T.space.lg,
  },
  infoCol: {
    flex: 2,
  },
  infoTitle: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSubtitle: {
    color: T.color.text2,
    fontSize: 11,
    lineHeight: 16,
  },
  card: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    marginBottom: T.space.md,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.space.md,
  },
  reviewerName: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  reviewDate: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  commentText: {
    color: T.color.text2,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: T.space.md,
  },
  replyBox: {
    backgroundColor: 'rgba(212, 150, 83, 0.04)',
    borderRadius: T.radius.md,
    padding: T.space.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.08)',
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
  replyContentText: {
    color: T.color.text1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    backgroundColor: T.color.primary,
    borderRadius: T.radius.sm,
  },
  replyBtnEdit: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: T.color.border,
  },
  replyBtnText: {
    color: T.color.text1,
    fontSize: 12,
    fontWeight: '600',
  },
  replyBtnEditText: {
    color: T.color.text2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: T.space.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
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
    marginBottom: T.space.md,
  },
  modalTitle: {
    color: T.color.text1,
    fontSize: 16,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: T.color.bg,
    color: T.color.text1,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.md,
    fontSize: 13.5,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: T.space.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: T.space.md,
  },
  modalCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: T.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.color.border,
  },
  modalCancelText: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 1,
    height: 40,
    borderRadius: T.radius.sm,
    backgroundColor: T.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    color: T.color.text1,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: T.space['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: T.color.text3,
    fontSize: 13,
    textAlign: 'center',
  },
});
