import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { MenuItem } from '@/src/types/restaurant.types';
import { formatCurrency } from '@/src/utils/format';
import { FontAwesome } from '@expo/vector-icons';

interface PreOrderSelectorProps {
  menuItems: MenuItem[];
  preOrders: { [itemId: string]: number };
  onPreOrderChange: (itemId: string, diff: number) => void;
  loading: boolean;
}

export const PreOrderSelector: React.FC<PreOrderSelectorProps> = ({
  menuItems,
  preOrders,
  onPreOrderChange,
  loading,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={T.color.primary} />
        <Text style={styles.loadingText}>Đang tải thực đơn nhà hàng...</Text>
      </View>
    );
  }

  if (menuItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome name="cutlery" size={24} color={T.color.text3} style={{ marginBottom: T.space.sm }} />
        <Text style={styles.emptyText}>Nhà hàng hiện chưa cập nhật thực đơn.</Text>
      </View>
    );
  }

  // Get unique categories
  const categories = ['Tất cả', ...Array.from(new Set(menuItems.map(item => item.categoryName || item.category || 'Món khác').filter(Boolean)))];

  // Filter items based on activeCategory
  const filteredItems = activeCategory === 'Tất cả'
    ? menuItems
    : menuItems.filter(item => (item.categoryName || item.category || 'Món khác') === activeCategory);

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[styles.categoryTab, isActive && styles.activeCategoryTab]}
            >
              <Text style={[styles.categoryText, isActive && styles.activeCategoryText]}>
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Menu List */}
      <View style={styles.menuGrid}>
        {filteredItems.map((item) => {
          const qty = preOrders[item.id] || 0;
          return (
            <View key={item.id} style={[styles.foodCard, qty > 0 && styles.activeFoodCard]}>
              <Image
                source={{ uri: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' }}
                style={styles.foodImg}
                resizeMode="cover"
              />
              <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.description ? (
                  <Text style={styles.foodDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                
                <View style={styles.foodFooter}>
                  <Text style={styles.foodPrice}>{formatCurrency(item.price)}</Text>
                  
                  {qty > 0 ? (
                    <View style={styles.qtyStepper}>
                      <Pressable
                        onPress={() => onPreOrderChange(item.id, -1)}
                        style={styles.stepperBtn}
                      >
                        <FontAwesome name="minus" size={10} color="#FFFFFF" />
                      </Pressable>
                      <Text style={styles.qtyVal}>{qty}</Text>
                      <Pressable
                        onPress={() => onPreOrderChange(item.id, 1)}
                        style={styles.stepperBtn}
                      >
                        <FontAwesome name="plus" size={10} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => onPreOrderChange(item.id, 1)}
                      style={styles.addBtn}
                    >
                      <FontAwesome name="plus" size={10} color="#0C0F16" style={{ marginRight: 4 }} />
                      <Text style={styles.addBtnText}>Thêm</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: T.space.xs,
  },
  centerContainer: {
    padding: T.space.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  loadingText: {
    color: T.color.text3,
    fontSize: 12,
    marginTop: T.space.sm,
  },
  emptyContainer: {
    padding: T.space.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  emptyText: {
    color: T.color.text3,
    fontSize: 12,
    fontStyle: 'italic',
  },
  categoryScroll: {
    paddingHorizontal: T.space.lg,
    marginBottom: T.space.md,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: T.space.base,
    paddingVertical: 8,
    borderRadius: T.radius.full,
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  activeCategoryTab: {
    backgroundColor: T.color.primary,
    borderColor: T.color.primary,
  },
  categoryText: {
    color: T.color.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#0C0F16',
    fontWeight: '700',
  },
  menuGrid: {
    paddingHorizontal: T.space.lg,
    gap: T.space.sm,
  },
  foodCard: {
    flexDirection: 'row',
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    padding: 10,
    alignItems: 'center',
  },
  activeFoodCard: {
    borderColor: 'rgba(212, 150, 83, 0.3)',
    backgroundColor: 'rgba(212, 150, 83, 0.02)',
  },
  foodImg: {
    width: 76,
    height: 76,
    borderRadius: T.radius.sm,
    marginRight: T.space.md,
  },
  foodInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  foodName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  foodDesc: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  foodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  foodPrice: {
    color: T.color.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.color.primary,
    borderRadius: T.radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  addBtnText: {
    color: '#0C0F16',
    fontSize: 11,
    fontWeight: '700',
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: T.radius.sm,
    padding: 2,
    height: 28,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: T.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  qtyVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    width: 28,
    textAlign: 'center',
  },
});
