import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-booking-history',
  imports: [ RouterModule, MatIconModule],
  templateUrl: './booking-history.html',
  styleUrl: './booking-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingHistoryComponent {}

