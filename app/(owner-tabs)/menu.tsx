import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { ownerApi } from '@/src/api/owner.api';
import { RestaurantHeader } from '@/src/components/layout/RestaurantHeader';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { useToast } from '@/src/components/ui/Toast';

export default function OwnerMenu() {
  const router = useRouter();
  const { activeRestaurant } = useOwnerRestaurant();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const fetchMenuData = async (showLoading = true) => {
    if (!activeRestaurant?.id) return;
    if (showLoading) setLoading(true);

    try {
      // 1. Fetch Categories
      const catRes = await ownerApi.getCategories(activeRestaurant.id);
      if (catRes.success) {
        const catList = catRes.data?.categories || catRes.data || [];
        setCategories(catList);

        // 2. Fetch Menu Items
        const itemsRes = await ownerApi.getMenuItems(activeRestaurant.id);
        if (itemsRes.success) {
          setMenuItems(itemsRes.data.menuItems || itemsRes.data.items || []);
        }

        // Expand first category by default if any
        if (catList.length > 0 && !expandedCategoryId) {
          setExpandedCategoryId(catList[0].id || catList[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching menu info:', error);
      showToast('Không thể lấy thông tin thực đơn', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCategories([]);
    setMenuItems([]);
    setExpandedCategoryId(null);
    fetchMenuData();
  }, [activeRestaurant]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategoryId(expandedCategoryId === categoryId ? null : categoryId);
  };

  const handleToggleAvailability = async (itemId: string, currentVal: boolean) => {
    try {
      const newVal = !currentVal;
      // Optimistic UI update
      setMenuItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isAvailable: newVal } : item))
      );

      const res = await ownerApi.toggleMenuItemAvailability(itemId, newVal);
      if (res.success) {
        showToast(
          `Đã chuyển trạng thái sang ${newVal ? 'Còn món' : 'Hết món'}`,
          'success'
        );
      } else {
        // Revert
        setMenuItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, isAvailable: currentVal } : item))
        );
        showToast('Cập nhật thất bại', 'error');
      }
    } catch (e: any) {
      // Revert
      setMenuItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isAvailable: currentVal } : item))
      );
      showToast(e.response?.data?.message || 'Có lỗi xảy ra', 'error');
    }
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    Alert.alert('Xoá món ăn', `Bạn có chắc chắn muốn xoá món ăn "${itemName}" không?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await ownerApi.deleteMenuItem(itemId);
            if (res.success) {
              showToast('Đã xoá món ăn thành công', 'success');
              fetchMenuData(false);
            } else {
              showToast(res.message || 'Xoá món ăn thất bại', 'error');
            }
          } catch (e: any) {
            showToast(e.response?.data?.message || 'Không thể xoá món ăn', 'error');
          }
        },
      },
    ]);
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    // Check if category has items
    const hasItems = menuItems.some(
      (item) => item.categoryId === categoryId || item.categoryName === categoryName
    );

    if (hasItems) {
      Alert.alert(
        'Không thể xoá',
        'Danh mục này đang chứa các món ăn. Vui lòng di chuyển hoặc xoá các món ăn trước.'
      );
      return;
    }

    Alert.alert('Xoá danh mục', `Bạn có chắc chắn muốn xoá danh mục "${categoryName}" không?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await ownerApi.deleteCategory(categoryId);
            if (res.success) {
              showToast('Đã xoá danh mục thành công', 'success');
              if (expandedCategoryId === categoryId) {
                setExpandedCategoryId(null);
              }
              fetchMenuData(false);
            } else {
              showToast(res.message || 'Xoá danh mục thất bại', 'error');
            }
          } catch (e: any) {
            showToast(e.response?.data?.message || 'Không thể xoá danh mục', 'error');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.color.primary} />
      </View>
    );
  }

  // Format money helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <View style={styles.container}>
      <RestaurantHeader title="Thực đơn" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Floating actions section */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.addCategoryBtn}
            onPress={() => router.push('/owner/menu/category-form')}
          >
            <FontAwesome name="plus" size={12} color={T.color.primary} style={{ marginRight: 6 }} />
            <Text style={styles.addCategoryText}>Thêm danh mục</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addItemBtn}
            onPress={() => router.push('/owner/menu/item-form')}
          >
            <FontAwesome name="plus" size={12} color={T.color.text1} style={{ marginRight: 6 }} />
            <Text style={styles.addItemText}>Thêm món mới</Text>
          </TouchableOpacity>
        </View>

        {/* Categories list */}
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="book" size={40} color={T.color.text3} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Thực đơn trống. Hãy thêm danh mục để bắt đầu.</Text>
          </View>
        ) : (
          categories.map((cat) => {
            const catId = cat.id || cat._id;
            const catName = cat.name;
            const isExpanded = expandedCategoryId === catId;
            const catItems = menuItems.filter(
              (item) => item.categoryId === catId || item.categoryName === catName || item.category === catName
            );

            return (
              <View key={catId} style={styles.categoryCard}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(catId)}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <FontAwesome name="folder-open-o" size={18} color={T.color.primary} style={{ marginRight: 10 }} />
                    <View>
                      <Text style={styles.categoryNameText}>{catName}</Text>
                      <Text style={styles.categoryCountText}>{catItems.length} món ăn</Text>
                    </View>
                  </View>
                  <View style={styles.categoryHeaderRight}>
                    <TouchableOpacity
                      onPress={() => router.push(`/owner/menu/category-form?id=${catId}&name=${encodeURIComponent(catName)}&description=${encodeURIComponent(cat.description || '')}`)}
                      style={styles.iconBtn}
                    >
                      <FontAwesome name="pencil" size={14} color={T.color.text2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteCategory(catId, catName)}
                      style={styles.iconBtn}
                    >
                      <FontAwesome name="trash" size={14} color={T.color.error} />
                    </TouchableOpacity>
                    <FontAwesome
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={12}
                      color={T.color.text3}
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                </TouchableOpacity>

                {/* Items in Category */}
                {isExpanded && (
                  <View style={styles.itemsWrapper}>
                    {catItems.length === 0 ? (
                      <View style={styles.emptyCategoryItems}>
                        <Text style={styles.emptyItemsText}>Không có món ăn nào trong danh mục này</Text>
                      </View>
                    ) : (
                      catItems.map((item) => {
                        const isAvail = item.isAvailable ?? item.active ?? true;
                        return (
                          <View key={item.id} style={styles.itemRow}>
                            <View style={styles.itemRowLeft}>
                              {item.image ? (
                                <Image source={{ uri: item.image }} style={styles.itemImage} />
                              ) : (
                                <View style={styles.itemNoImage}>
                                  <FontAwesome name="cutlery" size={16} color={T.color.text3} />
                                </View>
                              )}
                              <View style={styles.itemInfo}>
                                <Text style={styles.itemNameText}>{item.name}</Text>
                                {item.description ? (
                                  <Text style={styles.itemDescText} numberOfLines={1}>
                                    {item.description}
                                  </Text>
                                ) : null}
                                <Text style={styles.itemPriceText}>{formatCurrency(item.price)}</Text>
                              </View>
                            </View>

                            <View style={styles.itemRowRight}>
                              <View style={styles.switchCol}>
                                <Text style={[styles.availText, isAvail ? styles.availTextOn : styles.availTextOff]}>
                                  {isAvail ? 'Còn' : 'Hết'}
                                </Text>
                                <Switch
                                  value={isAvail}
                                  onValueChange={() => handleToggleAvailability(item.id, isAvail)}
                                  trackColor={{ false: '#3A4255', true: 'rgba(16, 185, 129, 0.4)' }}
                                  thumbColor={isAvail ? T.color.success : T.color.text3}
                                />
                              </View>
                              <View style={styles.itemActions}>
                                <TouchableOpacity
                                  style={styles.itemActionBtn}
                                  onPress={() => router.push(`/owner/menu/item-form?id=${item.id}`)}
                                >
                                  <FontAwesome name="pencil" size={13} color={T.color.text2} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.itemActionBtn}
                                  onPress={() => handleDeleteItem(item.id, item.name)}
                                >
                                  <FontAwesome name="trash" size={13} color={T.color.error} />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })
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
  actionButtons: {
    flexDirection: 'row',
    gap: T.space.sm,
    marginBottom: T.space.lg,
  },
  addCategoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.3)',
    backgroundColor: 'rgba(212, 150, 83, 0.03)',
  },
  addCategoryText: {
    color: T.color.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  addItemBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: T.radius.md,
    backgroundColor: T.color.primary,
  },
  addItemText: {
    color: T.color.text1,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryCard: {
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
    marginBottom: T.space.md,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: T.space.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryNameText: {
    color: T.color.text1,
    fontSize: 15,
    fontWeight: '600',
  },
  categoryCountText: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.sm,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsWrapper: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: T.space.lg,
    paddingBottom: T.space.md,
  },
  emptyCategoryItems: {
    paddingVertical: T.space.xl,
    alignItems: 'center',
  },
  emptyItemsText: {
    color: T.color.text3,
    fontSize: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  itemRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: T.radius.sm,
    marginRight: T.space.md,
  },
  itemNoImage: {
    width: 50,
    height: 50,
    borderRadius: T.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: T.space.md,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemNameText: {
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '600',
  },
  itemDescText: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
  },
  itemPriceText: {
    color: T.color.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  itemRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.space.md,
  },
  switchCol: {
    alignItems: 'center',
  },
  availText: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  availTextOn: {
    color: T.color.success,
  },
  availTextOff: {
    color: T.color.error,
  },
  itemActions: {
    flexDirection: 'row',
    gap: T.space.xs,
  },
  itemActionBtn: {
    width: 28,
    height: 28,
    borderRadius: T.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
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
