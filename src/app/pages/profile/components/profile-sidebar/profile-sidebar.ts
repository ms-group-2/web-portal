import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from 'lib/services/identity/auth.service';

@Component({
  selector: 'app-profile-sidebar',
  imports: [ RouterModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './profile-sidebar.html',
  styleUrl: './profile-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSidebarComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);

  firstName = signal('');

  ngOnInit() {
    this.loadUserName();
  }

  loadUserName() {
    const storedFirstName = localStorage.getItem('vipo_user_firstName') || '';
    const pendingReg = this.auth.pendingRegistration();
    const firstNameFromPending = pendingReg?.firstName || '';
    const firstName = storedFirstName || firstNameFromPending || 'User';
    this.firstName.set(firstName);
  }

  userName = computed(() => {
    const name = this.firstName();
    return name || 'User';
  });

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/auth/sign-in');
  }
}

