import { Component, ChangeDetectionStrategy, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Category } from '../../shop.models';
import { Swiper } from 'lib/components/swiper/swiper';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-category-scroller',
  imports: [CommonModule, MatIconModule, Swiper, TranslatePipe],
  templateUrl: './category-scroller.html',
  styleUrl: './category-scroller.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CategoryScrollerComponent {
  selectedCategory = signal('all');

  allCategory: Category = {
    id: 'all',
    name: 'shop.categories.all',
    image: null,
  };

  categories: Category[] = [
    {
      id: 'vouchers',
      name: 'shop.categories.vouchers',
      image: 'https://images.unsplash.com/photo-1637910116483-7efcc9480847?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    {
      id: 'electronics',
      name: 'shop.categories.electronics',
      image: 'https://images.unsplash.com/photo-1754761986430-5d0d44d09d00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    {
      id: 'beauty',
      name: 'shop.categories.beauty',
      image: 'https://images.unsplash.com/photo-1629380106682-6736d2c327ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    {
      id: 'home',
      name: 'shop.categories.home',
      image: 'https://images.unsplash.com/photo-1759722666961-8068c5ad61ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    {
      id: 'gifts',
      name: 'shop.categories.gifts',
      image: 'https://images.unsplash.com/photo-1637590957181-8893af2a8344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    {
      id: 'clothing',
      name: 'shop.categories.clothing',
      image: 'https://images.unsplash.com/photo-1732257119942-a19648e482f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    {
      id: 'sports',
      name: 'shop.categories.sports',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    {
      id: 'books',
      name: 'shop.categories.books',
      image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    {
      id: 'toys',
      name: 'shop.categories.toys',
      image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    {
      id: 'pets',
      name: 'shop.categories.pets',
      image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    {
      id: 'office',
      name: 'shop.categories.office',
      image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    },
    {
      id: 'jewelry',
      name: 'shop.categories.jewelry',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&h=300'
    }
  ];

  selectCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
  }
}
