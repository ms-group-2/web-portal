import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryMenuService {
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  isOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(() => {
        this.close();
      });
  }

  open(): void {
    this.isOpen.set(true);
    this.toggleBodyScroll(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.toggleBodyScroll(false);
  }

  toggle(): void {
    this.isOpen.update(value => !value);
    this.toggleBodyScroll(!this.isOpen());
  }

  private toggleBodyScroll(disable: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (disable) {
      this.document.body.classList.add('overflow-hidden');
    } else {
      this.document.body.classList.remove('overflow-hidden');
    }
  }
}
