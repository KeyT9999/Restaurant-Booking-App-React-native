import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function BankLinkScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [bankName, setBankName] = useState('Vietcombank (VCB)');
  const [accountNumber, setAccountNumber] = useState('0071001234567');
  const [accountHolder, setAccountHolder] = useState('NGUYEN VAN A');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      showToast('Vui lòng nhập đầy đủ các trường thông tin', 'error');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Cập nhật tài khoản ngân hàng thành công!', 'success');
      router.back();
    }, 800);
  };

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Liên kết ngân hàng" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Thông tin tài khoản nhận tiền</Text>
          <Text style={styles.formSubtitle}>
            Tài khoản này sẽ được sử dụng để nhận tiền từ doanh thu đặt cọc của nhà hàng khi bạn gửi yêu cầu rút tiền.
          </Text>

          {/* Bank Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên ngân hàng *</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome name="bank" size={15} color={T.color.text3} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Ví dụ: Vietcombank, Techcombank..."
                placeholderTextColor={T.color.placeholder}
                value={bankName}
                onChangeText={setBankName}
                style={styles.input}
              />
            </View>
          </View>

          {/* Account Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tài khoản *</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome name="credit-card" size={15} color={T.color.text3} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Nhập số tài khoản ngân hàng"
                placeholderTextColor={T.color.placeholder}
                keyboardType="numeric"
                value={accountNumber}
                onChangeText={setAccountNumber}
                style={styles.input}
              />
            </View>
          </View>

          {/* Account Holder */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên chủ tài khoản (Viết hoa không dấu) *</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome name="user" size={15} color={T.color.text3} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Ví dụ: NGUYEN VAN A"
                placeholderTextColor={T.color.placeholder}
                value={accountHolder}
                onChangeText={(val) => setAccountHolder(val.toUpperCase())}
                style={styles.input}
              />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={styles.submitBtn}
            disabled={saving}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator color={T.color.text1} />
            ) : (
              <Text style={styles.submitBtnText}>Cập nhật tài khoản</Text>
            )}
          </TouchableOpacity>
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
    gap: T.space.md,
  },
  formTitle: {
    color: T.color.text1,
    fontSize: 14.5,
    fontWeight: '700',
  },
  formSubtitle: {
    color: T.color.text2,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: T.space.sm,
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
    height: 48,
    backgroundColor: T.color.primary,
    borderRadius: T.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: T.space.md,
  },
  submitBtnText: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
  },
});
