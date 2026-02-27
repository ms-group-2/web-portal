import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div
      class="flex items-center justify-center spinner-wrapper"
      [class.py-12]="size() === 'large'"
      [class.py-8]="size() === 'small'"
      [style.--spinner-color]="color() || 'var(--mdc-theme-primary, #6200ee)'">
      <mat-spinner [diameter]="size() === 'large' ? 48 : 32"></mat-spinner>
    </div>
  `,
  styles: [`
    ::ng-deep .spinner-wrapper .mdc-circular-progress__determinate-circle,
    ::ng-deep .spinner-wrapper .mdc-circular-progress__indeterminate-circle-graphic {
      stroke: var(--spinner-color) !important;
    }
  `]
})
export class LoadingSpinner {
  size = input<'small' | 'large'>('large');
  color = input<string>('');
}
