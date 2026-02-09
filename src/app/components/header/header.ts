import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from 'lib/services/identity/auth.service';
import { NAV_ITEMS, SNACKBAR_MESSAGES } from 'lib/constants';
import { SnackbarService } from 'lib/services/snackbar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private auth = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  navItems = signal(NAV_ITEMS);

  get isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  navigateToProfile() {
    this.router.navigateByUrl('/profile');
  }

  logout() {
    this.auth.logout();
    this.snackbar.success(SNACKBAR_MESSAGES.LOGOUT_SUCCESS);
  }
}


