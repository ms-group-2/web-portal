import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
// import { CommonModule } from '@angular/common';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './footer.html',
})
export class Footer {
  private router = inject(Router);

  currentYear = new Date().getFullYear();
  currentRoute = signal('');

  footerGradient = computed(() => {
    const route = this.currentRoute();
    if (route.includes('/swap')) {
      return 'linear-gradient(to right, #F3B582, #FAAF78)';
    } else if (route.includes('/market')) {
      return 'linear-gradient(to right, #80CBC4, #2dd4bf)';
    } else if (route.includes('/booking')) {
      return 'linear-gradient(to right, #3E5AD8, #3b82f6)';
    }
    return 'linear-gradient(to right, #885DDE, #9333ea)';
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
