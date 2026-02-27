import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
  standalone: true,
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
})
export class CategoryMenu implements OnInit {
  shopService = inject(ShopService);
  menuService = inject(CategoryMenuService);
  router = inject(Router);

  isOpen = this.menuService.isOpen;
  isClosing = signal<boolean>(false);

  // Navigation state
  currentParentId = signal<number | null>(null);
  breadcrumbs = signal<Category[]>([]);

  // Get main categories from service
  mainCategories = this.shopService.mainCategories;
  loading = this.shopService.mainCategoriesLoading;
  subcategoriesMap = this.shopService.subcategoriesByParentId;
  subcategoriesLoading = this.shopService.subcategoriesLoadingFor;

  // Current categories to display
  filteredCategories = computed(() => {
    const parentId = this.currentParentId();
    if (parentId === null) {
      return this.mainCategories();
    }
    return this.subcategoriesMap()[parentId] ?? [];
  });

  ngOnInit() {
    // Nothing to do on init for navigation-based approach
  }

  navigateToCategory(category: Category): void {
    if (typeof category.id !== 'number') return;

    const depth = this.breadcrumbs().length;

    // If at depth 1 (viewing subcategories of a main category), navigate to URL
    if (depth === 1) {
      const mainCategory = this.breadcrumbs()[0];
      const url = `/category/${mainCategory.slug}/${category.slug}/${category.id}`;
      this.router.navigate([url]);
      this.close();
      return;
    }

    // Otherwise, load subcategories and navigate deeper
    this.shopService.getSubcategories(category.id).subscribe(subs => {
      if (subs.length > 0) {
        // Has subcategories, navigate into it
        this.currentParentId.set(category.id as number);
        this.breadcrumbs.update(crumbs => [...crumbs, category]);
      } else {
        // No subcategories, select it and close
        this.selectCategory(category);
      }
    });
  }

  goBack(): void {
    const crumbs = this.breadcrumbs();
    if (crumbs.length === 0) return;

    // Remove last breadcrumb
    const newCrumbs = crumbs.slice(0, -1);
    this.breadcrumbs.set(newCrumbs);

    // Set parent to previous level
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

    // Trim breadcrumbs to selected level
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

  close(): void {
    this.isClosing.set(true);
    setTimeout(() => {
      this.menuService.close();
      this.isClosing.set(false);
    }, 300); // Match the CSS transition duration
  }

  onBackdropClick(): void {
    this.close();
  }
}
