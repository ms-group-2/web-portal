import { Injectable, signal } from '@angular/core';
import { HttpRequest } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class SpinnerHandlerService {
  private activeRequests = new Set<string>();
  isLoading = signal(false);

  onStarted(req: HttpRequest<unknown>): void {
    const requestKey = this.getRequestKey(req);
    this.activeRequests.add(requestKey);
    this.updateLoadingState();
  }

  onFinished(req: HttpRequest<unknown>): void {
    const requestKey = this.getRequestKey(req);
    this.activeRequests.delete(requestKey);
    this.updateLoadingState();
  }

  private getRequestKey(req: HttpRequest<unknown>): string {
    return `${req.method}-${req.urlWithParams}`;
  }

  private updateLoadingState(): void {
    this.isLoading.set(this.activeRequests.size > 0);
  }
}
