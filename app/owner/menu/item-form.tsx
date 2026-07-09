import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function ItemForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const isEdit = !!id;
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [image, setImage] = useState('');

  const loadData = async () => {
    if (!activeRestaurant?.id) return;
    setLoading(true);
    try {
      // 1. Load Categories
      const catRes = await ownerApi.getCategories(activeRestaurant.id);
      if (catRes.success) {
        const catList = catRes.data?.categories || catRes.data || [];
        setCategories(catList);
        if (catList.length > 0) {
          setSelectedCategoryId(catList[0].id || catList[0]._id);
        }

        // 2. If editing, find item in list of menu items
        if (isEdit && id) {
          const itemsRes = await ownerApi.getMenuItems(activeRestaurant.id);
          if (itemsRes.success) {
            const list = itemsRes.data.menuItems || itemsRes.data.items || [];
            const item = list.find((x: any) => x.id === id || x._id === id);
            if (item) {
              setName(item.name || '');
              setPrice(String(item.price || ''));
              setDescription(item.description || '');
              setIsAvailable(item.isAvailable ?? item.active ?? true);
              setImage(item.image || '');
              if (item.categoryId || item.categoryName) {
                // Find matching category ID
                const matchingCat = catList.find(
                  (c: any) =>
                    (c.id || c._id) === item.categoryId ||
                    c.name === item.categoryName ||
                    c.name === item.category
                );
                if (matchingCat) {
                  setSelectedCategoryId(matchingCat.id || matchingCat._id);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error loading item form data:', e);
      showToast('Không thể tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, activeRestaurant]);

  const handleSubmit = async () => {
    if (!activeRestaurant?.id) return;
    if (name.trim().length === 0) {
      showToast('Tên món ăn là bắt buộc', 'error');
      return;
    }
    if (price.trim().length === 0 || isNaN(Number(price))) {
      showToast('Giá bán phải là một số hợp lệ', 'error');
      return;
    }
    if (categories.length === 0) {
      showToast('Vui lòng tạo danh mục trước', 'error');
      return;
    }

    setSubmitting(true);
    const cat = categories.find((c) => (c.id || c._id) === selectedCategoryId);
    const payload = {
      name: name.trim(),
      price: Number(price),
      description: description.trim() || undefined,
      categoryId: selectedCategoryId,
      categoryName: cat?.name,
      isAvailable,
      image: image.trim() || undefined,
    };

    try {
      if (isEdit && id) {
        const res = await ownerApi.updateMenuItem(id, payload);
        if (res.success) {
          showToast('Cập nhật món ăn thành công!', 'success');
          router.back();
        } else {
          showToast(res.message || 'Thao tác thất bại', 'error');
        }
      } else {
        const res = await ownerApi.createMenuItem(activeRestaurant.id, payload);
        if (res.success) {
          showToast('Tạo món ăn mới thành công!', 'success');
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={16} color={T.color.text1} />
        </TouchableOpacity>
        <Text style={[typography.displaySM, styles.headerTitle]}>
          {isEdit ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên món ăn *</Text>
          <TextInput
            placeholder="Ví dụ: Bò Wagyu sốt tiêu đen"
            placeholderTextColor={T.color.placeholder}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giá bán (VND) *</Text>
          <TextInput
            placeholder="Ví dụ: 250000"
            placeholderTextColor={T.color.placeholder}
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
            style={styles.input}
          />
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Danh mục món ăn *</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((c) => {
              const catId = c.id || c._id;
              const isSelected = selectedCategoryId === catId;
              return (
                <TouchableOpacity
                  key={catId}
                  style={[styles.categoryOption, isSelected && styles.categoryOptionActive]}
                  onPress={() => setSelectedCategoryId(catId)}
                >
                  <Text style={[styles.categoryOptionText, isSelected && styles.categoryOptionTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Image URL */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Link ảnh món ăn (URL)</Text>
          <TextInput
            placeholder="http://example.com/image.png"
            placeholderTextColor={T.color.placeholder}
            value={image}
            onChangeText={setImage}
            style={styles.input}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả chi tiết</Text>
          <TextInput
            placeholder="Mô tả thành phần, nguyên liệu món ăn..."
            placeholderTextColor={T.color.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
          />
        </View>

        {/* Availability Switch */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Hiện trên thực đơn</Text>
            <Text style={styles.switchSub}>Khách hàng sẽ nhìn thấy món ăn này để đặt.</Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ false: '#3A4255', true: 'rgba(16, 185, 129, 0.4)' }}
            thumbColor={isAvailable ? T.color.success : T.color.text3}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting || name.trim().length === 0}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={T.color.text1} />
          ) : (
            <Text style={styles.submitBtnText}>
              {isEdit ? 'Lưu thay đổi' : 'Thêm vào thực đơn'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.color.bg,
  },
  scrollContent: {
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.space.sm,
    marginTop: T.space.xs,
  },
  categoryOption: {
    paddingHorizontal: T.space.base,
    paddingVertical: 8,
    borderRadius: T.radius.full,
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  categoryOptionActive: {
    backgroundColor: T.color.primary,
    borderColor: T.color.primary,
  },
  categoryOptionText: {
    color: T.color.text2,
    fontSize: 12.5,
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: T.color.text1,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: T.color.card,
    padding: T.space.lg,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    marginTop: T.space.xs,
  },
  switchLabel: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  switchSub: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
    maxWidth: '85%',
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
