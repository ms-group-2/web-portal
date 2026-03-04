import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { TranslatePipe } from 'src/lib/pipes/translate.pipe';
import { ShopService } from 'src/lib/services/shop/shop.service';
import { CategoryMenuService } from './category-dialog.service';
import { Category } from 'src/app/pages/shop/shop.models';
import { LoadingSpinner } from 'src/lib/components/spinner/loading-spinner';

@Component({
  selector: 'app-category-menu',
  imports: [
    NgClass,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    TranslatePipe,
    LoadingSpinner,
  ],
  templateUrl: './category-dialog.html',
  styleUrl: './category-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryMenu implements OnInit {
  shopService = inject(ShopService);
  menuService = inject(CategoryMenuService);
  router = inject(Router);

  isOpen = this.menuService.isOpen;
  isClosing = signal<boolean>(false);

  currentParentId = signal<number | null>(null);
  breadcrumbs = signal<Category[]>([]);

  mainCategories = this.shopService.mainCategories;
  subcategoriesMap = this.shopService.subcategoriesByParentId;
  loading = computed(() => {
    const loadingFor = this.shopService.categoriesLoadingFor();
    return loadingFor !== null;
  });

  filteredCategories = computed(() => {
    const parentId = this.currentParentId();
    if (parentId === null) {
      return this.mainCategories();
    }
    return this.subcategoriesMap()[parentId] ?? [];
  });

  ngOnInit() {
  }

  navigateToCategory(category: Category): void {
    if (typeof category.id !== 'number') return;

    const currentDepth = this.breadcrumbs().length;

    // If we're already showing subcategories (depth >= 1), navigate to page instead of drilling deeper
    if (currentDepth >= 1) {
      console.log('Navigating to category:', category.id);
      this.router.navigate(['/shop/category', category.id]);
      this.close();
      return;
    }

    // We're at main categories level (depth 0), check if this category has subcategories
    if (category.has_subcategories) {
      // Load and show subcategories in the dialog
      this.shopService.getSubcategories(category.id).subscribe(subs => {
        if (subs.length > 0) {
          this.currentParentId.set(category.id as number);
          this.breadcrumbs.update(crumbs => [...crumbs, category]);
        } else {
          // Has flag but no actual subcategories - navigate to page
          this.router.navigate(['/shop/category', category.id]);
          this.close();
        }
      });
    } else {
      // Main category with no subcategories - navigate to page
      this.router.navigate(['/shop/category', category.id]);
      this.close();
    }
  }

  goBack(): void {
    const crumbs = this.breadcrumbs();
    if (crumbs.length === 0) return;

    const newCrumbs = crumbs.slice(0, -1);
    this.breadcrumbs.set(newCrumbs);

    if (newCrumbs.length === 0) {
      this.currentParentId.set(null);
    } else {
      const parent = newCrumbs[newCrumbs.length - 1];
      this.currentParentId.set(typeof parent.id === 'number' ? parent.id : null);
    }
  }

  goToLevel(index: number): void {
    const crumbs = this.breadcrumbs();
    if (index < 0 || index >= crumbs.length) return;

    const newCrumbs = crumbs.slice(0, index + 1);
    this.breadcrumbs.set(newCrumbs);

    const category = newCrumbs[newCrumbs.length - 1];
    this.currentParentId.set(typeof category.id === 'number' ? category.id : null);
  }

  goToRoot(): void {
    this.breadcrumbs.set([]);
    this.currentParentId.set(null);
  }

  selectCategory(category: Category): void {
    this.shopService.selectCategory(typeof category.id === 'number' ? category.id : null);
    this.menuService.close();
  }

  selectAllCategories(): void {
    this.shopService.selectCategory(null);
    this.menuService.close();
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

  close(): void {
    this.isClosing.set(true);
    setTimeout(() => {
      this.menuService.close();
      this.isClosing.set(false);
    }, 300);
  }

  onBackdropClick(): void {
    this.close();
  }
}
