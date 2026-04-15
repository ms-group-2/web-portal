import { Component, ChangeDetectionStrategy, signal, output, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { BOOKING_CATEGORIES } from '../../booking.mock-data';

@Component({
  selector: 'app-booking-category-bar',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './booking-category-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingCategoryBar {
  categories = BOOKING_CATEGORIES;
  selectedCategory = model<string>('booking.categories.all');

  selectCategory(nameKey: string) {
    this.selectedCategory.set(nameKey);
  }
}
