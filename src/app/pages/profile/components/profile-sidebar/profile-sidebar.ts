import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from 'lib/services/identity/auth.service';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { NavItem } from 'lib/services/profile/models/nav-item.model';
import { ConfirmationDialogService } from '../../../../components/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-profile-sidebar',
  imports: [RouterModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './profile-sidebar.html',
  styleUrl: './profile-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSidebarComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private profileApi = inject(ProfileApiService);
  private confirmDialog = inject(ConfirmationDialogService);

  firstName = signal('');

  mainNavItems: NavItem[] = [
    { route: '/profile/orders', icon: 'inventory_2', label: 'ჩემი შეკვეთები', activeClass: 'bg-primary text-white' },
    { route: '/profile/wishlist', icon: 'favorite', label: 'ფავორიტები', activeClass: 'bg-primary text-white' },
    { route: '/profile/payment', icon: 'credit_card', label: 'გადახდის მეთოდები', activeClass: 'bg-primary text-white' },
    { route: '/profile/addresses', icon: 'home', label: 'მიმდინარე მისამართები', activeClass: 'bg-primary text-white' },
    { route: '/profile/settings', icon: 'settings', label: 'პროფილი და პარამეტრები', activeClass: 'bg-primary text-white' },
  ];

  historyNavItems: NavItem[] = [
    { route: '/profile/history/swap', icon: 'swap_horiz', label: 'გაცვლის ისტორია', activeClass: 'bg-swap text-black' },
    { route: '/profile/history/shop', icon: 'shopping_bag', label: 'შეკვეთების ისტორია', activeClass: 'bg-primary text-white' },
    { route: '/profile/history/booking', icon: 'event', label: 'დაჯავშნის ისტორია', activeClass: 'bg-market text-white' },
  ];

  userName = computed(() => {
    const name = this.firstName();
    return name || 'User';
  });

  ngOnInit() {
    this.loadUserName();
    
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    // Listen for storage changes (from profile updates)
    // Listen for custom event from same tab
    window.addEventListener('profileUpdated', this.loadUserName.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
    window.removeEventListener('profileUpdated', this.loadUserName.bind(this));
  }

  handleStorageChange(event: StorageEvent) {
    if (event.key === 'vipo_user_firstName') {
      this.loadUserName();
    }
  }

  loadUserName() {
    const userId = this.auth.user()?.id;
    
    if (userId) {
      const storedFirstName = localStorage.getItem('vipo_user_firstName');
      
      if (storedFirstName) {
        this.firstName.set(storedFirstName);
      } else {
        this.profileApi.getProfile(userId).subscribe({
          next: (profile) => {
            localStorage.setItem('vipo_user_firstName', profile.name);
            localStorage.setItem('vipo_user_lastName', profile.surname);
            this.firstName.set(profile.name);
          },
          error: () => {
            this.firstName.set('User');
          }
        });
      }
    } else {
      const storedFirstName = localStorage.getItem('vipo_user_firstName') || '';
      const pendingReg = this.auth.pendingRegistration();
      const firstNameFromPending = pendingReg?.firstName || '';
      this.firstName.set(storedFirstName || firstNameFromPending || 'User');
    }
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
        this.router.navigateByUrl('/auth/sign-in');
      }
    });
  }
}

