import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';

export default function EditRestaurantScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const { refreshRestaurants } = useOwnerRestaurant();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  
  // Address states
  const [street, setStreet] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');

  // Optional details
  const [averagePrice, setAveragePrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [cuisineInput, setCuisineInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [logo, setLogo] = useState('');

  const fetchRestaurantDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await ownerApi.getMyRestaurantById(id);
      if (res.success && res.data) {
        const item = res.data;
        setName(item.name || '');
        setDescription(item.description || '');
        setPhoneNumber(item.phoneNumber || '');
        setEmail(item.email || '');
        
        if (item.address) {
          setStreet(item.address.street || '');
          setWard(item.address.ward || '');
          setDistrict(item.address.district || '');
          setCity(item.address.city || '');
        }

        setAveragePrice(item.averagePrice ? String(item.averagePrice) : '');
        setCapacity(item.capacity ? String(item.capacity) : '');
        setCuisineInput(item.cuisineTypes ? item.cuisineTypes.join(', ') : '');
        setCoverImage(item.coverImage || '');
        setLogo(item.logo || '');
      } else {
        showToast('Không thể lấy thông tin nhà hàng', 'error');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching restaurant for edit:', error);
      showToast('Có lỗi xảy ra khi tải dữ liệu', 'error');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useEffect(() => {
    fetchRestaurantDetail();
  }, [fetchRestaurantDetail]);

  const handleSubmit = async () => {
    if (!id) return;
    // Basic validation
    if (!name.trim()) return showToast('Vui lòng nhập tên nhà hàng', 'error');
    if (!description.trim() || description.trim().length < 10) return showToast('Mô tả phải từ 10 ký tự trở lên', 'error');
    if (!phoneNumber.trim()) return showToast('Vui lòng nhập số điện thoại', 'error');
    if (!email.trim()) return showToast('Vui lòng nhập email', 'error');
    if (!street.trim() || !ward.trim() || !district.trim() || !city.trim()) {
      return showToast('Vui lòng nhập đầy đủ thông tin địa chỉ', 'error');
    }

    setSubmitting(true);
    const cuisineTypes = cuisineInput.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim().toLowerCase(),
      address: {
        street: street.trim(),
        ward: ward.trim(),
        district: district.trim(),
        city: city.trim(),
      },
      averagePrice: Number(averagePrice) || 0,
      priceRangeMin: Number(averagePrice) * 0.7,
      priceRangeMax: Number(averagePrice) * 1.5,
      capacity: Number(capacity) || 0,
      cuisineTypes,
      coverImage: coverImage.trim() || null,
      logo: logo.trim() || null,
      priceRange: 'moderate',
    };

    try {
      const res = await ownerApi.updateRestaurant(id, payload);
      if (res.success) {
        showToast('Cập nhật nhà hàng thành công!', 'success');
        await refreshRestaurants();
        router.back();
      } else {
        showToast(res.message || 'Cập nhật thất bại', 'error');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhà hàng';
      showToast(errMsg, 'error');
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <RestaurantHeader title="Chỉnh sửa thông tin" showBack={true} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Basic Info Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên nhà hàng *</Text>
            <TextInput
              placeholder="Ví dụ: Nhà hàng Gió Biển"
              placeholderTextColor={T.color.placeholder}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả nhà hàng *</Text>
            <TextInput
              placeholder="Mô tả không gian, món ăn chính (tối thiểu 10 ký tự)..."
              placeholderTextColor={T.color.placeholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Số điện thoại *</Text>
              <TextInput
                placeholder="Ví dụ: 0901234567"
                placeholderTextColor={T.color.placeholder}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1.2 }]}>
              <Text style={styles.label}>Email liên hệ *</Text>
              <TextInput
                placeholder="restaurant@gmail.com"
                placeholderTextColor={T.color.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Địa chỉ nhà hàng</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Đường, Số nhà *</Text>
            <TextInput
              placeholder="Ví dụ: 123 Nguyễn Huệ"
              placeholderTextColor={T.color.placeholder}
              value={street}
              onChangeText={setStreet}
              style={styles.input}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Phường/Xã *</Text>
              <TextInput
                placeholder="Bến Nghé"
                placeholderTextColor={T.color.placeholder}
                value={ward}
                onChangeText={setWard}
                style={styles.input}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Quận/Huyện *</Text>
              <TextInput
                placeholder="Quận 1"
                placeholderTextColor={T.color.placeholder}
                value={district}
                onChangeText={setDistrict}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tỉnh/Thành phố *</Text>
            <TextInput
              placeholder="Hồ Chí Minh"
              placeholderTextColor={T.color.placeholder}
              value={city}
              onChangeText={setCity}
              style={styles.input}
            />
          </View>
        </View>

        {/* Operational Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Thông số chi tiết</Text>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Giá trung bình (VND)</Text>
              <TextInput
                placeholder="150000"
                placeholderTextColor={T.color.placeholder}
                value={averagePrice}
                onChangeText={setAveragePrice}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Sức chứa (khách)</Text>
              <TextInput
                placeholder="50"
                placeholderTextColor={T.color.placeholder}
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Loại ẩm thực (phân cách bằng dấu phẩy)</Text>
            <TextInput
              placeholder="Ví dụ: Việt Nam, BBQ, Hải Sản"
              placeholderTextColor={T.color.placeholder}
              value={cuisineInput}
              onChangeText={setCuisineInput}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ảnh đại diện (URL)</Text>
            <TextInput
              placeholder="Chèn link ảnh"
              placeholderTextColor={T.color.placeholder}
              value={coverImage}
              onChangeText={setCoverImage}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Logo nhà hàng (URL)</Text>
            <TextInput
              placeholder="Chèn link logo"
              placeholderTextColor={T.color.placeholder}
              value={logo}
              onChangeText={setLogo}
              style={styles.input}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          disabled={submitting}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#0C0F16" />
          ) : (
            <>
              <FontAwesome name="check" size={14} color="#0C0F16" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Lưu thay đổi</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: T.space['4xl'],
    gap: T.space.lg,
  },
  sectionCard: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    gap: T.space.md,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 6,
    marginBottom: 4,
  },
  inputGroup: {
    gap: T.space.xs,
  },
  label: {
    color: T.color.text2,
    fontSize: 12.5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: T.color.bg,
    borderWidth: 1,
    borderColor: T.color.border,
    borderRadius: T.radius.md,
    height: 42,
    paddingHorizontal: T.space.md,
    color: '#FFFFFF',
    fontSize: 13,
  },
  textArea: {
    height: 90,
    paddingTop: T.space.sm,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: T.space.md,
  },
  submitBtn: {
    backgroundColor: T.color.primary,
    height: 46,
    borderRadius: T.radius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: T.space.md,
  },
  submitBtnText: {
    color: '#0C0F16',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
