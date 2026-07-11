import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { chatApi } from '@/src/api/chat.api';

interface RestaurantHeaderProps {
  title: string;
  showBack?: boolean;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ title, showBack }) => {
  const { activeRestaurant, restaurants, setActiveRestaurant } = useOwnerRestaurant();
  const [modalVisible, setModalVisible] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const fetchUnread = async () => {
      try {
        const res = await chatApi.getUnreadCount();
        if (res.success && res.data && active) {
          setUnreadChatCount(res.data.count || 0);
        }
      } catch (e) {
        console.warn('Lỗi lấy số tin nhắn chưa đọc ở header:', e);
      }
    };
    fetchUnread();
    
    const interval = setInterval(fetchUnread, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleSelectRestaurant = (restaurant: any) => {
    setActiveRestaurant(restaurant);
    setModalVisible(false);
  };

  const handleBack = () => {
    router.back();
  };

  const hasMultiple = restaurants.length > 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          {showBack && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <FontAwesome name="chevron-left" size={16} color={T.color.text1} />
            </TouchableOpacity>
          )}
          <View style={styles.leftCol}>
            <Text style={[typography.bodySM, styles.titleText]}>{title}</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() => hasMultiple && setModalVisible(true)}
              disabled={!hasMultiple}
            >
              <Text style={[typography.displaySM, styles.restaurantName]} numberOfLines={1}>
                {activeRestaurant?.name || 'Chưa chọn nhà hàng'}
              </Text>
              {hasMultiple && (
                <FontAwesome name="chevron-down" size={12} color={T.color.primary} style={styles.chevron} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.rightCol}>
            <TouchableOpacity
              style={styles.chatIconBtn}
              onPress={() => router.push('/conversations' as any)}
            >
              <FontAwesome name="comments-o" size={20} color={T.color.text1} />
              {unreadChatCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadChatCount > 9 ? '9+' : unreadChatCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn nhà hàng quản lý</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={18} color={T.color.text2} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={restaurants}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === activeRestaurant?.id;
                return (
                  <TouchableOpacity
                    style={[styles.restaurantItem, isSelected && styles.restaurantItemActive]}
                    onPress={() => handleSelectRestaurant(item)}
                  >
                    <View style={styles.restaurantItemInfo}>
                      <FontAwesome
                        name="building"
                        size={16}
                        color={isSelected ? T.color.primary : T.color.text3}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={[styles.restaurantItemName, isSelected && styles.restaurantItemNameActive]}>
                        {item.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <FontAwesome name="check" size={14} color={T.color.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.list}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: T.color.bg,
  },
  container: {
    paddingHorizontal: T.space.xl,
    paddingTop: Platform.OS === 'ios' ? T.space.sm : T.space.lg,
    paddingBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
    backgroundColor: T.color.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: T.space.md,
    paddingVertical: T.space.xs,
    paddingHorizontal: T.space.sm,
    marginLeft: -T.space.sm,
  },
  leftCol: {
    justifyContent: 'center',
    flex: 1,
  },
  rightCol: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: T.space.md,
  },
  chatIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: T.color.error,
    borderRadius: 8,
    height: 16,
    minWidth: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  titleText: {
    color: T.color.text3,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantName: {
    color: T.color.text1,
    fontWeight: '700',
    maxWidth: '85%',
  },
  chevron: {
    marginLeft: 8,
    marginTop: 2,
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
    maxHeight: '60%',
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
  list: {
    width: '100%',
  },
  restaurantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: T.space.md,
    paddingHorizontal: T.space.sm,
    borderRadius: T.radius.md,
    marginBottom: T.space.xs,
  },
  restaurantItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  restaurantItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  restaurantItemName: {
    color: T.color.text2,
    fontSize: 15,
  },
  restaurantItemNameActive: {
    color: T.color.primary,
    fontWeight: '600',
  },
});
