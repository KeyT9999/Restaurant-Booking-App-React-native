import { apiClient } from './client';
import { getToken } from '../auth/token';

const DEFAULT_STREAM_TIMEOUT_MS = 45000;

export class AIStreamError extends Error {
  code: string;
  status?: number;
  retryable: boolean;

  constructor(
    message: string,
    {
      code = 'AI_UNAVAILABLE',
      status,
      retryable = true,
    }: {
      code?: string;
      status?: number;
      retryable?: boolean;
    } = {}
  ) {
    super(message);
    this.name = 'AIStreamError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export type AIChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

export type AIStreamEventName =
  | 'start'
  | 'delta'
  | 'completed'
  | 'tool_started'
  | 'tool_completed'
  | 'result'
  | 'error'
  | 'done'
  | 'message';

export type AIStreamEventPayload = {
  event: AIStreamEventName;
  data: any;
};

type AIStreamOptions = {
  message: string;
  history?: AIChatHistoryItem[];
  pageContext?: Record<string, unknown> | null;
  ownerContext?: Record<string, unknown> | null;
  adminContext?: Record<string, unknown> | null;
  signal?: AbortSignal;
  timeoutMs?: number;
  onEvent?: (payload: AIStreamEventPayload) => void;
};

const parseEventBlock = (block: string): AIStreamEventPayload | null => {
  let event: AIStreamEventName = 'message';
  const dataLines: string[] = [];

  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim() as AIStreamEventName;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  try {
    return {
      event,
      data: JSON.parse(dataLines.join('\n')),
    };
  } catch {
    throw new AIStreamError('Du lieu phan hoi tu tro ly khong hop le.', {
      code: 'AI_STREAM_INVALID',
      retryable: false,
    });
  }
};

const createSseParser = (onEvent: (payload: AIStreamEventPayload) => void) => {
  let buffer = '';

  const flushBlocks = (flushRemainder = false) => {
    const normalized = buffer.replace(/\r\n/g, '\n');
    const blocks = normalized.split('\n\n');
    buffer = flushRemainder ? '' : blocks.pop() || '';

    const completeBlocks = flushRemainder ? blocks.filter(Boolean) : blocks;
    for (const block of completeBlocks) {
      const parsed = parseEventBlock(block);
      if (parsed) {
        onEvent(parsed);
      }
    }

    if (flushRemainder && buffer.trim()) {
      const parsed = parseEventBlock(buffer);
      if (parsed) {
        onEvent(parsed);
      }
      buffer = '';
    }
  };

  return {
    feed(chunk: string) {
      buffer += chunk;
      flushBlocks(false);
    },
    end() {
      if (buffer.trim()) {
        const parsed = parseEventBlock(buffer.replace(/\r\n/g, '\n'));
        if (parsed) {
          onEvent(parsed);
        }
      }

      buffer = '';
    },
  };
};

const readHttpError = async (response: Response) => {
  let payload: any = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  throw new AIStreamError(payload?.message || 'Khong the ket noi voi Tro ly BookEat.', {
    code: payload?.code || 'AI_UNAVAILABLE',
    status: response.status,
    retryable: ![400, 401, 403].includes(response.status),
  });
};

export const aiApi = {
  getApiUrl() {
    return apiClient.defaults.baseURL || 'http://localhost:3001/api/v1';
  },

  async getPendingAction(id: string) {
    const res = await apiClient.get(`/ai/pending-actions/${id}`);
    return res.data;
  },

  async confirmPendingAction(id: string) {
    const res = await apiClient.post(`/ai/pending-actions/${id}/confirm`, {
      confirmation: true,
    });
    return res.data;
  },

  async cancelPendingAction(id: string, reason?: string) {
    const res = await apiClient.post(`/ai/pending-actions/${id}/cancel`, {
      reason,
    });
    return res.data;
  },

  async mockChat(message: string) {
    const res = await apiClient.post('/ai/mock-chat', { message });
    return res.data;
  },

  async streamChat({
    message,
    history = [],
    pageContext = null,
    ownerContext = null,
    adminContext = null,
    signal,
    timeoutMs = DEFAULT_STREAM_TIMEOUT_MS,
    onEvent = () => {},
  }: AIStreamOptions) {
    const token = await getToken();
    const url = `${this.getApiUrl()}/ai/chat/stream`;
    const requestController = new AbortController();
    let timedOut = false;
    let receivedDone = false;
    let streamError: AIStreamError | null = null;

    const abortFromCaller = () => requestController.abort(signal?.reason);
    if (signal?.aborted) {
      abortFromCaller();
    } else {
      signal?.addEventListener('abort', abortFromCaller, { once: true });
    }

    const timeoutId = globalThis.setTimeout(() => {
      timedOut = true;
      requestController.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          message,
          history,
          ...(pageContext ? { pageContext } : {}),
          ...(ownerContext ? { ownerContext } : {}),
          ...(adminContext ? { adminContext } : {}),
        }),
        signal: requestController.signal,
      });

      if (!response.ok) {
        await readHttpError(response);
      }

      const parser = createSseParser((payload) => {
        if (payload.event === 'error') {
          streamError = new AIStreamError(
            payload.data?.message || 'Phan hoi bi gian doan.',
            {
              code: payload.data?.code || 'AI_UNAVAILABLE',
              retryable: payload.data?.retryable !== false,
            }
          );
        }

        if (payload.event === 'done') {
          receivedDone = true;
        }

        onEvent(payload);
      });

      if (!response.body) {
        const text = await response.text();
        parser.feed(text);
        parser.end();
      } else {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }

          parser.feed(decoder.decode(value, { stream: true }));
        }

        parser.feed(decoder.decode());
        parser.end();
      }

      if (streamError) {
        throw streamError;
      }

      if (!receivedDone) {
        throw new AIStreamError('Phan hoi bi ngat giua chung. Vui long thu lai.', {
          code: 'AI_STREAM_INTERRUPTED',
        });
      }
    } catch (error) {
      if (error instanceof AIStreamError) {
        throw error;
      }

      if (timedOut) {
        throw new AIStreamError('Tro ly phan hoi qua lau. Vui long thu lai.', {
          code: 'AI_TIMEOUT',
        });
      }

      if (signal?.aborted || requestController.signal.aborted) {
        throw new AIStreamError('Phan hoi da duoc dung.', {
          code: 'AI_CANCELLED',
          retryable: false,
        });
      }

      throw new AIStreamError('Khong the ket noi voi Tro ly BookEat.', {
        code: 'AI_UNAVAILABLE',
      });
    } finally {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortFromCaller);
    }
  },
};
