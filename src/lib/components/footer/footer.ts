import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './footer.html',
})
export class Footer {
  private router = inject(Router);

  readonly valuePoints = [
    { icon: 'verified', textKey: 'footer.trustSafety' },
    { icon: 'bolt', textKey: 'footer.fastMatching' },
    { icon: 'groups', textKey: 'footer.localCommunity' },
  ];

  readonly quickLinks = [
    { path: '/', textKey: 'footer.home' },
    { path: '/about', textKey: 'footer.about' },
    { path: '/services', textKey: 'footer.services' },
    { path: '/contact', textKey: 'footer.contact' },
  ];

  readonly platformLinks = [
    { path: '/swap', textKey: 'footer.swapHub' },
    { path: '/shop', textKey: 'footer.marketplace' },
    { path: '/booking', textKey: 'footer.bookingServices' },
    { path: '/business/register', textKey: 'footer.vendorTools' },
  ];

  readonly socialLinks = [
    { ariaLabel: 'Facebook', iconClass: 'ph ph-facebook-logo text-2xl', href: '#' },
    { ariaLabel: 'Instagram', iconClass: 'ph ph-instagram-logo text-2xl', href: '#' },
    { ariaLabel: 'LinkedIn', iconClass: 'ph ph-linkedin-logo text-2xl', href: '#' },
  ];

  currentYear = new Date().getFullYear();
  currentRoute = signal('');

  /** Rounded top cap where the footer meets a flat page background (swap). */
  swapFooterTopRounded = computed(() => this.currentRoute().includes('/swap'));

  footerGradient = computed(() => {
    const route = this.currentRoute();
    if (route.includes('/swap')) {
      return 'linear-gradient(to right, var(--color-swap), #FAAF78)';
    } else if (route.includes('/shop')) {
      return 'linear-gradient(to right, var(--color-market), #5a70e8)';
    } else if (route.includes('/booking')) {
      return 'linear-gradient(to right, var(--color-booking), #3b82f6)';
    } else if (route.includes('/business')) {
      return 'var(--color-registerBusiness)';
    }
    return 'linear-gradient(to right, var(--color-primary), #9333ea)';
  });

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute.set(event.url);
      });

    this.currentRoute.set(this.router.url);
  }
}
