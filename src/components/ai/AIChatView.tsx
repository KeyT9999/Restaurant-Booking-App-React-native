import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { aiApi, type AIChatHistoryItem, type AIStreamEventPayload } from '@/src/api/ai.api';
import { BackButton } from '@/src/components/ui/BackButton';
import { Chip } from '@/src/components/ui/Chip';
import { useToast } from '@/src/components/ui/Toast';
import { T } from '@/src/theme/tokens';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { getAIChatErrorMessage, isNonRetryableAIError } from './aiErrorCopy';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 8;

type AISurface = 'customer' | 'owner' | 'admin';
type MessageRole = 'user' | 'assistant';
type MessageStatus = 'streaming' | 'completed' | 'failed' | 'cancelled';

type PendingAction = {
  id: string;
  restaurantName: string;
  bookingDate: string;
  bookingTime: string;
  numberOfGuests: number;
  tableNumbers: string[];
  depositAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
};

type ToolStatus = {
  tool?: string;
  label: string;
  status: 'running' | 'completed';
};

type AIResult = {
  type?: string;
  version?: number;
  payload?: any;
};

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  results: AIResult[];
  pendingAction?: PendingAction;
  toolStatus?: ToolStatus | null;
  toolError?: string | null;
};

type RetryPayload = {
  message: string;
  assistantMessageId: string;
  history: AIChatHistoryItem[];
};

type ChatErrorState = {
  code?: string;
  message: string;
  retry?: RetryPayload | null;
};

