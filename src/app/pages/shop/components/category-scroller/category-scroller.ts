import { Component, ChangeDetectionStrategy, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Swiper } from 'lib/components/swiper/swiper';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopService } from 'src/lib/services/shop/shop.service';
import { CategoryMenuService } from 'src/lib/components/category-dialog/category-dialog.service';
import { Category } from '../../shop.models';

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
  private router = inject(Router);

  categories = this.shopService.mainCategories;

  selectedCategory = this.shopService.selectedCategoryId;

  openCategoryBrowser() {
    this.categoryMenu.open();
  }

  selectCategory(category: Category): void {
    if (typeof category.id !== 'number') return;

    this.router.navigate(['/shop/category', category.id]);
  }

  getCategoryIcon(category: Category): string {
    const slug = category.slug?.toLowerCase() || '';

    if (slug.includes('teqnika')) return 'devices'; // Technology
    if (slug.includes('geimingi')) return 'sports_esports'; // Gaming
    if (slug.includes('mobilurebi')) return 'smartphone'; // Mobile phones
    if (slug.includes('kompiuteruli')) return 'computer'; // Computer
    if (slug.includes('planshetebi')) return 'tablet'; // Tablets
    if (slug.includes('audioteqnika')) return 'headphones'; // Audio
    if (slug.includes('televizorebi')) return 'tv'; // TV
    if (slug.includes('foto-video')) return 'photo_camera'; // Photo & Video

    if (slug.includes('silamaze')) return 'face'; // Beauty & care
    if (slug.includes('tansacmeli')) return 'checkroom'; // Clothing & accessories
    if (slug.includes('fekhsacmeli')) return 'iron'; // Footwear
    if (slug.includes('chanta')) return 'work'; // Bags
    if (slug.includes('saati')) return 'watch'; // Watch
    if (slug.includes('samkaulebi')) return 'diamond'; // Jewelry

    if (slug.includes('sakhli-da-ezo')) return 'home'; // Home & garden
    if (slug.includes('aveji')) return 'chair'; // Furniture
    if (slug.includes('samzareulo')) return 'kitchen'; // Kitchen
    if (slug.includes('ganateba')) return 'lightbulb'; // Lighting
    if (slug.includes('teqstili')) return 'bed'; // Textiles

    if (slug.includes('sporti')) return 'fitness_center'; // Sports
    if (slug.includes('mogzauroba')) return 'luggage'; // Travel
    if (slug.includes('lashqroba')) return 'hiking'; // Hiking
    if (slug.includes('velo')) return 'pedal_bike'; // Bicycle
    if (slug.includes('ioga')) return 'self_improvement'; // Yoga

    if (slug.includes('tsignebi')) return 'menu_book'; // Books
    if (slug.includes('bari')) return 'local_bar'; // Bar
    if (slug.includes('yava')) return 'coffee'; // Coffee

    if (slug.includes('avto-moto')) return 'directions_car'; // Auto & moto
    if (slug.includes('remonti')) return 'handyman'; // Repair & tools
    if (slug.includes('khelsatsyoebi')) return 'construction'; // Tools

    if (slug.includes('satamashoebi')) return 'toys'; // Toys
    if (slug.includes('mshobeli-bavshvi')) return 'child_care'; // Parent & child
    if (slug.includes('ckhovelebis')) return 'pets'; // Pet care

    if (slug.includes('sakhlis-movla')) return 'cleaning_services'; // House cleaning
    if (slug.includes('yoveldghiuri-sayidlebi')) return 'shopping_basket'; // Daily shopping
    if (slug.includes('sakancelario')) return 'edit'; // Office supplies

    return 'category';
  }
}
