import { Component, ChangeDetectionStrategy, output, input } from '@angular/core';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './delete-confirmation-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfirmationDialog {
  isOpen = input<boolean>(false);
  title = input<string>('');
  message = input<string>('');

  onConfirm = output<void>();
  onCancel = output<void>();
}
