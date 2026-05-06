import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConversationPreview,
  ConversationListResponse,
  MessageListResponse,
  MessageResponse,
  UnreadCountResponse,
} from './models/messaging.model';

@Injectable({ providedIn: 'root' })
export class MessagingApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/swap/listing/chat`;
  private headers = { 'ngrok-skip-browser-warning': 'true' };

  startConversation(otherUserId: string): Observable<ConversationPreview> {
    return this.http.post<ConversationPreview>(
      `${this.baseUrl}/conversations`,
      { other_user_id: otherUserId },
      { headers: this.headers },
    );
  }

  getConversations(page = 1, limit = 20): Observable<ConversationListResponse> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ConversationListResponse>(
      `${this.baseUrl}/conversations`,
      { params, headers: this.headers },
    );
  }

  getMessages(conversationId: string, page = 1, limit = 50): Observable<MessageListResponse> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<MessageListResponse>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { params, headers: this.headers },
    );
  }

  sendMessage(conversationId: string, content: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { content },
      { headers: this.headers },
    );
  }

  markRead(conversationId: string): Observable<unknown> {
    return this.http.post(
      `${this.baseUrl}/conversations/${conversationId}/read`,
      null,
      { headers: this.headers },
    );
  }

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(
      `${this.baseUrl}/unread-count`,
      { headers: this.headers },
    );
  }
}
