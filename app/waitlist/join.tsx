import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { waitlistApi } from '@/src/api/waitlist.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { TextField } from '@/src/components/ui/TextField';
import { Chip } from '@/src/components/ui/Chip';
import { useToast } from '@/src/components/ui/Toast';
import { FontAwesome } from '@expo/vector-icons';

export default function JoinWaitlistScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { restaurantId, restaurantName } = useLocalSearchParams<{
    restaurantId: string;
    restaurantName: string;
  }>();

  // Date and time defaults
  const todayStr = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  const currentMin = new Date().getMinutes();
  const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;

  // Form States
  const [preferredDate, setPreferredDate] = useState(todayStr);
  const [preferredTime, setPreferredTime] = useState(timeStr);
  const [numberOfGuests, setNumberOfGuests] = useState(2);
  const [maxWaitMinutes, setMaxWaitMinutes] = useState(30);
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phoneNumber || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const waitTimeOptions = [15, 30, 45, 60, 120];

  const handleSubmit = async () => {
    if (!restaurantId) return;
    if (!customerName || !customerPhone || !customerEmail) {
      showToast('Vui lòng điền đầy đủ thông tin liên hệ', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const res = await waitlistApi.joinWaitlist({
        restaurantId,
        preferredDate,
        preferredTime,
        numberOfGuests,
        customerName,
        customerPhone,
        customerEmail,
        note: note.trim() || undefined,
        maxWaitMinutes,
      });

      if (res.success && res.data?.waitlist) {
        showToast('Tham gia hàng chờ thành công! 🎟️', 'success');
        const waitlistId = res.data.waitlist.id || res.data.waitlist._id;
        router.replace(`/waitlist/${waitlistId}`);
      } else {
        showToast(res.message || 'Thao tác thất bại', 'error');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tham gia hàng chờ';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleMD, styles.title]} numberOfLines={1}>Rút thẻ hàng chờ</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconWrapper}>
            <FontAwesome name="info-circle" size={14} color={T.color.primary} />
          </View>
          <Text style={styles.infoText}>
            Bạn đang xếp hàng chờ tại <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{restaurantName}</Text>. Nhà hàng sẽ sắp xếp bàn và gửi thông báo khi có chỗ trống phù hợp.
          </Text>
        </View>

        {/* Guest & Time setup */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Cấu hình chỗ ngồi</Text>

          {/* Stepper */}
          <View style={styles.stepperRow}>
            <View>
              <Text style={styles.stepperLabel}>Số lượng khách</Text>
              <Text style={styles.stepperSub}>Số người đi ăn cùng bạn</Text>
            </View>
            <View style={styles.stepperActions}>
              <Pressable
                onPress={() => setNumberOfGuests(Math.max(1, numberOfGuests - 1))}
                style={styles.stepperBtn}
              >
                <FontAwesome name="minus" size={10} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.stepperVal}>{numberOfGuests}</Text>
              <Pressable
                onPress={() => setNumberOfGuests(numberOfGuests + 1)}
                style={styles.stepperBtn}
              >
                <FontAwesome name="plus" size={10} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Preferred Time Inputs */}
          <View style={{ marginTop: T.space.lg }}>
            <TextField
              label="Giờ mong muốn nhận bàn (HH:mm) *"
              value={preferredTime}
              onChangeText={setPreferredTime}
              placeholder="Ví dụ: 19:00"
            />
          </View>
        </View>

        {/* Max wait time selector */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Thời gian chờ tối đa</Text>
          <Text style={styles.cardSectionSub}>Quá thời gian này, vé chờ sẽ tự động hủy</Text>
          <View style={styles.chipsRow}>
            {waitTimeOptions.map((mins) => (
              <Chip
                key={mins}
                label={`${mins} phút`}
                active={maxWaitMinutes === mins}
                onPress={() => setMaxWaitMinutes(mins)}
                style={styles.chip}
              />
            ))}
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Thông tin liên hệ</Text>
          <TextField
            label="Họ và tên người nhận bàn *"
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Nhập tên"
            style={styles.field}
          />
          <TextField
            label="Số điện thoại liên hệ *"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            style={styles.field}
          />
          <TextField
            label="Địa chỉ email *"
            value={customerEmail}
            onChangeText={setCustomerEmail}
            placeholder="Nhập email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.field}
          />
          <TextField
            label="Ghi chú thêm cho nhà hàng (không bắt buộc)"
            value={note}
            onChangeText={setNote}
            placeholder="Ví dụ: cần ghế trẻ em, dị ứng hải sản..."
            multiline
            numberOfLines={3}
            style={styles.field}
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Confirm Bar */}
      <View style={styles.bottomBar}>
        <Button
          label="Xác nhận xếp hàng"
          variant={submitting ? 'loading' : 'primary'}
          onPress={handleSubmit}
          style={styles.submitBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: T.space.lg,
    paddingBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
  },
  backBtn: {
    marginRight: T.space.md,
  },
  headerTextWrapper: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 130,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212, 150, 83, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.15)',
    borderRadius: T.radius.lg,
    padding: T.space.md,
    margin: T.space.lg,
    alignItems: 'flex-start',
    gap: 10,
  },
  infoIconWrapper: {
    paddingTop: 2,
  },
  infoText: {
    flex: 1,
    color: T.color.text2,
    fontSize: 12.5,
    lineHeight: 18,
  },
  card: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.lg,
    marginHorizontal: T.space.lg,
    marginBottom: T.space.lg,
  },
  cardSectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSectionSub: {
    color: T.color.text3,
    fontSize: 11.5,
    marginBottom: T.space.md,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  stepperSub: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  stepperActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.bg,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.md,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperVal: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    paddingHorizontal: 12,
  },
  field: {
    marginBottom: T.space.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0C0F16',
    borderTopWidth: 1,
    borderTopColor: T.color.border,
    paddingHorizontal: T.space.lg,
    paddingTop: T.space.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : T.space.lg,
  },
  submitBtn: {
    width: '100%',
  },
});
