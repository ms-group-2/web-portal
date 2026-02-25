import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-trust-section',
  imports: [CommonModule, MatIconModule],
  templateUrl: './trust-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrustSectionComponent {}
