import { Component, ChangeDetectionStrategy, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Swiper } from 'lib/components/swiper/swiper';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopService } from 'src/lib/services/shop/shop.service';
import { CategoryMenuService } from 'src/lib/components/category-dialog/category-dialog.service';

@Component({
  selector: 'app-category-scroller',
  imports: [CommonModule, MatIconModule, Swiper, TranslatePipe],
  templateUrl: './category-scroller.html',
  styleUrl: './category-scroller.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CategoryScrollerComponent {
  private shopService = inject(ShopService);
  private categoryMenu = inject(CategoryMenuService);

  categories = this.shopService.mainCategories;

  selectedCategory = this.shopService.selectedCategoryId;

  openCategoryBrowser() {
    this.categoryMenu.open();
  }

  selectCategory(categoryId: number) {
    this.shopService.selectCategory(categoryId);
  }
}
