import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from 'lib/services/identity/auth.service';
import { ConfirmationDialogService } from 'lib/components/confirmation-dialog/confirmation-dialog.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { NavItem } from 'lib/services/profile/models/nav-item.model';

@Component({
  selector: 'app-profile-bottom-nav-more-sheet',
  imports: [RouterModule, MatIconModule, MatListModule, MatDividerModule, MatButtonModule, TranslatePipe],
  template: `
    <div class="p-4 pb-8">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-black text-gray-900 uppercase tracking-tight">{{ 'profile.nav.more' | translate }}</h3>
        <button
          mat-icon-button
          (click)="close()"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-nav-list>
        @for (item of mainNavItems; track item.route) {
          <a
            mat-list-item
            [routerLink]="item.route"
            (click)="navigateTo(item.route)"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle class="font-bold">{{ item.label | translate }}</span>
          </a>
        }

        <mat-divider></mat-divider>

        <mat-list-item class="!h-auto !py-2">
          <span matListItemTitle class="text-xs font-black text-gray-400 uppercase tracking-wide">
            {{ 'profile.historySection' | translate }}
          </span>
        </mat-list-item>

        @for (item of historyNavItems; track item.route) {
          <a
            mat-list-item
            [routerLink]="item.route"
            (click)="navigateTo(item.route)"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle class="font-bold">{{ item.label | translate }}</span>
          </a>
        }

        <mat-divider></mat-divider>

        <button
          mat-list-item
          (click)="logout()"
          class="!text-red-600"
        >
          <mat-icon matListItemIcon>logout</mat-icon>
          <span matListItemTitle class="font-bold">{{ 'profile.logout' | translate }}</span>
        </button>
      </mat-nav-list>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileBottomNavMoreSheet {
  private bottomSheetRef = inject(MatBottomSheetRef<ProfileBottomNavMoreSheet>);
  private router = inject(Router);
  private auth = inject(AuthService);
  private confirmDialog = inject(ConfirmationDialogService);
  private translation = inject(TranslationService);

  mainNavItems: NavItem[] = [
    { route: '/profile/addresses', icon: 'location_on', label: 'profile.nav.addresses', activeClass: 'bg-primary text-white' },
    { route: '/profile/business', icon: 'store', label: 'profile.nav.business', activeClass: 'bg-market text-white' },
  ];

  historyNavItems: NavItem[] = [
    { route: '/profile/history/swap', icon: 'swap_horiz', label: 'profile.nav.swapHistory', activeClass: 'bg-swap text-black' },
    { route: '/profile/history/shop', icon: 'shopping_bag', label: 'profile.nav.shopHistory', activeClass: 'bg-primary text-white' },
    { route: '/profile/history/booking', icon: 'event', label: 'profile.nav.bookingHistory', activeClass: 'bg-market text-white' },
  ];

  navigateTo(route: string) {
    this.router.navigateByUrl(route);
    this.close();
  }

  close() {
    this.bottomSheetRef.dismiss();
  }

  logout() {
    this.confirmDialog.confirm({
      title: this.translation.translate('profile.logoutDialog.title'),
      message: this.translation.translate('profile.logoutDialog.message'),
      confirmText: this.translation.translate('profile.logoutDialog.confirm'),
      cancelText: this.translation.translate('profile.logoutDialog.cancel'),
      confirmColor: 'warn',
    }).subscribe(confirmed => {
      if (confirmed) {
        this.auth.logout();
        this.router.navigateByUrl('/auth/landing');
        this.close();
      }
    });
  }
}
