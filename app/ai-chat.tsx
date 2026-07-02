import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { aiApi } from '@/src/api/ai.api';
import { T } from '@/src/theme/tokens';
import { typography } from '@/src/theme/typography';
import { BackButton } from '@/src/components/ui/BackButton';
import { Button } from '@/src/components/ui/Button';
import { Chip } from '@/src/components/ui/Chip';
import { useToast } from '@/src/components/ui/Toast';
import { FontAwesome } from '@expo/vector-icons';
import { formatCurrency, formatDate } from '@/src/utils/format';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  toolLabel?: string;
  pendingAction?: {
    id: string;
    restaurantName: string;
    bookingDate: string;
    bookingTime: string;
    numberOfGuests: number;
    tableNumbers: string[];
    depositAmount: number;
    status: 'pending' | 'confirmed' | 'cancelled';
  };
}

export default function AIChatScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là Trợ lý AI của BookEat. Tôi có thể giúp bạn tìm kiếm nhà hàng, kiểm tra bàn trống, áp dụng ưu đãi và hỗ trợ bạn đặt bàn trực tiếp. Bạn muốn ăn gì hôm nay?',
    },
  ]);
  const [sending, setSending] = useState(false);
  const [activeTool, setActiveTool] = useState<{ name: string; label: string } | null>(null);

  const suggestionChips = [
    'Tìm nhà hàng hải sản Quận 1 🦀',
    'Đặt bàn 4 người tối nay lúc 19h 📅',
    'Nhà hàng nào đang có khuyến mãi? 🎁',
    'Món nướng nào ngon gần đây? 🔥',
  ];

  // Scroll to bottom when messages list changes
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, activeTool]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || sending) return;

    const userText = textToSend.trim();
    setInputMessage('');
    setSending(true);

    const userMessageId = Math.random().toString();
    const newUserMsg: Message = {
      id: userMessageId,
      role: 'user',
      content: userText,
    };

    const assistantMsgId = Math.random().toString();
    const newAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, newUserMsg, newAssistantMsg]);

    const history = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    let accumulatedResponse = '';

    try {
      await aiApi.streamChat(
        userText,
        history,
        null,
        // onChunk
        (chunk) => {
          accumulatedResponse += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: accumulatedResponse }
                : msg
            )
          );
        },
        // onToolStart
        (toolName, label) => {
          setActiveTool({ name: toolName, label });
        },
        // onToolComplete
        (toolName, status, data) => {
          setActiveTool(null);
          // Check if data contains a pending action (e.g. preview booking action)
          if (data && (data.pendingActionId || data.id) && (data.restaurantName || data.bookingDate)) {
            const action = data;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? {
                      ...msg,
                      pendingAction: {
                        id: action.pendingActionId || action.id,
                        restaurantName: action.restaurantName || 'Nhà hàng',
                        bookingDate: action.bookingDate,
                        bookingTime: action.bookingTime,
                        numberOfGuests: action.numberOfGuests || 2,
                        tableNumbers: action.tableNumbers || [],
                        depositAmount: action.depositAmount || action.finalAmount || 0,
                        status: 'pending',
                      },
                    }
                  : msg
              )
            );
          }
        },
        // onError
        (err) => {
          console.warn('AI Stream Error:', err);
          setActiveTool(null);
          // Attempt fallback mock chat
          handleMockFallback(userText, assistantMsgId);
        },
        // onDone
        () => {
          setSending(false);
          setActiveTool(null);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
            )
          );
        }
      );
    } catch (e) {
      setSending(false);
      setActiveTool(null);
      showToast('Có lỗi kết nối trợ lý AI', 'error');
    }
  };

  // Fallback to mock chat if stream fails or rate-limited
  const handleMockFallback = async (userText: string, assistantMsgId: string) => {
    try {
      const res = await aiApi.mockChat(userText);
      if (res.success && res.data) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: res.data.reply || 'Tôi có thể giúp gì thêm cho bạn?',
                  isStreaming: false,
                  pendingAction: res.data.pendingAction
                    ? {
                        id: res.data.pendingAction.id,
                        restaurantName: res.data.pendingAction.restaurantName,
                        bookingDate: res.data.pendingAction.bookingDate,
                        bookingTime: res.data.pendingAction.bookingTime,
                        numberOfGuests: res.data.pendingAction.numberOfGuests,
                        tableNumbers: res.data.pendingAction.tableNumbers,
                        depositAmount: res.data.pendingAction.depositAmount,
                        status: 'pending',
                      }
                    : undefined,
                }
              : msg
          )
        );
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: 'Xin lỗi, tôi gặp chút gián đoạn kết nối. Bạn vui lòng thử lại sau ít phút.',
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  // Confirm pending AI booking
  const handleConfirmAction = async (msgId: string, actionId: string) => {
    try {
      const res = await aiApi.confirmPendingAction(actionId);
      if (res.success) {
        showToast('Xác nhận đặt bàn thành công! 🎉', 'success');
        // Update UI
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId && msg.pendingAction
              ? {
                  ...msg,
                  content: msg.content + '\n\n✅ Đặt bàn của bạn đã được xác nhận thành công!',
                  pendingAction: { ...msg.pendingAction, status: 'confirmed' },
                }
              : msg
          )
        );
        // Redirect to booking success screen or detail screen
        const booking = res.data?.booking || res.data;
        if (booking?.id) {
          router.push(`/booking/${booking.id}`);
        }
      } else {
        showToast(res.message || 'Xác nhận thất bại', 'error');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi xác nhận đặt bàn';
      showToast(msg, 'error');
    }
  };

  // Cancel pending AI booking
  const handleCancelAction = async (msgId: string, actionId: string) => {
    try {
      const res = await aiApi.cancelPendingAction(actionId, 'Người dùng hủy trên chatbot');
      if (res.success) {
        showToast('Đã hủy yêu cầu giữ bàn.', 'info');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId && msg.pendingAction
              ? {
                  ...msg,
                  content: msg.content + '\n\n❌ Yêu cầu đặt bàn này đã bị hủy bỏ.',
                  pendingAction: { ...msg.pendingAction, status: 'cancelled' },
                }
              : msg
          )
        );
      }
    } catch (e) {
      showToast('Không thể hủy bỏ yêu cầu giữ bàn lúc này', 'error');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.botProfile}>
          <View style={styles.botAvatar}>
            <FontAwesome name="android" size={18} color="#0C0F16" />
          </View>
          <View>
            <Text style={styles.botName}>Trợ lý BookEat AI</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Hoạt động</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── Chat Area ─── */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((item) => {
          const isUser = item.role === 'user';
          return (
            <View
              key={item.id}
              style={[
                styles.messageRow,
                isUser ? styles.userRow : styles.assistantRow,
              ]}
            >
              {!isUser && (
                <View style={styles.chatBotIcon}>
                  <FontAwesome name="android" size={12} color={T.color.primary} />
                </View>
              )}
              <View style={{ flex: 1, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                  {item.content ? (
                    <Text style={styles.messageText}>{item.content}</Text>
                  ) : item.isStreaming ? (
                    <ActivityIndicator size="small" color={T.color.primary} />
                  ) : null}
                </View>

                {/* Render Pending Action interactive Card */}
                {item.pendingAction && (
                  <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                      <FontAwesome name="calendar-check-o" size={16} color={T.color.primary} />
                      <Text style={styles.previewTitle}>Xác nhận đặt bàn của bạn</Text>
                    </View>

                    <Text style={styles.previewRestName}>{item.pendingAction.restaurantName}</Text>

                    <View style={styles.previewDetails}>
                      <Text style={styles.previewDetailText}>📅 Ngày: {formatDate(item.pendingAction.bookingDate)}</Text>
                      <Text style={styles.previewDetailText}>⏰ Giờ: {item.pendingAction.bookingTime}</Text>
                      <Text style={styles.previewDetailText}>👥 Số khách: {item.pendingAction.numberOfGuests} người</Text>
                      {item.pendingAction.tableNumbers.length > 0 && (
                        <Text style={styles.previewDetailText}>🪑 Bàn: {item.pendingAction.tableNumbers.join(', ')}</Text>
                      )}
                      <Text style={styles.previewDetailText}>
                        💰 Tiền cọc: <Text style={{ color: T.color.primary, fontWeight: '700' }}>{formatCurrency(item.pendingAction.depositAmount)}</Text>
                      </Text>
                    </View>

                    {item.pendingAction.status === 'pending' ? (
                      <View style={styles.previewActions}>
                        <Pressable
                          onPress={() => handleCancelAction(item.id, item.pendingAction!.id)}
                          style={[styles.actionBtn, styles.actionCancelBtn]}
                        >
                          <Text style={styles.actionCancelText}>Hủy bỏ</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleConfirmAction(item.id, item.pendingAction!.id)}
                          style={[styles.actionBtn, styles.actionConfirmBtn]}
                        >
                          <Text style={styles.actionConfirmText}>Xác nhận ngay</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.statusBox}>
                        <Text
                          style={[
                            styles.statusLabelText,
                            item.pendingAction.status === 'confirmed'
                              ? { color: T.color.success }
                              : { color: T.color.text3 },
                          ]}
                        >
                          {item.pendingAction.status === 'confirmed' ? '✓ ĐÃ XÁC NHẬN' : '✗ ĐÃ HỦY BỎ'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Render Tool run indicators */}
        {activeTool && (
          <View style={[styles.messageRow, styles.assistantRow]}>
            <View style={styles.chatBotIcon}>
              <FontAwesome name="android" size={12} color={T.color.primary} />
            </View>
            <View style={styles.toolIndicator}>
              <ActivityIndicator size="small" color={T.color.primary} style={{ marginRight: 8 }} />
              <Text style={styles.toolIndicatorText}>{activeTool.label}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── Suggestion Chips ─── */}
      {messages.length === 1 && !sending && (
        <View style={styles.chipsContainer}>
          <Text style={styles.chipsTitle}>Gợi ý nhanh:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsList}>
            {suggestionChips.map((chip, idx) => (
              <Chip key={idx} label={chip} active={false} onPress={() => handleSend(chip)} style={styles.suggestChip} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ─── Input Bar ─── */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn gửi tới AI..."
          placeholderTextColor={T.color.placeholder}
          value={inputMessage}
          onChangeText={setInputMessage}
          onSubmitEditing={() => handleSend(inputMessage)}
          editable={!sending}
        />
        <Pressable
          onPress={() => handleSend(inputMessage)}
          style={[styles.sendBtn, (!inputMessage.trim() || sending) && styles.sendBtnDisabled]}
          disabled={!inputMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#0C0F16" />
          ) : (
            <FontAwesome name="paper-plane" size={14} color="#0C0F16" />
          )}
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
  botProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: T.space.sm,
  },
  botName: {
    color: '#FFFFFF',
    fontSize: 14,
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
    marginBottom: T.space.lg,
    alignItems: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  chatBotIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: T.radius.lg,
    paddingHorizontal: T.space.md,
    paddingVertical: T.space.sm,
  },
  userBubble: {
    backgroundColor: T.color.primary,
    borderTopRightRadius: 2,
  },
  assistantBubble: {
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
  toolIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: T.space.sm,
    paddingHorizontal: T.space.md,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  toolIndicatorText: {
    color: T.color.text3,
    fontSize: 12,
  },
  previewCard: {
    width: 260,
    backgroundColor: T.color.card,
    borderWidth: 1,
    borderColor: T.color.primary,
    borderRadius: T.radius.lg,
    padding: T.space.md,
    marginTop: T.space.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    paddingBottom: 6,
    marginBottom: 8,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  previewRestName: {
    color: T.color.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  previewDetails: {
    gap: 4,
    marginBottom: T.space.md,
  },
  previewDetailText: {
    color: T.color.text2,
    fontSize: 11,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: T.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionConfirmBtn: {
    backgroundColor: T.color.primary,
  },
  actionCancelText: {
    color: T.color.text2,
    fontSize: 11,
    fontWeight: '600',
  },
  actionConfirmText: {
    color: '#0C0F16',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 8,
    alignItems: 'center',
  },
  statusLabelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipsContainer: {
    paddingHorizontal: T.space.lg,
    marginBottom: T.space.sm,
  },
  chipsTitle: {
    color: T.color.text3,
    fontSize: 11,
    marginBottom: T.space.xs,
  },
  chipsList: {
    gap: 8,
  },
  suggestChip: {
    alignItems: 'center',
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
});
