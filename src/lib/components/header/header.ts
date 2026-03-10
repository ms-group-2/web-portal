import { Component, inject, signal, computed, input, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';

import { AuthService } from 'lib/services/identity/auth.service';
import { NAV_ITEMS, SNACKBAR_MESSAGES } from 'lib/constants';
import { SnackbarService } from 'lib/services/snackbar.service';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';
import { TranslationService } from 'lib/services/translation.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ShopService } from 'lib/services/shop/shop.service';
import { Product } from 'src/app/pages/shop/shop.models';

@Component({
  selector: 'app-header',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, RouterLink, RouterLinkActive, TranslatePipe, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnDestroy {
  private auth = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmationDialogService);
  translation = inject(TranslationService);
  private shopService = inject(ShopService);

  variant = input<'gradient' | 'white'>('gradient');
  navContainerClass = input<string>('');

  navItems = signal(NAV_ITEMS);
  currentRoute = signal('');
  cartCount = this.shopService.cartCount;
  favoriteCount = this.shopService.favoriteCount;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  searchQuery = signal('');
  showSearchDropdown = signal(false);
  searchLoading = signal(false);
  suggestedProducts = signal<Product[]>([]);

  isShopRoute = computed(() => {
    return this.currentRoute().includes('/shop');
  });

  isSwapRoute = computed(() => {
    return this.currentRoute().includes('/swap');
  });
  cartBadgeClass = computed(() => {
    const route = this.currentRoute();
    if (route.includes('/shop')) {
      return 'bg-market';
    }
    if (route.includes('/booking')) {
      return 'bg-booking';
    }
    if (route.includes('/swap')) {
      return 'bg-swap';
    }
    return 'bg-primary';
  });

  headerGradient = computed(() => {
    const route = this.currentRoute();
    if (route.includes('/shop')) {
      return 'bg-gradient-to-r from-market to-teal-400';
    } else if (route.includes('/booking')) {
      return 'bg-gradient-to-r from-booking to-blue-500';
    }
    return 'bg-gradient-to-r from-accent to-purple-600';
  });

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute.set(event.url);
      });

    this.currentRoute.set(this.router.url);

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showSearchDropdown.set(false);
    }
  }

  get isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  isGeorgian(): boolean {
    return this.translation.isGeorgian();
  }

  toggleLanguage(): void {
    this.translation.toggleLanguage();
  }

  navigateToProfile() {
    this.router.navigateByUrl('/profile');
  }

  logout() {
    this.confirmDialog.confirm({
      title: 'გასვლა',
      message: 'ნამდვილად გსურთ გასვლა?',
      confirmText: 'გასვლა',
      cancelText: 'გაუქმება',
      confirmColor: 'warn',
    }).subscribe(confirmed => {
      if (confirmed) {
        this.auth.logout();
        this.snackbar.success(SNACKBAR_MESSAGES.LOGOUT_SUCCESS);
        this.router.navigateByUrl('/auth/landing');
      }
    });
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  onSearchFocus() {
    if (this.searchQuery().length > 0) {
      this.showSearchDropdown.set(true);
    }
  }

  closeSearchDropdown() {
    this.showSearchDropdown.set(false);
    this.searchQuery.set('');
  }

  clearSearch() {
    this.searchQuery.set('');
    this.shopService.setSearchQuery('');
    this.suggestedProducts.set([]);
    this.showSearchDropdown.set(false);
  }

  private performSearch(query: string) {
    if (!query || query.trim().length === 0) {
      this.suggestedProducts.set([]);
      this.showSearchDropdown.set(false);
      return;
    }

    if (query.trim().length < 2) {
      return;
    }

    this.showSearchDropdown.set(true);
    this.searchLoading.set(true);

    this.shopService.setSearchQuery(query);

    this.shopService.searchProducts(query, 1, 6).subscribe({
      next: products => {
        this.suggestedProducts.set(products);
        this.searchLoading.set(false);
      },
      error: () => {
        this.suggestedProducts.set([]);
        this.searchLoading.set(false);
      }
    });
  }
}
