import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './footer.html',
})
export class Footer {
  private router = inject(Router);

  currentYear = new Date().getFullYear();
  currentRoute = signal('');

  footerGradient = computed(() => {
    const route = this.currentRoute();
    if (route.includes('/swap')) {
      return 'bg-gradient-to-r from-swap to-[#FAAF78]';
    } else if (route.includes('/market')) {
      return 'bg-gradient-to-r from-market to-teal-400';
    } else if (route.includes('/booking')) {
      return 'bg-gradient-to-r from-booking to-blue-500';
    }
    return 'bg-gradient-to-r from-primary to-purple-600';
  });

  constructor() {
    // Track route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute.set(event.url);
      });

    // Set initial route
    this.currentRoute.set(this.router.url);
  }
}
