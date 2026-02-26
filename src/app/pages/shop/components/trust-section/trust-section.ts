import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-trust-section',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './trust-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrustSectionComponent {}
