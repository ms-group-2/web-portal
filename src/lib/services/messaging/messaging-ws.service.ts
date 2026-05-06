import { Injectable, inject, signal, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenManagementService } from '../identity/token-management.service';
import { WsIncomingEvent } from './models/messaging.model';

@Injectable({ providedIn: 'root' })
export class MessagingWsService {
  private zone = inject(NgZone);
  private tokens = inject(TokenManagementService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private ws: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private typingThrottles = new Map<string, number>();

  connected = signal(false);
  lastEvent = signal<WsIncomingEvent | null>(null);
  events$ = new Subject<WsIncomingEvent>();

  connect(): void {
    if (!this.isBrowser || this.ws) return;

    const token = this.tokens.accessToken();
    if (!token) {
      setTimeout(() => this.connect(), 1000);
      return;
    }

    const wsBase = environment.apiBaseUrl
      .replace(/^https:/, 'wss:')
      .replace(/^http:/, 'ws:');

    this.zone.runOutsideAngular(() => {
      this.ws = new WebSocket(`${wsBase}/swap/listing/chat/ws?token=${token}`);

      this.ws.onopen = () => {
        this.zone.run(() => {
          this.connected.set(true);
          this.reconnectAttempt = 0;
          console.log('[WS] Connected');
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WsIncomingEvent;
          this.zone.run(() => {
            this.lastEvent.set(data);
            this.events$.next(data);
          });
        } catch { /* ignore malformed frames */ }
      };

      this.ws.onclose = (e) => {
        this.ws = null;
        this.zone.run(() => this.connected.set(false));
        console.log('[WS] Closed:', e.code, e.reason);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempt = 0;
    this.ws?.close();
    this.ws = null;
    this.connected.set(false);
  }

  sendMessage(conversationId: string, content: string): void {
    this.send({ type: 'send_message', conversation_id: conversationId, content });
  }

  markRead(conversationId: string): void {
    this.send({ type: 'mark_read', conversation_id: conversationId });
  }

  sendTyping(conversationId: string): void {
    const now = Date.now();
    const lastSent = this.typingThrottles.get(conversationId) ?? 0;
    if (now - lastSent < 3000) return;
    this.typingThrottles.set(conversationId, now);
    this.send({ type: 'typing', conversation_id: conversationId });
  }

  private send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private scheduleReconnect(): void {
    if (!this.isBrowser) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), 30_000);
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}
