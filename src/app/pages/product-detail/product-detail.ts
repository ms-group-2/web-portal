import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { Header } from 'lib/components/header/header';
import { Footer } from 'lib/components/footer/footer';
import { ShopService } from 'lib/services/shop/shop.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { Product } from '../shop/shop.models';
import { LoadingSpinner } from 'lib/components/spinner/loading-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  imports: [Header, Footer, TranslatePipe, RouterLink, LoadingSpinner, MatIconModule, CommonModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss']
})
export class ProductDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private shopService = inject(ShopService);
  private translation = inject(TranslationService);
  private location = inject(Location);

  productId = signal<number | null>(null);
  product = signal<Product | null>(null);
  loading = signal<boolean>(true);
  selectedImage = signal<string>('');
  quantity = signal<number>(1);

  isFavorited = computed(() => this.shopService.isFavorite(this.product()?.id));

  goBack() {
    this.location.back();
  }

  ngOnInit() {
    this.translation.loadModule('shop').subscribe();

    this.route.params.subscribe(params => {
      const productId = +params['productId'];
      this.productId.set(productId);
      this.loadProduct(productId);
    });
  }

  private loadProduct(productId: number) {
    this.loading.set(true);

    // For now, fetch all products and find the one we need
    // TODO: Add a dedicated API endpoint for single product fetch
    this.shopService.getProducts().subscribe({
      next: (products) => {
        const product = products.find(p => p.id === productId);
        if (product) {
          this.product.set(product);
          this.selectedImage.set(product.image || product.image_url || '');
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  selectImage(image: string) {
    this.selectedImage.set(image);
  }

  incrementQuantity() {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  addToCart() {
    const product = this.product();
    if (product) {
      for (let i = 0; i < this.quantity(); i++) {
        this.shopService.addToCart(product);
      }
    }
  }

  toggleFavorite() {
    const product = this.product();
    if (product) {
      this.shopService.toggleFavorite(product);
    }
  }
}
