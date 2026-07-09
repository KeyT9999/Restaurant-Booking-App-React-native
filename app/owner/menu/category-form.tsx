import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function CategoryForm() {
  const { id, name, description } = useLocalSearchParams<{ id?: string; name?: string; description?: string }>();
  const router = useRouter();
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const isEdit = !!id;
  const [catName, setCatName] = useState(name || '');
  const [catDesc, setCatDesc] = useState(description || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!activeRestaurant?.id) return;
    if (catName.trim().length === 0) {
      showToast('Tên danh mục là bắt buộc', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && id) {
        const res = await ownerApi.updateCategory(id, {
          name: catName.trim(),
          description: catDesc.trim() || undefined,
        });
        if (res.success) {
          showToast('Cập nhật danh mục thành công!', 'success');
          router.back();
        } else {
          showToast(res.message || 'Thao tác thất bại', 'error');
        }
      } else {
        const res = await ownerApi.createCategory(activeRestaurant.id, {
          name: catName.trim(),
          description: catDesc.trim() || undefined,
        });
        if (res.success) {
          showToast('Tạo danh mục mới thành công!', 'success');
          router.back();
        } else {
          showToast(res.message || 'Thao tác thất bại', 'error');
        }
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={16} color={T.color.text1} />
        </TouchableOpacity>
        <Text style={[typography.displaySM, styles.headerTitle]}>
          {isEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Category Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên danh mục *</Text>
          <TextInput
            placeholder="Ví dụ: Khai vị, Món chính, Đồ uống..."
            placeholderTextColor={T.color.placeholder}
            value={catName}
            onChangeText={setCatName}
            style={styles.input}
          />
        </View>

        {/* Category Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            placeholder="Mô tả danh mục phân loại món ăn..."
            placeholderTextColor={T.color.placeholder}
            value={catDesc}
            onChangeText={setCatDesc}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting || catName.trim().length === 0}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={T.color.text1} />
          ) : (
            <Text style={styles.submitBtnText}>
              {isEdit ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: T.space.xl,
    paddingVertical: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: T.color.text1,
    fontWeight: '700',
    marginLeft: T.space.md,
  },
  content: {
    padding: T.space.xl,
    gap: T.space.lg,
  },
  inputGroup: {
    gap: T.space.xs,
  },
  label: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: T.color.card,
    color: T.color.text1,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    paddingHorizontal: T.space.md,
    height: 44,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingVertical: T.space.md,
  },
  submitBtn: {
    height: 48,
    borderRadius: T.radius.md,
    backgroundColor: T.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: T.space.md,
  },
  submitBtnText: {
    color: T.color.text1,
    fontSize: 15,
    fontWeight: '600',
  },
});
