import { Injectable, inject, signal, computed, DestroyRef, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { MessagingApiService } from './messaging-api.service';
import { MessagingWsService } from './messaging-ws.service';
import { AuthService } from '../identity/auth.service';
import { SnackbarService } from '../snackbar.service';
import { TranslationService } from '../translation.service';
import {
  ConversationPreview,
  MessageResponse,
  WsIncomingEvent,
} from './models/messaging.model';

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private api = inject(MessagingApiService);
  private ws = inject(MessagingWsService);
  private auth = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private translation = inject(TranslationService);
  private zone = inject(NgZone);
  private destroyRef = inject(DestroyRef);

  conversations = signal<ConversationPreview[]>([]);
  activeConversationId = signal<string | null>(null);
  messages = signal<Map<string, MessageResponse[]>>(new Map());
  typingUsers = signal<Map<string, boolean>>(new Map());
  unreadCount = signal(0);
  loadingConversations = signal(false);
  loadingMessages = signal(false);

  /** Emits after every state change from WS — components subscribe to trigger CD */
  readonly stateChanged$ = new Subject<void>();

  private typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private initConsumers = 0;

  activeMessages = computed(() => {
    const id = this.activeConversationId();
    if (!id) return [];
    return this.messages().get(id) ?? [];
  });

  constructor() {
    this.ws.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.zone.run(() => this.handleWsEvent(event));
      });
  }

  init(): void {
    this.initConsumers++;
    if (this.initConsumers > 1) return;
    this.ws.connect();
    this.loadConversations();
    this.startPolling();
  }

  teardown(): void {
    this.initConsumers = Math.max(0, this.initConsumers - 1);
    if (this.initConsumers > 0) return;
    this.ws.disconnect();
    this.stopPolling();
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      const activeId = this.activeConversationId();
      if (activeId) {
        this.pollMessages(activeId);
      }
    }, 3000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private pollMessages(conversationId: string): void {
    this.api.getMessages(conversationId, 1, 20)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        const incoming = [...res.messages].reverse();
        let changed = false;
        this.messages.update(map => {
          const next = new Map(map);
          const existing = next.get(conversationId) ?? [];
          const existingIds = new Set(existing.filter(m => !m.id.startsWith('temp-')).map(m => m.id));

          let updated = [...existing];

          for (const msg of incoming) {
            if (existingIds.has(msg.id)) {
              const idx = updated.findIndex(m => m.id === msg.id);
              if (idx >= 0 && !updated[idx].is_read && msg.is_read) {
                updated[idx] = { ...updated[idx], is_read: true };
                changed = true;
              }
              continue;
            }

            const tempIdx = updated.findIndex(m =>
              m.id.startsWith('temp-') &&
              m.sender_id === msg.sender_id &&
              m.content === msg.content,
            );
            if (tempIdx >= 0) {
              updated[tempIdx] = msg;
              changed = true;
            } else {
              updated.push(msg);
              changed = true;
            }
          }

          if (!changed) return map;
          next.set(conversationId, updated);
          return next;
        });
        if (changed) this.stateChanged$.next();
      });
  }

  loadConversations(): void {
    this.loadingConversations.set(true);
    this.api.getConversations(1, 50)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.conversations.set(res.conversations);
          this.loadingConversations.set(false);
          this.recalcUnread();
          const activeId = this.activeConversationId();
          if (activeId) this.markAsRead(activeId);
        },
        error: () => this.loadingConversations.set(false),
      });
  }

  loadMessages(conversationId: string, page = 1): void {
    this.loadingMessages.set(true);
    this.api.getMessages(conversationId, page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.messages.update(map => {
            const next = new Map(map);
            const existing = page > 1 ? (next.get(conversationId) ?? []) : [];
            const reversed = [...res.messages].reverse();
            next.set(conversationId, [...reversed, ...existing]);
            return next;
          });
          this.syncConversationUnreadFromMessages(conversationId);
          this.loadingMessages.set(false);
        },
        error: () => this.loadingMessages.set(false),
      });
  }

  openConversation(conversationId: string): void {
    this.activeConversationId.set(conversationId);
    this.loadMessages(conversationId);
    this.markAsRead(conversationId, true);
  }

  closeConversation(): void {
    this.activeConversationId.set(null);
  }

  sendMessage(conversationId: string, content: string): void {
    if (!content.trim()) return;

    const optimistic: MessageResponse = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: this.currentUserId(),
      content: content.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.appendMessage(optimistic);

    if (this.ws.connected()) {
      this.ws.sendMessage(conversationId, content);
    } else {
      this.api.sendMessage(conversationId, content)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  markAsRead(conversationId: string, force = false): void {
    const convo = this.conversations().find(c => c.id === conversationId);
    if (!convo) return;
    const localUnread = this.getLocalUnreadFromOthers(conversationId);
    const hasUnread = Math.max(convo.unread_count, localUnread) > 0;
    if (!force && !hasUnread) return;

    if (this.ws.connected()) {
      this.ws.markRead(conversationId);
    } else {
      this.api.markRead(conversationId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }

    this.conversations.update(list =>
      list.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c),
    );
    this.messages.update(map => {
      const msgs = map.get(conversationId);
      if (!msgs) return map;
      const next = new Map(map);
      next.set(conversationId, msgs.map(m =>
        m.sender_id !== this.currentUserId() ? { ...m, is_read: true } : m,
      ));
      return next;
    });
    this.recalcUnread();
    this.stateChanged$.next();
  }

  sendTyping(conversationId: string): void {
    this.ws.sendTyping(conversationId);
  }

  startConversation(otherUserId: string) {
    return this.api.startConversation(otherUserId);
  }

  private handleWsEvent(event: WsIncomingEvent): void {
    switch (event.type) {
      case 'new_message':
        this.appendMessage(event.message);
        break;
      case 'messages_read':
        this.handleMessagesRead(event.conversation_id);
        break;
      case 'typing':
        if (!('user_id' in event) || event.user_id !== this.currentUserId()) {
          this.handleTyping(event.conversation_id);
        }
        break;
    }
    this.stateChanged$.next();
  }

  private appendMessage(msg: MessageResponse): void {
    this.clearTyping(msg.conversation_id);

    this.messages.update(map => {
      const next = new Map(map);
      const existing = next.get(msg.conversation_id) ?? [];
      if (existing.some(m => m.id === msg.id)) return map;

      const tempIndex = msg.id.startsWith('temp-') ? -1
        : existing.findIndex(m =>
            m.id.startsWith('temp-') &&
            m.sender_id === msg.sender_id &&
            m.content === msg.content,
          );

      if (tempIndex >= 0) {
        const updated = [...existing];
        updated[tempIndex] = msg;
        next.set(msg.conversation_id, updated);
      } else {
        next.set(msg.conversation_id, [...existing, msg]);
      }
      return next;
    });

    const isIncoming = msg.sender_id !== this.currentUserId();
    const isActiveConversation = this.activeConversationId() === msg.conversation_id;

    this.conversations.update(list => {
      const updated = list.map(c =>
        c.id === msg.conversation_id
          ? {
              ...c,
              last_message: msg.content,
              last_message_at: msg.created_at,
              unread_count: isIncoming
                ? (isActiveConversation ? 0 : c.unread_count + 1)
                : c.unread_count,
            }
          : c,
      );
      return updated.sort((a, b) => {
        const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return tb - ta;
      });
    });

    if (isIncoming && isActiveConversation) {
      this.markAsRead(msg.conversation_id, true);
    } else if (isIncoming) {
      this.snackbar.swap(
        this.translation.translate('messaging.newMessageNotification'),
        'chat',
      );
    }

    this.recalcUnread();
  }

  private handleMessagesRead(conversationId: string): void {
    this.messages.update(map => {
      const msgs = map.get(conversationId);
      if (!msgs) return map;
      const next = new Map(map);
      next.set(conversationId, msgs.map(m =>
        m.sender_id === this.currentUserId() ? { ...m, is_read: true } : m,
      ));
      return next;
    });
  }

  private clearTyping(conversationId: string): void {
    const timer = this.typingTimers.get(conversationId);
    if (timer) {
      clearTimeout(timer);
      this.typingTimers.delete(conversationId);
    }
    if (this.typingUsers().has(conversationId)) {
      this.typingUsers.update(map => {
        const next = new Map(map);
        next.delete(conversationId);
        return next;
      });
    }
  }

  private handleTyping(conversationId: string): void {
    this.typingUsers.update(map => {
      const next = new Map(map);
      next.set(conversationId, true);
      return next;
    });

    const existing = this.typingTimers.get(conversationId);
    if (existing) clearTimeout(existing);

    this.typingTimers.set(conversationId, setTimeout(() => {
      this.zone.run(() => {
        this.typingUsers.update(map => {
          const next = new Map(map);
          next.delete(conversationId);
          return next;
        });
        this.stateChanged$.next();
      });
    }, 3000));
  }

  private recalcUnread(): void {
    const total = this.conversations().reduce((sum, c) => sum + c.unread_count, 0);
    this.unreadCount.set(total);
  }

  private syncConversationUnreadFromMessages(conversationId: string): void {
    const unread = this.getLocalUnreadFromOthers(conversationId);
    this.conversations.update(list =>
      list.map(c => c.id === conversationId ? { ...c, unread_count: unread } : c),
    );
    this.recalcUnread();
    this.stateChanged$.next();
  }

  private getLocalUnreadFromOthers(conversationId: string): number {
    const msgs = this.messages().get(conversationId) ?? [];
    const me = this.currentUserId();
    return msgs.filter(m => m.sender_id !== me && !m.is_read).length;
  }

  private currentUserId(): string {
    return this.auth.user()?.id ?? '';
  }
}
