import { Component, inject, signal, computed, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from 'lib/services/identity/auth.service';
import { NAV_ITEMS, SNACKBAR_MESSAGES } from 'lib/constants';
import { SnackbarService } from 'lib/services/snackbar.service';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';
import { TranslationService } from 'lib/services/translation.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private auth = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmationDialogService);
  translation = inject(TranslationService);

  variant = input<'gradient' | 'white'>('gradient');

  navItems = signal(NAV_ITEMS);
  currentRoute = signal('');

  headerGradient = computed(() => {
    const route = this.currentRoute();
    if (route.includes('/swap')) {
      return 'bg-gradient-to-r from-swap to-[#F3B582]';
    } else if (route.includes('/market')) {
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
      }
    });
  }
}


