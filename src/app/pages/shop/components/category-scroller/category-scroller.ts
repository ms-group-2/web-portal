import { Component, ChangeDetectionStrategy, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Swiper } from 'lib/components/swiper/swiper';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { CategoryCardSkeletonComponent } from '../skeletons/category-card-skeleton';
import { ShopService } from 'src/lib/services/shop/shop.service';
import { CategoryMenuService } from 'src/lib/components/category-dialog/category-dialog.service';
import { Category } from '../../shop.models';

@Component({
  selector: 'app-category-scroller',
  imports: [CommonModule, MatIconModule, Swiper, TranslatePipe, CategoryCardSkeletonComponent],
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
  isLoading = this.shopService.categoriesLoadingFor;
  skeletonArray = Array(5).fill(0);

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

    if (slug.includes('teqnika')) return 'devices'; 
    if (slug.includes('geimingi')) return 'sports_esports'; 
    if (slug.includes('mobilurebi')) return 'smartphone'; 
    if (slug.includes('kompiuteruli')) return 'computer'; 
    if (slug.includes('planshetebi')) return 'tablet'; 
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
    if (slug.includes('ganateba')) return 'lightbulb'; 
    if (slug.includes('teqstili')) return 'bed'; 

    if (slug.includes('sporti')) return 'fitness_center'; 
    if (slug.includes('mogzauroba')) return 'luggage'; 
    if (slug.includes('lashqroba')) return 'hiking'; 
    if (slug.includes('velo')) return 'pedal_bike'; 
    if (slug.includes('ioga')) return 'self_improvement'; 

    if (slug.includes('tsignebi')) return 'menu_book'; 
    if (slug.includes('bari')) return 'local_bar'; 
    if (slug.includes('yava')) return 'coffee'; 

    if (slug.includes('avto-moto')) return 'directions_car'; 
    if (slug.includes('remonti')) return 'handyman'; 
    if (slug.includes('khelsatsyoebi')) return 'construction'; 

    if (slug.includes('satamashoebi')) return 'toys'; 
    if (slug.includes('mshobeli-bavshvi')) return 'child_care'; 
    if (slug.includes('ckhovelebis')) return 'pets'; 

    if (slug.includes('sakhlis-movla')) return 'cleaning_services';
    if (slug.includes('yoveldghiuri-sayidlebi')) return 'shopping_basket'; 
    if (slug.includes('sakancelario')) return 'edit'; 

    return 'category';
  }
}
