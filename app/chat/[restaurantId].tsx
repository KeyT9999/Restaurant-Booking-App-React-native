import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { useOwnerRestaurant } from '@/src/auth/OwnerRestaurantContext';
import { chatApi } from '@/src/api/chat.api';
import { restaurantApi } from '@/src/api/restaurant.api';
import { ownerApi } from '@/src/api/owner.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { FontAwesome } from '@expo/vector-icons';

interface Message {
  id: string;
  sender?: string | { id?: string; _id?: string; fullName?: string; username?: string; avatarUrl?: string };
  senderId?: string;
  senderRole: 'customer' | 'restaurant_owner' | 'admin' | string;
  content: string;
  createdAt: string;
}

const formatMessageTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  } catch (e) {
    return '';
  }
};

const formatDateSeparator = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return '';
  }
};

export default function ChatWithRestaurantScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { restaurantId, conversationId: queryConvId, customerName: queryCustomerName, customerAvatar: queryCustomerAvatar } = useLocalSearchParams<{
    restaurantId: string;
    conversationId?: string;
    customerName?: string;
    customerAvatar?: string;
  }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const { activeRestaurant } = useOwnerRestaurant();
  const isOwner = user?.role === 'restaurant_owner';
  const actualRestaurantId = (restaurantId && restaurantId !== 'undefined') ? restaurantId : (activeRestaurant?.id || '');

  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('Nhà hàng');
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);
  const [ownRestaurantName, setOwnRestaurantName] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);

  const initChat = useCallback(async () => {
    if (!actualRestaurantId || !isAuthenticated) return;
    try {
      if (queryConvId) {
        setConversationId(queryConvId);
        setRestaurantName(queryCustomerName || 'Khách hàng');
        setRestaurantLogo(queryCustomerAvatar || null);

        // Fetch own restaurant details via owner API
        try {
          const restRes = await ownerApi.getMyRestaurantById(actualRestaurantId);
          if (restRes.success && restRes.data) {
            setOwnRestaurantName(restRes.data.name || '');
          }
        } catch (err) {
          console.warn('Lỗi lấy thông tin nhà hàng qua Owner API:', err);
        }

        const msgRes = await chatApi.getMessages(queryConvId, { limit: 55 });
        if (msgRes.success && msgRes.data?.messages) {
          const msgs = msgRes.data.messages;
          setMessages(msgs);

          // Find a message from the customer to extract their real name & avatar
          const customerMsg = msgs.find(
            (m: any) =>
              m.senderRole === 'customer' &&
              m.sender &&
              typeof m.sender === 'object'
          );
          if (customerMsg && typeof customerMsg.sender === 'object') {
            setRestaurantName(
              customerMsg.sender.fullName ||
                customerMsg.sender.username ||
                'Khách hàng'
            );
            if (customerMsg.sender.avatarUrl) {
              setRestaurantLogo(customerMsg.sender.avatarUrl);
            }
          }
        }

        await chatApi.markRead(queryConvId);
      } else {
        const restRes = await restaurantApi.getById(actualRestaurantId);
        if (restRes.success && restRes.data) {
          setRestaurantName(restRes.data.name || 'Nhà hàng');
          setRestaurantLogo(restRes.data.logo || null);
        }

        const convRes = await chatApi.createConversation(actualRestaurantId);
        if (convRes.success && convRes.data) {
          const conv = convRes.data;
          setConversationId(conv.id);

          const msgRes = await chatApi.getMessages(conv.id, { limit: 55 });
          if (msgRes.success && msgRes.data?.messages) {
            setMessages(msgRes.data.messages);
          }

          await chatApi.markRead(conv.id);
        }
      }
    } catch (error) {
      console.warn('Lỗi khởi tạo cuộc trò chuyện:', error);
      showToast('Không thể kết nối trò chuyện', 'error');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, queryConvId, queryCustomerName, queryCustomerAvatar, isAuthenticated, showToast]);

  useEffect(() => {
    initChat();
  }, [initChat]);

  // Polling for messages
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(async () => {
      try {
        const msgRes = await chatApi.getMessages(conversationId, { limit: 55 });
        if (msgRes.success && msgRes.data?.messages) {
          const msgs = msgRes.data.messages;
          setMessages(msgs);

          if (queryConvId) {
            const customerMsg = msgs.find(
              (m: any) =>
                m.senderRole === 'customer' &&
                m.sender &&
                typeof m.sender === 'object'
            );
            if (customerMsg && typeof customerMsg.sender === 'object') {
              setRestaurantName(
                customerMsg.sender.fullName ||
                  customerMsg.sender.username ||
                  'Khách hàng'
              );
              if (customerMsg.sender.avatarUrl) {
                setRestaurantLogo(customerMsg.sender.avatarUrl);
              }
            }
          }
        }
      } catch (e) {}
    }, 4000);

    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, [messages]);

  const handleSend = async () => {
    if (!inputMsg.trim() || !conversationId || sending) return;
    const content = inputMsg.trim();
    setInputMsg('');
    setSending(true);

    const tempId = Math.random().toString();
    const optimisticMsg: Message = {
      id: tempId,
      senderId: user?.id || '',
      senderRole: isOwner ? 'restaurant' : 'customer',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await chatApi.sendMessage(conversationId, content);
      if (res.success && res.data?.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.data.message : m))
        );
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      showToast('Gửi tin nhắn thất bại', 'error');
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.guestContainer}>
        <FontAwesome name="comments-o" size={60} color={T.color.text3} style={{ marginBottom: T.space.lg }} />
        <Text style={[typography.titleSM, styles.guestTitle]}>Nhắn tin với nhà hàng</Text>
        <Text style={styles.guestSubtitle}>Vui lòng đăng nhập tài khoản Diner để nhắn tin trao đổi trực tiếp với nhà hàng.</Text>
        <Button label="Đăng nhập ngay" onPress={() => router.push('/(auth)/login')} style={styles.loginBtn} />
      </View>
    );
  }

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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        {restaurantLogo ? (
          <Image source={{ uri: restaurantLogo }} style={styles.logo as any} />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.logoInitial}>{restaurantName[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleSM, styles.title]} numberOfLines={1}>{restaurantName}</Text>
          <View style={styles.statusRow}>
            {isOwner ? (
              <Text style={styles.statusText}>Khách hàng</Text>
            ) : (
              <>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Trực tuyến</Text>
              </>
            )}
          </View>
        </View>

        {isOwner && ownRestaurantName ? (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText} numberOfLines={1}>Tư cách: {ownRestaurantName}</Text>
          </View>
        ) : null}
      </View>

      {isOwner && ownRestaurantName ? (
        <View style={styles.infoBanner}>
          <FontAwesome name="building" size={12} color={T.color.primary} />
          <Text style={styles.infoBannerText}>
            Bạn đang trò chuyện với tư cách: <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>{ownRestaurantName}</Text>
          </Text>
        </View>
      ) : null}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((item, idx) => {
          const s = item.sender || item.senderId;
          const messageSenderId = s ? (typeof s === 'string' ? s : (s.id || s._id || '')) : '';
          const isMe = !!(messageSenderId && user?.id && messageSenderId === user.id);
          
          // Date Separator logic
          const currentDateStr = new Date(item.createdAt).toDateString();
          const prevDateStr = idx > 0 ? new Date(messages[idx - 1].createdAt).toDateString() : null;
          const showDateSep = currentDateStr !== prevDateStr;

          return (
            <View key={item.id}>
              {showDateSep && (
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateSeparatorText}>{formatDateSeparator(item.createdAt)}</Text>
                </View>
              )}

              <View style={[styles.messageRow, isMe ? styles.userRow : styles.restaurantRow]}>
                <View style={[styles.bubble, isMe ? styles.userBubble : styles.restaurantBubble]}>
                  <Text style={[styles.messageText, isMe ? styles.userMessageText : styles.restMessageText]}>{item.content}</Text>
                  <Text style={[styles.timeText, isMe ? styles.userTimeText : styles.restaurantTimeText]}>
                    {formatMessageTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={T.color.placeholder}
          value={inputMsg}
          onChangeText={setInputMsg}
          onSubmitEditing={handleSend}
          editable={!sending}
        />
        <Pressable
          onPress={handleSend}
          style={[styles.sendBtn, (!inputMsg.trim() || sending) && styles.sendBtnDisabled]}
          disabled={!inputMsg.trim() || sending}
        >
          <FontAwesome name="paper-plane" size={12} color="#0C0F16" />
        </Pressable>
      </View>
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
    backgroundColor: T.color.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: T.space.lg,
    paddingBottom: T.space.md,
    borderBottomWidth: 1,
    borderBottomColor: T.color.border,
    gap: T.space.md,
  },
  backBtn: {
    marginRight: 0,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  logoFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.color.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: {
    color: T.color.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  headerTextWrapper: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.color.success,
    marginRight: 4,
  },
  statusText: {
    color: T.color.text3,
    fontSize: 10,
  },
  roleBadge: {
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.radius.sm,
    maxWidth: '45%',
  },
  roleText: {
    color: T.color.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  chatContent: {
    padding: T.space.lg,
    paddingBottom: 40,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: T.space.md,
  },
  dateSeparatorText: {
    color: T.color.text3,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: T.space.md,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  restaurantRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: T.radius.lg,
    paddingHorizontal: T.space.md,
    paddingVertical: T.space.sm,
  },
  userBubble: {
    backgroundColor: T.color.primary,
    borderTopRightRadius: 2,
  },
  restaurantBubble: {
    backgroundColor: T.color.card,
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: T.color.border,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  userMessageText: {
    color: '#0C0F16',
    fontWeight: '600',
  },
  restMessageText: {
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimeText: {
    color: '#0C0F16',
    opacity: 0.6,
  },
  restaurantTimeText: {
    color: T.color.text3,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: T.space.lg,
    paddingTop: T.space.sm,
    paddingBottom: Platform.OS === 'ios' ? 34 : T.space.lg,
    borderTopWidth: 1,
    borderTopColor: T.color.border,
    backgroundColor: '#0C0F16',
  },
  input: {
    flex: 1,
    height: 38,
    backgroundColor: T.color.card,
    borderRadius: T.radius.full,
    borderWidth: 1,
    borderColor: T.color.border,
    paddingHorizontal: T.space.md,
    color: '#FFFFFF',
    fontSize: 13,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: T.space.sm,
  },
  sendBtnDisabled: {
    backgroundColor: '#3A4255',
    opacity: 0.5,
  },
  guestContainer: {
    flex: 1,
    backgroundColor: T.color.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  guestTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: T.space.xs,
    textAlign: 'center',
  },
  guestSubtitle: {
    color: T.color.text3,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: T.space.xl,
  },
  loginBtn: {
    width: '100%',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 150, 83, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: T.space.lg,
    gap: 8,
  },
  infoBannerText: {
    color: T.color.text2,
    fontSize: 12,
  },
});
