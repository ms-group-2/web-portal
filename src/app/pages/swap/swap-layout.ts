import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-swap-layout',
  imports: [RouterOutlet, MatIconModule, TranslatePipe],
  template: `
    <router-outlet />
    <button
      type="button"
      class="fixed bottom-9 right-9 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-swap text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
      [attr.aria-label]="'swap.chat.ariaLabel' | translate"
      (click)="openSupportChat()">
      <mat-icon class="!text-3xl !h-10 !w-10">chat</mat-icon>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapLayout {
  openSupportChat() {
    window.location.href = 'mailto:vipo.support@gmail.com';
  }
}
