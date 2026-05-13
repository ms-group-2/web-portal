import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SpinnerComponent } from '../lib/components/spinner/spinner.component';
import { ChatWidget } from '../lib/components/chat-widget/chat-widget';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpinnerComponent, ChatWidget],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly router = inject(Router);
  protected readonly title = signal('vipo-web-app');
  readonly showFloatingChat = signal(true);

  constructor() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.updateFloatingChatVisibility());

    this.updateFloatingChatVisibility();
  }

  private updateFloatingChatVisibility(): void {
    const url = this.router.url.split('?')[0];
    this.showFloatingChat.set(url !== '/landing');
  }
}