export type AIChatViewProps = {
  surface?: AISurface;
  title: string;
  subtitle: string;
  greeting: string;
  suggestions: string[];
  placeholder?: string;
  pageContext?: Record<string, unknown> | null;
  ownerContext?: Record<string, unknown> | null;
  adminContext?: Record<string, unknown> | null;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createMessage = (
  role: MessageRole,
  content: string,
  status: MessageStatus = 'completed'
): ChatMessage => ({
  id: createId(),
  role,
  content,
  status,
  results: [],
  pendingAction: undefined,
  toolStatus: null,
  toolError: null,
});

const buildRecentHistory = (messages: ChatMessage[]): AIChatHistoryItem[] =>
  messages
    .filter(
      (message) =>
        ['user', 'assistant'].includes(message.role) &&
        message.status === 'completed' &&
        message.content.trim()
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({ role: message.role, content: message.content }));

const getFallbackText = (status: MessageStatus) =>
  status === 'cancelled' ? 'Phan hoi da duoc dung.' : 'Phan hoi bi gian doan.';

const mapPendingAction = (payload: any): PendingAction | null => {
  const source = payload?.payload || payload;

  if (
    !source ||
    (!(source.pendingActionId || source.id) || !source.bookingDate || !source.bookingTime)
  ) {
    return null;
  }

  return {
    id: String(source.pendingActionId || source.id),
    restaurantName: source.restaurantName || source.restaurant?.name || 'Nha hang',
    bookingDate: source.bookingDate,
    bookingTime: source.bookingTime,
    numberOfGuests: Number(source.numberOfGuests || 2),
    tableNumbers: Array.isArray(source.tableNumbers) ? source.tableNumbers : [],
    depositAmount: Number(source.depositAmount || source.finalAmount || 0),
    status: 'pending',
  };
};

export const AIChatView: React.FC<AIChatViewProps> = ({
  surface = 'customer',
  title,
  subtitle,
  greeting,
  suggestions,
  placeholder = 'Nhap tin nhan gui toi AI...',
  pageContext = null,
  ownerContext = null,
  adminContext = null,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const scrollViewRef = useRef<ScrollView>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const stopRequestedRef = useRef(false);
  const sendingRef = useRef(false);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([createMessage('assistant', greeting)]);
  const [error, setError] = useState<ChatErrorState | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, error, sending]);

  useEffect(
    () => () => {
      activeAbortControllerRef.current?.abort();
    },
    []
  );

  const updateAssistantMessage = (
    assistantMessageId: string,
    updater: (message: ChatMessage) => ChatMessage
  ) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantMessageId ? updater(message) : message
      )
    );
  };

  const handleOpenRestaurant = (restaurantId?: string | null) => {
    if (!restaurantId) {
      return;
    }

    router.push({
      pathname: '/restaurants/[id]',
      params: { id: restaurantId },
    });
  };

  const runStream = async ({ message, assistantMessageId, history }: RetryPayload) => {
    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;
    stopRequestedRef.current = false;
    sendingRef.current = true;
    setSending(true);
    setError(null);

    let receivedText = false;
    let receivedResult = false;

    try {
      await aiApi.streamChat({
        message,
        history,
        pageContext,
        ownerContext,
        adminContext,
        signal: abortController.signal,
        onEvent: ({ event, data }: AIStreamEventPayload) => {
          if (event === 'delta' && typeof data?.text === 'string') {
            receivedText = receivedText || Boolean(data.text);
            updateAssistantMessage(assistantMessageId, (assistant) => ({
              ...assistant,
              content: `${assistant.content}${data.text}`,
              status: 'streaming',
              toolError: null,
            }));
            return;
          }

          if (event === 'tool_started') {
            updateAssistantMessage(assistantMessageId, (assistant) => ({
              ...assistant,
              status: 'streaming',
              toolStatus: {
                tool: data?.tool,
                label: data?.label || 'Dang tai du lieu...',
                status: 'running',
              },
              toolError: null,
            }));
            return;
          }

          if (event === 'tool_completed') {
            updateAssistantMessage(assistantMessageId, (assistant) => ({
              ...assistant,
              toolStatus: null,
              toolError: null,
            }));
            return;
          }

          if (event === 'result' && data?.result) {
            receivedResult = true;
            const pendingAction = mapPendingAction(data.result);
            updateAssistantMessage(assistantMessageId, (assistant) => ({
              ...assistant,
              results: [...assistant.results, data.result],
              pendingAction: pendingAction || assistant.pendingAction,
              toolError: null,
            }));
            return;
          }

          if (event === 'completed' || event === 'done') {
            updateAssistantMessage(assistantMessageId, (assistant) => ({
              ...assistant,
              status: 'completed',
              toolStatus: null,
            }));
          }
        },
      });

      if (!receivedText && !receivedResult) {
        throw new Error('Tro ly khong tra ve noi dung.');
      }

      updateAssistantMessage(assistantMessageId, (assistant) => ({
        ...assistant,
        status: 'completed',
        toolStatus: null,
      }));
    } catch (requestError: any) {
      const cancelled = stopRequestedRef.current || requestError?.code === 'AI_CANCELLED';
      const status: MessageStatus = cancelled ? 'cancelled' : 'failed';

      updateAssistantMessage(assistantMessageId, (assistant) => ({
        ...assistant,
        status,
        toolStatus: null,
        content: assistant.content || getFallbackText(status),
      }));

      if (!cancelled) {
        setError({
          code: requestError?.code || requestError?.errorCode,
          message: getAIChatErrorMessage(requestError, surface),
          retry: isNonRetryableAIError(requestError)
            ? null
            : { message, assistantMessageId, history },
        });
      }
    } finally {
      if (activeAbortControllerRef.current === abortController) {
        activeAbortControllerRef.current = null;
      }

      sendingRef.current = false;
      setSending(false);
    }
  };

  const requestAssistant = (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || sending || sendingRef.current) {
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      setError({
        code: 'INVALID_REQUEST',
        message: `Tin nhan khong duoc vuot qua ${MAX_MESSAGE_LENGTH} ky tu.`,
        retry: null,
      });
      return;
    }

    const history = buildRecentHistory(messages);
    const userMessage = createMessage('user', message);
    const assistantMessage = createMessage('assistant', '', 'streaming');

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setDraft('');
    setError(null);

    runStream({
      message,
      assistantMessageId: assistantMessage.id,
      history,
    });
  };

  const retryStream = () => {
    if (!error?.retry || sending || sendingRef.current) {
      return;
    }

    const retry = error.retry;
    setError(null);
    updateAssistantMessage(retry.assistantMessageId, (assistant) => ({
      ...assistant,
      content: '',
      status: 'streaming',
      results: [],
      pendingAction: undefined,
      toolStatus: null,
      toolError: null,
    }));
    runStream(retry);
  };

  const stopStream = () => {
    stopRequestedRef.current = true;
    activeAbortControllerRef.current?.abort();
  };

  const handleConfirmAction = async (messageId: string, actionId: string) => {
    try {
      const res = await aiApi.confirmPendingAction(actionId);

      if (!res.success) {
        showToast(res.message || 'Xac nhan that bai', 'error');
        return;
      }

      showToast('Xac nhan dat ban thanh cong!', 'success');
      updateAssistantMessage(messageId, (assistant) => ({
        ...assistant,
        content: `${assistant.content}\n\nDat ban cua ban da duoc xac nhan thanh cong!`.trim(),
        pendingAction: assistant.pendingAction
          ? { ...assistant.pendingAction, status: 'confirmed' }
          : assistant.pendingAction,
      }));

      const booking = res.data?.booking || res.data;
      if (booking?.id) {
        router.push({
          pathname: '/booking/[id]',
          params: { id: String(booking.id) },
        });
      }
    } catch (confirmError: any) {
      const message =
        confirmError?.response?.data?.message ||
        'Co loi xay ra khi xac nhan dat ban.';
      showToast(message, 'error');
    }
  };

  const handleCancelAction = async (messageId: string, actionId: string) => {
    try {
      const res = await aiApi.cancelPendingAction(actionId, 'Nguoi dung huy tren chatbot');

      if (!res.success) {
        showToast(res.message || 'Huy yeu cau that bai', 'error');
        return;
      }

      showToast('Da huy yeu cau giu ban.', 'info');
      updateAssistantMessage(messageId, (assistant) => ({
        ...assistant,
        content: `${assistant.content}\n\nYeu cau dat ban nay da bi huy bo.`.trim(),
        pendingAction: assistant.pendingAction
          ? { ...assistant.pendingAction, status: 'cancelled' }
          : assistant.pendingAction,
      }));
    } catch {
      showToast('Khong the huy bo yeu cau giu ban luc nay.', 'error');
    }
  };

  const showSuggestions = messages.length === 1 && !sending;

  const renderRestaurantCard = (restaurant: any, key: string) => {
    const restaurantId =
      restaurant?.id || restaurant?.restaurantId || restaurant?.metadata?.restaurantId || null;
    const imageUri =
      restaurant?.image ||
      restaurant?.coverImageUrl ||
      restaurant?.coverImage ||
      restaurant?.primaryImage ||
      restaurant?.logo ||
      null;
    const cuisineText = Array.isArray(restaurant?.cuisineTypes)
      ? restaurant.cuisineTypes.filter(Boolean).slice(0, 2).join(' • ')
      : restaurant?.cuisineType || null;
    const ratingValue =
      typeof restaurant?.ratingAverage === 'number'
        ? restaurant.ratingAverage
        : typeof restaurant?.averageRating === 'number'
          ? restaurant.averageRating
          : null;
    const ratingText =
      typeof ratingValue === 'number' && ratingValue > 0 ? ratingValue.toFixed(1) : null;
    const priceText =
      typeof restaurant?.averagePrice === 'number'
        ? formatCurrency(restaurant.averagePrice)
        : restaurant?.priceRange || null;
    const summaryText =
      restaurant?.description ||
      (Array.isArray(restaurant?.reasons) ? restaurant.reasons.join(' • ') : null);

    return (
      <Pressable
        key={key}
        style={styles.resultCard}
        onPress={() => handleOpenRestaurant(restaurantId)}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.resultImage} resizeMode="cover" />
        ) : (
          <View style={[styles.resultImage, styles.resultImageFallback]}>
            <FontAwesome name="cutlery" size={18} color={T.color.primary} />
          </View>
        )}

        <View style={styles.resultBody}>
          <View style={styles.resultHeaderRow}>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {restaurant?.name || 'Nha hang'}
            </Text>
            {ratingText ? (
              <View style={styles.resultRating}>
                <FontAwesome name="star" size={11} color={T.color.primary} />
                <Text style={styles.resultRatingText}>{ratingText}</Text>
              </View>
            ) : null}
          </View>

          {cuisineText ? (
            <Text style={styles.resultMetaText} numberOfLines={1}>
              {cuisineText}
            </Text>
          ) : null}

          {summaryText ? (
            <Text style={styles.resultDescription} numberOfLines={2}>
              {summaryText}
            </Text>
          ) : null}

          <View style={styles.resultFooterRow}>
            {priceText ? <Text style={styles.resultPrice}>{priceText}</Text> : <View />}
            <Text style={styles.resultLinkText}>Xem chi tiet</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderResultBlock = (result: AIResult, messageId: string, index: number) => {
    const key = `${messageId}-result-${index}`;

    if (result?.type === 'restaurant_list') {
      const restaurants = Array.isArray(result?.payload?.restaurants)
        ? result.payload.restaurants
        : [];

      if (restaurants.length === 0) {
        return (
          <View key={key} style={styles.emptyResultBox}>
            <Text style={styles.emptyResultText}>Khong tim thay nha hang phu hop.</Text>
          </View>
        );
      }

      return (
        <View key={key} style={styles.resultGroup}>
          {restaurants.map((restaurant: any, itemIndex: number) =>
            renderRestaurantCard(restaurant, `${key}-restaurant-${itemIndex}`))}
        </View>
      );
    }

    if (result?.type === 'personalized_recommendations') {
      const items = Array.isArray(result?.payload?.items) ? result.payload.items : [];

      return (
        <View key={key} style={styles.resultGroup}>
          <View style={styles.resultInfoBox}>
            <Text style={styles.resultInfoTitle}>Goi y cho ban</Text>
            <Text style={styles.resultInfoText}>
              {result?.payload?.message || 'Day la mot vai lua chon phu hop tu BookEat.'}
            </Text>
          </View>

          {items.length > 0 ? (
            items.map((item: any, itemIndex: number) =>
              renderRestaurantCard(item, `${key}-recommendation-${itemIndex}`))
          ) : (
            <View style={styles.emptyResultBox}>
              <Text style={styles.emptyResultText}>
                Chua tim thay lua chon phu hop ngay luc nay. Thu them khu vuc, mon an hoac muc gia cu the hon.
              </Text>
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.botProfile}>
          <View style={styles.botAvatar}>
            <FontAwesome name="android" size={18} color="#0C0F16" />
          </View>
          <View>
            <Text style={styles.botName}>{title}</Text>
            <Text style={styles.statusText}>{subtitle}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((item) => {
          const isUser = item.role === 'user';
          const shouldShowBubble =
            Boolean(item.content) ||
            item.status === 'streaming' ||
            item.status === 'failed' ||
            item.status === 'cancelled';

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

              <View style={styles.messageColumn}>
                {shouldShowBubble && (
                  <View
                    style={[
                      styles.bubble,
                      isUser ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    {item.status === 'streaming' && !item.content ? (
                      <View style={styles.streamingRow}>
                        <ActivityIndicator size="small" color={T.color.primary} />
                        <Text style={styles.streamingText}>Dang phan hoi...</Text>
                      </View>
                    ) : (
                      <Text style={styles.messageText}>{item.content}</Text>
                    )}

                    {item.content && (item.status === 'failed' || item.status === 'cancelled') && (
                      <Text
                        style={[
                          styles.messageState,
                          item.status === 'failed'
                            ? styles.messageStateError
                            : styles.messageStateMuted,
                        ]}
                      >
                        {item.status === 'failed' ? 'Phan hoi bi gian doan' : 'Da dung'}
                      </Text>
                    )}
                  </View>
                )}

                {item.toolStatus && (
                  <View style={styles.toolIndicator}>
                    <ActivityIndicator
                      size="small"
                      color={T.color.primary}
                      style={styles.toolSpinner}
                    />
                    <Text style={styles.toolIndicatorText}>{item.toolStatus.label}</Text>
                  </View>
                )}

                {item.toolError && (
                  <View style={styles.toolErrorBox}>
                    <Text style={styles.toolErrorText}>{item.toolError}</Text>
                  </View>
                )}

                {item.pendingAction && (
                  <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                      <FontAwesome name="calendar-check-o" size={16} color={T.color.primary} />
                      <Text style={styles.previewTitle}>Xac nhan dat ban cua ban</Text>
                    </View>

                    <Text style={styles.previewRestName}>{item.pendingAction.restaurantName}</Text>

                    <View style={styles.previewDetails}>
                      <Text style={styles.previewDetailText}>
                        Ngay: {formatDate(item.pendingAction.bookingDate)}
                      </Text>
                      <Text style={styles.previewDetailText}>
                        Gio: {item.pendingAction.bookingTime}
                      </Text>
                      <Text style={styles.previewDetailText}>
                        So khach: {item.pendingAction.numberOfGuests} nguoi
                      </Text>
                      {item.pendingAction.tableNumbers.length > 0 && (
                        <Text style={styles.previewDetailText}>
                          Ban: {item.pendingAction.tableNumbers.join(', ')}
                        </Text>
                      )}
                      <Text style={styles.previewDetailText}>
                        Tien coc:{' '}
                        <Text style={styles.previewDepositText}>
                          {formatCurrency(item.pendingAction.depositAmount)}
                        </Text>
                      </Text>
                    </View>

                    {item.pendingAction.status === 'pending' ? (
                      <View style={styles.previewActions}>
                        <Pressable
                          onPress={() => handleCancelAction(item.id, item.pendingAction!.id)}
                          style={[styles.actionBtn, styles.actionCancelBtn]}
                        >
                          <Text style={styles.actionCancelText}>Huy bo</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleConfirmAction(item.id, item.pendingAction!.id)}
                          style={[styles.actionBtn, styles.actionConfirmBtn]}
                        >
                          <Text style={styles.actionConfirmText}>Xac nhan ngay</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.statusBox}>
                        <Text
                          style={[
                            styles.statusLabelText,
                            item.pendingAction.status === 'confirmed'
                              ? styles.statusLabelSuccess
                              : styles.statusLabelMuted,
                          ]}
                        >
                          {item.pendingAction.status === 'confirmed'
                            ? 'DA XAC NHAN'
                            : 'DA HUY BO'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {item.results.length > 0 && (
                  <View style={styles.resultsStack}>
                    {item.results.map((result, index) =>
                      renderResultBlock(result, item.id, index))}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Co su co voi tro ly AI</Text>
            <Text style={styles.errorText}>{error.message}</Text>
            {error.retry && (
              <Pressable style={styles.retryBtn} onPress={retryStream}>
                <FontAwesome name="refresh" size={14} color={T.color.primary} />
                <Text style={styles.retryText}>Thu lai</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      {showSuggestions && (
        <View style={styles.chipsContainer}>
          <Text style={styles.chipsTitle}>Goi y nhanh:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsList}
          >
            {suggestions.map((suggestion) => (
              <Chip
                key={suggestion}
                label={suggestion}
                active={false}
                onPress={() => requestAssistant(suggestion)}
                style={styles.suggestChip}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={T.color.placeholder}
          value={draft}
          onChangeText={(value) => {
            setDraft(value);
            if (!error?.retry) {
              setError(null);
            }
          }}
          onSubmitEditing={() => requestAssistant(draft)}
          editable={!sending}
          maxLength={MAX_MESSAGE_LENGTH}
        />

        {sending ? (
          <Pressable style={[styles.sendBtn, styles.stopBtn]} onPress={stopStream}>
            <FontAwesome name="stop" size={12} color={T.color.error} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => requestAssistant(draft)}
            style={[
              styles.sendBtn,
              (!draft.trim() || sending) && styles.sendBtnDisabled,
            ]}
            disabled={!draft.trim() || sending}
          >
            <FontAwesome name="paper-plane" size={14} color="#0C0F16" />
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

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
    color: T.color.text1,
    fontSize: 14,
    fontWeight: '700',
  },
  statusText: {
    color: T.color.text3,
    fontSize: 11,
    marginTop: 2,
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
  messageColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: T.radius.lg,
    paddingHorizontal: T.space.md,
    paddingVertical: T.space.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
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
    color: T.color.text1,
    fontSize: 13,
    lineHeight: 19,
  },
  streamingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streamingText: {
    color: T.color.text2,
    fontSize: 12,
  },
  messageState: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  messageStateError: {
    color: T.color.error,
  },
  messageStateMuted: {
    color: T.color.text3,
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
    marginTop: T.space.sm,
  },
  toolSpinner: {
    marginRight: 8,
  },
  toolIndicatorText: {
    color: T.color.text3,
    fontSize: 12,
  },
  toolErrorBox: {
    maxWidth: '85%',
    marginTop: T.space.sm,
    padding: T.space.sm,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  toolErrorText: {
    color: T.color.error,
    fontSize: 12,
    lineHeight: 18,
  },
  resultsStack: {
    width: '100%',
    gap: T.space.sm,
    marginTop: T.space.sm,
  },
  resultGroup: {
    width: '100%',
    gap: T.space.sm,
  },
  resultInfoBox: {
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.18)',
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
    padding: T.space.md,
  },
  resultInfoTitle: {
    color: T.color.primary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultInfoText: {
    color: T.color.text2,
    fontSize: 13,
    lineHeight: 19,
  },
  resultCard: {
    width: '100%',
    backgroundColor: T.color.card,
    borderRadius: T.radius.xl,
    borderWidth: 1,
    borderColor: T.color.border,
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: 132,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  resultImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBody: {
    padding: T.space.md,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: T.space.sm,
  },
  resultTitle: {
    flex: 1,
    color: T.color.text1,
    fontSize: 15,
    fontWeight: '700',
  },
  resultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultRatingText: {
    color: T.color.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  resultMetaText: {
    color: T.color.text3,
    fontSize: 12,
    marginTop: 4,
  },
  resultDescription: {
    color: T.color.text2,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  resultFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  resultPrice: {
    color: T.color.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  resultLinkText: {
    color: T.color.text1,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyResultBox: {
    width: '100%',
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: T.space.md,
  },
  emptyResultText: {
    color: T.color.text3,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  previewCard: {
    width: 280,
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
    color: T.color.text1,
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
  previewDepositText: {
    color: T.color.primary,
    fontWeight: '700',
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
  statusLabelSuccess: {
    color: T.color.success,
  },
  statusLabelMuted: {
    color: T.color.text3,
  },
  errorCard: {
    marginTop: T.space.sm,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.18)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    padding: T.space.md,
  },
  errorTitle: {
    color: T.color.text1,
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    color: T.color.error,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: T.space.sm,
    paddingHorizontal: T.space.sm,
    paddingVertical: 6,
    borderRadius: T.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(212, 150, 83, 0.25)',
    backgroundColor: 'rgba(212, 150, 83, 0.08)',
  },
  retryText: {
    color: T.color.primary,
    fontSize: 12,
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
    backgroundColor: T.color.bg,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: T.color.card,
    borderRadius: T.radius.full,
    borderWidth: 1,
    borderColor: T.color.border,
    paddingHorizontal: T.space.md,
    color: T.color.text1,
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
  stopBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  sendBtnDisabled: {
    backgroundColor: '#3A4255',
    opacity: 0.5,
  },
});

export default AIChatView;
