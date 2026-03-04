import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SpinnerHandlerService } from 'lib/services/spinner/spinner-handler.service';

@Component({
  selector: 'app-spinner',
  
  imports: [MatProgressSpinnerModule],
  template: `
    @if (spinnerService.isLoading()) {
      <div class="global-spinner-overlay">
        <mat-spinner diameter="60"></mat-spinner>
      </div>
    }
  `,
  styleUrls: ['../../../lib/themes/material/spinner.scss'],
})
export class SpinnerComponent {
  spinnerService = inject(SpinnerHandlerService);
}
