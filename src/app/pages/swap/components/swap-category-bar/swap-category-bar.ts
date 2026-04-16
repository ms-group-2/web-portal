import { Component, ChangeDetectionStrategy, inject, model, OnInit, DestroyRef } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopService } from 'src/lib/services/shop/shop.service';
import { Category } from 'src/app/pages/shop/shop.models';

@Component({
  selector: 'app-swap-category-bar',
  imports: [NgClass, MatIconModule, TranslatePipe],
  templateUrl: './swap-category-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapCategoryBar implements OnInit {
  private shopService = inject(ShopService);
  private destroyRef = inject(DestroyRef);

  categories = this.shopService.mainCategories;
  selectedCategoryId = model<number | null>(null);

  ngOnInit() {
    this.shopService.getMainCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  selectCategory(categoryId: number | null) {
    this.selectedCategoryId.set(categoryId);
  }

  getCategoryIcon(category: Category): string {
    const slug = category.slug?.toLowerCase() || '';

    if (slug.includes('teqnika')) return 'devices';
    if (slug.includes('geimingi')) return 'sports_esports';
    if (slug.includes('mobilurebi')) return 'smartphone';
    if (slug.includes('kompiuteruli')) return 'computer';
    if (slug.includes('audioteqnika')) return 'headphones';
    if (slug.includes('televizorebi')) return 'tv';
    if (slug.includes('foto-video')) return 'photo_camera';
    if (slug.includes('silamaze')) return 'face';
    if (slug.includes('tansacmeli')) return 'checkroom';
    if (slug.includes('fekhsacmeli')) return 'iron';
    if (slug.includes('chanta')) return 'work';
    if (slug.includes('saati')) return 'watch';
    if (slug.includes('samkaulebi')) return 'diamond';
    if (slug.includes('sakhli-da-ezo')) return 'home';
    if (slug.includes('aveji')) return 'chair';
    if (slug.includes('samzareulo')) return 'kitchen';
    if (slug.includes('sporti')) return 'fitness_center';
    if (slug.includes('mogzauroba')) return 'luggage';
    if (slug.includes('velo')) return 'pedal_bike';
    if (slug.includes('tsignebi')) return 'menu_book';
    if (slug.includes('avto-moto')) return 'directions_car';
    if (slug.includes('remonti')) return 'handyman';
    if (slug.includes('satamashoebi')) return 'toys';
    if (slug.includes('mshobeli-bavshvi')) return 'child_care';
    if (slug.includes('ckhovelebis')) return 'pets';

    return 'category';
  }
}
