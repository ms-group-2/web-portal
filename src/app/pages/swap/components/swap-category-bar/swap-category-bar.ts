import { Component, ChangeDetectionStrategy, inject, model, signal, OnInit, DestroyRef } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { SwapCategory, SwapListingApiService } from 'lib/services/swap';

@Component({
  selector: 'app-swap-category-bar',
  imports: [NgClass, MatIconModule, TranslatePipe],
  templateUrl: './swap-category-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapCategoryBar implements OnInit {
  private api = inject(SwapListingApiService);
  private destroyRef = inject(DestroyRef);

  categories = signal<SwapCategory[]>([]);
  selectedCategoryId = model<number | null>(null);

  ngOnInit() {
    this.api.getSwapCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (categories) => this.categories.set(categories),
    });
  }

  selectCategory(categoryId: number | null) {
    this.selectedCategoryId.set(categoryId);
  }

  getCategoryIcon(category: SwapCategory): string {
    if (category.icon_uri) return category.icon_uri;

    const name = category.name.toLowerCase();

    if (name.includes('ტექნიკა')) return 'devices';
    if (name.includes('გეიმინგი')) return 'sports_esports';
    if (name.includes('მობილური')) return 'smartphone';
    if (name.includes('კომპიუტერ')) return 'computer';
    if (name.includes('აუდიო')) return 'headphones';
    if (name.includes('ტელევიზორ')) return 'tv';
    if (name.includes('ფოტო') || name.includes('ვიდეო')) return 'photo_camera';
    if (name.includes('სილამაზე')) return 'face';
    if (name.includes('ტანსაცმელი')) return 'checkroom';
    if (name.includes('ფეხსაცმელი')) return 'iron';
    if (name.includes('ჩანთა')) return 'work';
    if (name.includes('საათი')) return 'watch';
    if (name.includes('სამკაული')) return 'diamond';
    if (name.includes('სახლი')) return 'home';
    if (name.includes('ავეჯი')) return 'chair';
    if (name.includes('სამზარეულო')) return 'kitchen';
    if (name.includes('სპორტი')) return 'fitness_center';
    if (name.includes('მოგზაურობა')) return 'luggage';
    if (name.includes('ველო')) return 'pedal_bike';
    if (name.includes('წიგნი')) return 'menu_book';
    if (name.includes('ავტო') || name.includes('მოტო')) return 'directions_car';
    if (name.includes('რემონტი')) return 'handyman';
    if (name.includes('სათამაშო')) return 'toys';
    if (name.includes('ბავშვი')) return 'child_care';
    if (name.includes('ცხოველ')) return 'pets';

    return 'category';
  }
}
