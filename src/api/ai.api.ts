import { apiClient } from './client';
import { getToken } from '../auth/token';

export const aiApi = {
  // Get API Base Url
  getApiUrl() {
    return apiClient.defaults.baseURL || 'http://localhost:3001/api/v1';
  },

  // Get Pending Action details
  async getPendingAction(id: string) {
    const res = await apiClient.get(`/ai/pending-actions/${id}`);
    return res.data;
  },

  // Confirm Pending Action (finalize booking)
  async confirmPendingAction(id: string) {
    const res = await apiClient.post(`/ai/pending-actions/${id}/confirm`, {
      confirmation: true,
    });
    return res.data;
  },

  // Cancel Pending Action
  async cancelPendingAction(id: string, reason?: string) {
    const res = await apiClient.post(`/ai/pending-actions/${id}/cancel`, {
      reason,
    });
    return res.data;
  },

  // Call mock chatbot response if streaming is disabled or not available
  async mockChat(message: string) {
    const res = await apiClient.post('/ai/mock-chat', { message });
    return res.data;
  },

  // SSE Stream Chat Client for Expo / React Native
  async streamChat(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    pageContext: any,
    onChunk: (text: string) => void,
    onToolStart: (toolName: string, label: string) => void,
    onToolComplete: (toolName: string, status: string, data?: any) => void,
    onError: (err: any) => void,
    onDone: () => void
  ) {
    const token = await getToken();
    const url = `${this.getApiUrl()}/ai/chat/stream`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          message,
          history,
          pageContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if body is readable
      if (!response.body) {
        // Fallback: if stream is not supported in the current JS engine, read it all as text
        const text = await response.text();
        // Parse mock lines
        this.parseSseText(text, onChunk, onToolStart, onToolComplete, onDone);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep the last partial line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') {
              continue;
            }
            try {
              const parsed = JSON.parse(dataStr);
              this.handleSseEvent(parsed, onChunk, onToolStart, onToolComplete);
            } catch (e) {
              // Ignore line parse errors
            }
          }
        }
      }

      // Parse remaining buffer
      if (buffer.trim()) {
        if (buffer.trim().startsWith('data:')) {
          try {
            const parsed = JSON.parse(buffer.slice(5).trim());
            this.handleSseEvent(parsed, onChunk, onToolStart, onToolComplete);
          } catch (e) {}
        }
      }

      onDone();
    } catch (error) {
      onError(error);
    }
  },

  // Parse bulk text block for SSE events
  parseSseText(
    text: string,
    onChunk: (text: string) => void,
    onToolStart: (toolName: string, label: string) => void,
    onToolComplete: (toolName: string, status: string, data?: any) => void,
    onDone: () => void
  ) {
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(dataStr);
          this.handleSseEvent(parsed, onChunk, onToolStart, onToolComplete);
        } catch (e) {}
      }
    }
    onDone();
  },

  // Router for parsing parsed JSON SSE packages
  handleSseEvent(
    event: any,
    onChunk: (text: string) => void,
    onToolStart: (toolName: string, label: string) => void,
    onToolComplete: (toolName: string, status: string, data?: any) => void
  ) {
    if (event.text) {
      onChunk(event.text);
    } else if (event.delta) {
      onChunk(event.delta);
    } else if (event.type === 'delta') {
      onChunk(event.text || '');
    } else if (event.tool || event.type === 'tool_started') {
      const toolName = event.tool || event.label || 'Tool';
      const label = event.label || 'Đang thực hiện...';
      onToolStart(toolName, label);
    } else if (event.type === 'tool_completed') {
      onToolComplete(event.tool, event.status, event.result || event);
    } else if (event.result) {
      onToolComplete(event.tool || 'result', 'success', event.result);
    }
  },
};
