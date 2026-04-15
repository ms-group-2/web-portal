import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';

@Component({
  selector: 'app-trust-section',
  imports: [MatIconModule, TranslatePipe, ScrollAnimateDirective],
  templateUrl: './trust-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrustSectionComponent {}
