import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile-header',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './profile-header.html',
  styleUrl: './profile-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileHeaderComponent {
  private router = inject(Router);

  goBack() {
    // Try to go back in history, otherwise navigate to home
    if (window.history.length > 1) {
      this.router.navigateByUrl('/landing`');
    } else {
      this.router.navigateByUrl('/landing');
    }
  }
}

