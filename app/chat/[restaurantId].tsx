import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/src/auth/useAuth';
import { chatApi } from '@/src/api/chat.api';
import { restaurantApi } from '@/src/api/restaurant.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { FontAwesome } from '@expo/vector-icons';

interface Message {
  id: string;
  senderId: string;
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

export default function ChatWithRestaurantScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('Nhà hàng');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);

  // Initialize conversation and fetch messages
  const initChat = useCallback(async () => {
    if (!restaurantId || !isAuthenticated) return;
    try {
      // 1. Get restaurant details for header
      const restRes = await restaurantApi.getById(restaurantId);
      if (restRes.success && restRes.data) {
        setRestaurantName(restRes.data.name || 'Nhà hàng');
      }

      // 2. Open or create conversation
      const convRes = await chatApi.createConversation(restaurantId);
      if (convRes.success && convRes.data) {
        const conv = convRes.data;
        setConversationId(conv.id);

        // 3. Get messages
        const msgRes = await chatApi.getMessages(conv.id, { limit: 50 });
        if (msgRes.success && msgRes.data?.messages) {
          setMessages(msgRes.data.messages);
        }

        // 4. Mark conversation as read
        await chatApi.markRead(conv.id);
      }
    } catch (error) {
      console.warn('Lỗi khởi tạo cuộc trò chuyện:', error);
      showToast('Không thể kết nối trò chuyện với nhà hàng', 'error');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, isAuthenticated, showToast]);

  useEffect(() => {
    initChat();
  }, [initChat]);

  // Polling for new messages every 3 seconds
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(async () => {
      try {
        const msgRes = await chatApi.getMessages(conversationId, { limit: 50 });
        if (msgRes.success && msgRes.data?.messages) {
          setMessages(msgRes.data.messages);
        }
      } catch (e) {
        // Silent catch polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  const handleSend = async () => {
    if (!inputMsg.trim() || !conversationId || sending) return;
    const content = inputMsg.trim();
    setInputMsg('');
    setSending(true);

    // Optimistic UI update
    const tempId = Math.random().toString();
    const optimisticMsg: Message = {
      id: tempId,
      senderId: user?.id || '',
      senderRole: 'customer',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await chatApi.sendMessage(conversationId, content);
      if (res.success && res.data?.message) {
        // Replace temp optimistic message with real message
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.data.message : m))
        );
      }
    } catch (error) {
      // Remove optimistic message on fail
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
      style={styles.container}
    >
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.headerTextWrapper}>
          <Text style={[typography.titleSM, styles.title]} numberOfLines={1}>{restaurantName}</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Phản hồi nhanh</Text>
          </View>
        </View>
      </View>

      {/* ─── Chat messages ─── */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((item) => {
          const isUser = item.senderRole === 'customer';
          return (
            <View
              key={item.id}
              style={[
                styles.messageRow,
                isUser ? styles.userRow : styles.restaurantRow,
              ]}
            >
              <View style={[styles.bubble, isUser ? styles.userBubble : styles.restaurantBubble]}>
                <Text style={styles.messageText}>{item.content}</Text>
                <Text style={[styles.timeText, isUser ? styles.userTimeText : styles.restaurantTimeText]}>
                  {formatMessageTime(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ─── Input Bar ─── */}
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
          <FontAwesome name="paper-plane" size={14} color="#0C0F16" />
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
  chatContent: {
    padding: T.space.lg,
    paddingBottom: 40,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: T.space.base,
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
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
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
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
    backgroundColor: '#0C0F16',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: T.color.card,
    borderRadius: T.radius.full,
    borderWidth: 1,
    borderColor: T.color.border,
    paddingHorizontal: T.space.md,
    color: '#FFFFFF',
    fontSize: 13,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
});
