import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ProfileBottomNavMoreSheet } from './profile-bottom-nav-more-sheet';

interface BottomNavItem {
  route: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-profile-bottom-nav',
  imports: [RouterModule, RouterLink, RouterLinkActive, MatIconModule, TranslatePipe, MatBottomSheetModule],
  templateUrl: './profile-bottom-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileBottomNavComponent {
  private router = inject(Router);
  private bottomSheet = inject(MatBottomSheet);

  currentRoute = signal(this.router.url);

  // Main 4 items shown in bottom nav
  navItems: BottomNavItem[] = [
    { route: '/profile/my-posts', icon: 'post_add', label: 'profile.nav.myPosts' },
    { route: '/profile/wishlist', icon: 'favorite_border', label: 'profile.nav.favorites' },
    { route: '/profile/cart', icon: 'shopping_cart', label: 'profile.nav.cart' },
    { route: '/profile/settings', icon: 'settings', label: 'profile.nav.settings' },
  ];

  isMoreActive = computed(() => {
    const route = this.currentRoute();
    return route.includes('/profile/addresses') ||
           route.includes('/profile/business') ||
           route.includes('/profile/history');
  });

  constructor() {
    this.router.events.subscribe(() => {
      this.currentRoute.set(this.router.url);
    });
  }

  openMoreMenu() {
    this.bottomSheet.open(ProfileBottomNavMoreSheet, {
      panelClass: 'profile-more-sheet',
    });
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
