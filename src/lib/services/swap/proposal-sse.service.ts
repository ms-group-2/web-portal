import { Injectable, NgZone, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TokenManagementService } from '../identity/token-management.service';

export interface SseItemEvent {
  temp_path: string;
}

@Injectable({ providedIn: 'root' })
export class ProposalSseService {
  private zone = inject(NgZone);
  private tokenService = inject(TokenManagementService);

  private abortController: AbortController | null = null;
  private baseUrl = `${environment.apiBaseUrl}/swap/listing`;

  private _items = signal<SseItemEvent[]>([]);
  private _connected = signal(false);
  private _error = signal(false);

  items = this._items.asReadonly();
  connected = this._connected.asReadonly();
  error = this._error.asReadonly();

  async connect(sessionId: string): Promise<void> {
    this.disconnect();
    this.abortController = new AbortController();

    const token = this.tokenService.accessToken();
    const url = `${this.baseUrl}/proposals/session/${sessionId}/events`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        this.zone.run(() => this._error.set(true));
        return;
      }

      this.zone.run(() => {
        this._connected.set(true);
        this._error.set(false);
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
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
            const parsed = JSON.parse(line.slice(6)) as SseItemEvent;
            if (parsed.temp_path) {
              this.zone.run(() => {
                this._items.update(items => [...items, parsed]);
              });
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        this.zone.run(() => this._error.set(true));
      }
    } finally {
      this.zone.run(() => this._connected.set(false));
    }
  }

  disconnect(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  removeItem(tempPath: string): void {
    this._items.update(items => items.filter(i => i.temp_path !== tempPath));
  }

  reset(): void {
    this.disconnect();
    this._items.set([]);
    this._connected.set(false);
    this._error.set(false);
  }
}
