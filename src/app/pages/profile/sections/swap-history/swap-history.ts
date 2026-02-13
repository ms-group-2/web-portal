import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-swap-history',
  imports: [ RouterModule, MatIconModule],
  templateUrl: './swap-history.html',
  styleUrl: './swap-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapHistoryComponent {}

