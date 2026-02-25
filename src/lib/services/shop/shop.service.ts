import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Product } from 'src/app/pages/shop/shop.models';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/shop`;

  cartCount = signal(0);

  getProducts(): Observable<Product[]> {
    return of(this.getMockProducts());
  }

  addToCart(product: Product): void {
    this.cartCount.update(count => count + 1);
    console.log('Added to cart:', product);
  }

  private getMockProducts(): Product[] {
    return [
      {
        id: '1',
        name: 'Premium Wireless Headphones',
        price: 199.99,
        originalPrice: 239.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        rating: 4.8,
        reviewCount: 342,
        verified: true,
        category: 'Electronics',
        badge: 'Best Seller'
      },
      {
        id: '2',
        name: 'Designer Leather Wallet',
        price: 89.99,
        originalPrice: 107.99,
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
        rating: 4.9,
        reviewCount: 128,
        verified: true,
        category: 'Lifestyle'
      },
      {
        id: '3',
        name: 'Artisan Coffee Maker',
        price: 149.99,
        originalPrice: 179.99,
        image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&h=400&fit=crop',
        rating: 4.7,
        reviewCount: 256,
        verified: true,
        category: 'Home',
        badge: 'New Arrival'
      },
      {
        id: '4',
        name: 'Smart Fitness Watch',
        price: 299.99,
        originalPrice: 359.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
        rating: 4.6,
        reviewCount: 487,
        verified: true,
        category: 'Electronics'
      },
      {
        id: '5',
        name: 'Organic Skincare Set',
        price: 79.99,
        originalPrice: 95.99,
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
        rating: 4.9,
        reviewCount: 213,
        verified: true,
        category: 'Lifestyle',
        badge: 'Top Rated'
      },
      {
        id: '6',
        name: 'Modern Table Lamp',
        price: 64.99,
        originalPrice: 77.99,
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop',
        rating: 4.5,
        reviewCount: 156,
        verified: true,
        category: 'Home'
      },
      {
        id: '7',
        name: 'Bluetooth Speaker',
        price: 129.99,
        originalPrice: 155.99,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
        rating: 4.7,
        reviewCount: 392,
        verified: true,
        category: 'Electronics'
      },
      {
        id: '8',
        name: 'Luxury Candle Gift Set',
        price: 54.99,
        originalPrice: 65.99,
        image: 'https://images.unsplash.com/photo-1602874801006-c2b3d4c47b53?w=400&h=400&fit=crop',
        rating: 4.8,
        reviewCount: 189,
        verified: true,
        category: 'Gifts'
      },
      {
        id: '9',
        name: 'Professional Camera Bag',
        price: 119.99,
        originalPrice: 143.99,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
        rating: 4.6,
        reviewCount: 274,
        verified: true,
        category: 'Lifestyle'
      }
    ];
  }
}
