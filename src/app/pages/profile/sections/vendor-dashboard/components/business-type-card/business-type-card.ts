import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { BusinessTypeOption } from 'lib/models/vendor.models';

@Component({
  selector: 'app-business-type-card',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './business-type-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessTypeCardComponent {
  option = input.required<BusinessTypeOption>();
  selected = input<boolean>(false);
  cardClicked = output<void>();

  onClick() {
    if (!this.option().disabled) {
      this.cardClicked.emit();
    }
  }
}
