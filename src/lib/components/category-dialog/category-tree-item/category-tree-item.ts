import { Component, input, output, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'src/lib/pipes/translate.pipe';
import { Category } from 'src/app/pages/shop/shop.models';

@Component({
  selector: 'app-category-tree-item',
  imports: [ NgClass, MatIconModule, TranslatePipe],
  templateUrl: './category-tree-item.html',
  styleUrls: ['./category-tree-item.scss'],
  
})
export class CategoryTreeItemComponent {
  category = input.required<Category>();
  level = input<number>(0);
  expanded = input<boolean>(false);
  selected = input<boolean>(false);
  subcategories = input<Category[]>([]);
  subcategoriesMap = input<Record<number, Category[]>>({});

  toggleExpand = output<number>();
  select = output<Category>();

  categoryId = computed((): number => {
    const id = this.category().id;
    if (typeof id === 'number') {
      return id;
    }
    return 0;
  });

  loadedSubcategories = computed(() => {
    const subs = this.subcategories();
    if (subs.length > 0) return subs;

    const catId = this.categoryId();
    if (catId === 0) return [];

    const map = this.subcategoriesMap();
    return map[Number(catId)] ?? [];
  });

  hasSubcategories = computed(() => {
    const cat = this.category();
    if (cat.subcategories && cat.subcategories.length > 0) return true;

    const loaded = this.loadedSubcategories();
    return loaded.length > 0;
  });

  subcategoryCount = computed(() => {
    return this.loadedSubcategories().length;
  });

  onToggleExpand(event: Event): void {
    event.stopPropagation();
    const id = this.categoryId();
    if (id !== 0) {
      this.toggleExpand.emit(id);
    }
  }

  onSelect(): void {
    const cat = this.category();
    if (typeof cat.id === 'number') {
      this.select.emit(cat);
    }
  }
}
