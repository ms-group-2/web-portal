import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-bottom-sheet',
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="bottom-sheet-backdrop" (click)="closed.emit()"></div>
      <div class="bottom-sheet" [ngClass]="{ 'bottom-sheet--small': size() === 'small' }">
        <div class="bottom-sheet-handle-wrapper">
          <div class="bottom-sheet-handle"></div>
        </div>
        <ng-content select="[header]"></ng-content>
        <div class="bottom-sheet-body">
          <ng-content select="[body]"></ng-content>
        </div>
        <ng-content select="[footer]"></ng-content>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }

    .bottom-sheet-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      z-index: 999;
      animation: bsFadeIn 0.25s ease;
    }

    .bottom-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: #fff;
      border-radius: 20px 20px 0 0;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      animation: bsSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
      box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.12);

      &--small {
        max-height: 50vh;
      }
    }

    .bottom-sheet-handle-wrapper {
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      padding-top: 10px;
    }

    .bottom-sheet-handle {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: #d1d5db;
    }

    .bottom-sheet-body {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    @media (min-width: 1024px) {
      .bottom-sheet-backdrop,
      .bottom-sheet {
        display: none;
      }
    }

    @keyframes bsSlideUp {
      from { transform: translateY(100%); }
      to   { transform: translateY(0); }
    }

    @keyframes bsFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `],
})
export class BottomSheet {
  readonly open = input.required<boolean>();
  readonly size = input<'default' | 'small'>('default');
  readonly closed = output<void>();
}
