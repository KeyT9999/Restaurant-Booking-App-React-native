import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getCustomBaseURL, setCustomBaseURL } from '@/src/api/client';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { TextField } from '@/src/components/ui/TextField';
import { useToast } from '@/src/components/ui/Toast';
import { FontAwesome } from '@expo/vector-icons';

export default function IPSettingsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [ipUrl, setIpUrl] = useState('');

  useEffect(() => {
    const loadIP = async () => {
      const currentUrl = await getCustomBaseURL();
      setIpUrl(currentUrl);
    };
    loadIP();
  }, []);

  const handleSave = async () => {
    const trimmedUrl = ipUrl.trim();
    if (!trimmedUrl) {
      showToast('Vui lòng nhập đường dẫn URL máy chủ', 'info');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      showToast('URL máy chủ phải bắt đầu bằng http:// hoặc https://', 'error');
      return;
    }

    try {
      await setCustomBaseURL(trimmedUrl);
      showToast('Đã lưu cấu hình IP máy chủ mới! ⚙️', 'success');
      Alert.alert(
        'Đã cập nhật',
        'Đã cấu hình đường dẫn API máy chủ mới. Bạn nên khởi động lại ứng dụng để bảo đảm mọi kết nối đồng bộ chuẩn xác.',
        [{ text: 'Đồng ý', onPress: () => router.back() }]
      );
    } catch (e) {
      showToast('Lưu cấu hình thất bại', 'error');
    }
  };

  const handleReset = async () => {
    const defaultUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      await setCustomBaseURL(defaultUrl);
      setIpUrl(defaultUrl);
      showToast('Đã đặt lại cấu hình mặc định', 'success');
      Alert.alert(
        'Đã đặt lại',
        'Đường dẫn API đã được khôi phục về mặc định. Vui lòng khởi động lại app nếu cần.',
        [{ text: 'Đồng ý' }]
      );
    } catch (e) {
      showToast('Đặt lại cấu hình thất bại', 'error');
    }
  };

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleSM, styles.title]} numberOfLines={1}>Cấu hình máy chủ</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Info Box */}
        <View style={styles.infoBanner}>
          <FontAwesome name="info-circle" size={16} color={T.color.primary} />
          <Text style={styles.infoText}>
            Dùng để thay đổi địa chỉ IP của Backend nội bộ khi thử nghiệm trên thiết bị thật thông qua Expo Go mà không cần build lại mã nguồn.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Đường dẫn API Gateway</Text>
          <Text style={styles.cardSectionSub}>Nhập đầy đủ giao thức http://, địa chỉ IP và cổng của máy tính.</Text>
          
          <TextField
            label="Địa chỉ URL máy chủ API"
            value={ipUrl}
            onChangeText={setIpUrl}
            placeholder="Ví dụ: http://192.168.1.15:3001/api/v1"
            autoCapitalize="none"
            style={styles.field}
          />
        </View>

        <View style={styles.actionContainer}>
          <Button
            label="Lưu địa chỉ cấu hình"
            onPress={handleSave}
            style={styles.saveBtn}
          />
          <Pressable onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Đặt lại URL mặc định</Text>
          </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: T.space.lg,
    paddingBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
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
    padding: T.space.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212, 150, 83, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.15)',
    borderRadius: T.radius.lg,
    padding: T.space.md,
    marginBottom: T.space.lg,
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: T.color.text2,
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: T.space.lg,
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
    fontSize: 11,
    marginBottom: T.space.md,
  },
  field: {
    marginBottom: T.space.xs,
  },
  actionContainer: {
    gap: T.space.md,
    marginTop: T.space.md,
  },
  saveBtn: {
    width: '100%',
  },
  resetBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    color: T.color.text3,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
