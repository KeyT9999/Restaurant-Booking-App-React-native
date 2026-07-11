import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Image, ActivityIndicator, TextInput, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/layout/EmptyState';
import { chatApi } from '@/src/api/chat.api';
import { useAuth } from '@/src/auth/useAuth';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';

interface Conversation {
  id: string;
  restaurantId: string;
  restaurant?: {
    id: string;
    name: string;
    logo?: string;
  };
  customer?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  customerId?: any;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount?: number;
  updatedAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

export default function ConversationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeRestaurant } = useOwnerRestaurant();
  const isOwner = user?.role === 'restaurant_owner';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async (showIndicator = true) => {
    if (showIndicator) setLoading(true);
    try {
      const params = isOwner && activeRestaurant?.id ? { restaurantId: activeRestaurant.id } : undefined;
      const res = await chatApi.getConversations(params);
      setConversations(res?.data?.conversations || res?.data || []);
    } catch (e) {
      console.warn('Lỗi tải hội thoại:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOwner, activeRestaurant?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load(false);
  };

  const getCustomerName = (c: Conversation) => {
    if (!c) return 'Khách hàng';
    const cust = c.customer || c.customerId;
    if (cust && typeof cust === 'object') {
      return cust.fullName || cust.username || cust.email || 'Khách hàng';
    }
    return 'Khách hàng';
  };

  const getCustomerAvatar = (c: Conversation) => {
    const cust = c.customer || c.customerId;
    if (cust && typeof cust === 'object') {
      return cust.avatarUrl || '';
    }
    return '';
  };

  const filteredConversations = conversations.filter((c) => {
    const name = isOwner
      ? getCustomerName(c)
      : (c.restaurant?.name || 'Nhà hàng');
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderItem = ({ item }: { item: Conversation }) => {
    const name = isOwner ? getCustomerName(item) : (item.restaurant?.name || 'Nhà hàng');
    const logo = isOwner ? getCustomerAvatar(item) : item.restaurant?.logo;
    const lastMsg = item.lastMessage?.content || 'Bắt đầu cuộc trò chuyện...';
    const time = item.updatedAt ? timeAgo(item.updatedAt) : '';
    const hasUnread = (item.unreadCount ?? 0) > 0;

    const handlePress = () => {
      if (isOwner) {
        router.push({
          pathname: `/chat/${item.restaurantId}`,
          params: {
            conversationId: item.id,
            customerName: name,
            customerAvatar: logo || '',
          },
        } as any);
      } else {
        router.push(`/chat/${item.restaurantId}` as any);
      }
    };

    return (
      <Pressable
        style={styles.convCard}
        android_ripple={{ color: 'rgba(255,255,255,0.05)' }}
        onPress={handlePress}
      >
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{name[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.onlineDot} />
        </View>

        {/* Content */}
        <View style={styles.convContent}>
          <View style={styles.convHeader}>
            <Text style={[styles.convName, hasUnread && styles.convNameBold]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.convTime}>{time}</Text>
          </View>
          <Text
            style={[styles.convPreview, hasUnread && styles.convPreviewBold]}
            numberOfLines={1}
          >
            {lastMsg}
          </Text>
        </View>

        {/* Unread badge */}
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {(item.unreadCount ?? 0) > 9 ? '9+' : item.unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={[typography.titleMD, styles.title]}>Tin nhắn</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={13} color={T.color.text3} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Tìm cuộc hội thoại..."
            placeholderTextColor={T.color.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome name="times-circle" size={14} color={T.color.text3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.skeletonWrapper}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={52} height={52} borderRadius={26} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={14} borderRadius={6} />
                <Skeleton width="85%" height={12} borderRadius={6} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item, i) => item.id || String(i)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={T.color.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="comments-o"
              title="Chưa có tin nhắn"
              description="Tìm nhà hàng yêu thích để đặt bàn hoặc trao đổi trực tiếp"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.color.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: T.space.base, paddingTop: 52, paddingBottom: T.space.md,
    borderBottomWidth: 1, borderBottomColor: T.color.border,
  },
  title: { color: T.color.text1 },
  searchContainer: {
    paddingVertical: T.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.color.card,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.border,
    marginHorizontal: T.space.base,
    paddingHorizontal: T.space.md,
    height: 38,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12.5,
    padding: 0,
  },
  skeletonWrapper: { padding: T.space.base, gap: T.space.lg },
  skeletonRow: { flexDirection: 'row', gap: T.space.md, alignItems: 'center' },
  list: { paddingBottom: 32 },
  convCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: T.space.base, paddingVertical: T.space.md,
    borderBottomWidth: 1, borderBottomColor: T.color.border, gap: T.space.md,
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: T.color.elevated, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: T.color.primary, fontSize: 20, fontWeight: '700' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: T.color.success, borderWidth: 2, borderColor: T.color.bg,
  },
  convContent: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convName: { color: T.color.text2, fontSize: 14, fontWeight: '500', flex: 1 },
  convNameBold: { color: '#FFFFFF', fontWeight: '700' },
  convTime: { color: T.color.text3, fontSize: 11 },
  convPreview: { color: T.color.text3, fontSize: 13 },
  convPreviewBold: { color: T.color.text2, fontWeight: '600' },
  unreadBadge: {
    backgroundColor: T.color.primary, borderRadius: T.radius.full,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCount: { color: '#0C0F16', fontSize: 11, fontWeight: '800' },
});
