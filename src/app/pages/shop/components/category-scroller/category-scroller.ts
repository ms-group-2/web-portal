import { Component, ChangeDetectionStrategy, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Category } from '../../shop.models';

@Component({
  selector: 'app-category-scroller',
  imports: [CommonModule, MatIconModule],
  templateUrl: './category-scroller.html',
  styleUrl: './category-scroller.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryScrollerComponent {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  
  selectedCategory = signal('all');

  categories: Category[] = [
    { 
      id: 'all',
      name: 'All categories', 
      image: null,
    },
    { 
      id: 'vouchers',
      name: 'Vouchers', 
      image: 'https://images.unsplash.com/photo-1637910116483-7efcc9480847?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    { 
      id: 'electronics',
      name: 'Electronics', 
      image: 'https://images.unsplash.com/photo-1754761986430-5d0d44d09d00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    { 
      id: 'beauty',
      name: 'Beauty & Care', 
      image: 'https://images.unsplash.com/photo-1629380106682-6736d2c327ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    { 
      id: 'home',
      name: 'Home & Garden', 
      image: 'https://images.unsplash.com/photo-1759722666961-8068c5ad61ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    { 
      id: 'gifts',
      name: 'Gifts', 
      image: 'https://images.unsplash.com/photo-1637590957181-8893af2a8344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    { 
      id: 'clothing',
      name: 'Clothing & Accessories', 
      image: 'https://images.unsplash.com/photo-1732257119942-a19648e482f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    }
  ];

  selectCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
  }

  scrollCategories() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollBy({ left: 300, behavior: 'smooth' });
    }
  }
}
