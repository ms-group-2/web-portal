import { Injectable, NgZone, inject, signal } from '@angular/core';
import { TranslationService } from '../translation.service';
import { escape } from 'node:querystring';

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private translation = inject(TranslationService);
  private zone = inject(NgZone);

  private readonly baseUrl = 'https://melia-unhelped-selena.ngrok-free.dev/';
  private readonly apiKey = 'intbot-chat-2026'; 
  private sessionId: string | null = null;

  messages = signal<ChatMessage[]>([]);
  isOpen = signal(false);
  isLoading = signal(false);  
  isBusy = signal(false);   

  toggle() {
    this.isOpen.update(v => !v);
  }

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  async sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || this.isBusy()) return;

    this.messages.update(msgs => [
      ...msgs,
      { role: 'user', text: trimmed, timestamp: new Date() },
    ]);

    this.isLoading.set(true);
    this.isBusy.set(true);

    // Add an empty bot message that we'll stream into
    this.messages.update(msgs => [
      ...msgs,
      { role: 'bot', text: '', timestamp: new Date() },
    ]);

    try {
      const response = await fetch(`${this.baseUrl}api/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          message: trimmed,
          session_id: this.sessionId,
          language: this.translation.getCurrentLanguage(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.session_id) this.sessionId = parsed.session_id;
            if (!parsed.token || parsed.done) continue;

            this.zone.run(() => {
              if (this.isLoading()) this.isLoading.set(false);
              this.messages.update(msgs => {
                const updated = [...msgs];
                const last = updated[updated.length - 1];
                if (last.role === 'bot') {
                  updated[updated.length - 1] = { ...last, text: last.text + parsed.token };
                }
                return updated;
              });
            });
          } catch {
          }
        }
      }

      this.zone.run(() => {
        this.isLoading.set(false);
        this.isBusy.set(false);
      });
    } catch (e) {
      console.error('Chat error:', e);
      this.zone.run(() => {
        this.messages.update(msgs => {
          const updated = [...msgs];
          const last = updated[updated.length - 1];
          if (last.role === 'bot' && !last.text) {
            updated[updated.length - 1] = {
              ...last,
              text: 'Something went wrong. Please try again.',
            };
          }
          return updated;
        });
        this.isLoading.set(false);
        this.isBusy.set(false);
      });
    }
  }

  clearMessages() {
    this.messages.set([]);
    this.sessionId = null;
  }
}
