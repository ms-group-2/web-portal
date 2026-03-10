import { Component, OnInit, DestroyRef, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Header } from "lib/components/header/header";
import { Footer } from "lib/components/footer/footer";
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';

@Component({
  selector: 'app-landing',
  imports: [ MatButtonModule, MatIconModule, FormsModule, Header, Footer, TranslatePipe],
  templateUrl: './landing.html',
  styleUrls: ['./landing.scss']
})
export class Landing implements OnInit {
  private router = inject(Router);
  translation = inject(TranslationService);
  private destroyRef = inject(DestroyRef);

  currentPage = signal<string>('home');
  isProfileOpen = signal<boolean>(false);
  inputValue = signal<string>('');

  headerColor = computed(() => {
    switch (this.currentPage()) {
      case 'swap':
        return 'bg-swap';
      case 'shop':
        return 'bg-white border-b border-gray-200';
      case 'book':
        return 'bg-booking';
      default:
        return 'bg-primary';
    }
  });

  navTextColors = computed(() => {
    switch (this.currentPage()) {
      case 'swap':
        return {
          inactive: 'text-primary/70 hover:text-primary hover:bg-white/20',
          active: 'text-primary bg-white/30'
        };
      case 'shop':
        return {
          inactive: 'text-market/60 hover:text-market hover:bg-market/5',
          active: 'text-market bg-market/10'
        };
      case 'book':
        return {
          inactive: 'text-white/70 hover:text-white hover:bg-white/5',
          active: 'text-swap bg-white/10'
        };
      default:
        return {
          inactive: 'text-white/70 hover:text-white hover:bg-white/5',
          active: 'text-swap bg-white/10'
        };
    }
  });

  iconColor = computed(() => {
    return this.currentPage() === 'shop' ? 'text-market' : 'text-white';
  });

  isShopPage = computed(() => this.currentPage() === 'shop');

  cartCount = signal<number>(3);

  ngOnInit() {
    this.translation.loadModule('landing')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  navigateTo(page: string) {
    if (page === 'home') {
      this.currentPage.set('home');
      return;
    }

    this.router.navigate([`/${page}`]);
  }

  toggleProfile() {
    this.isProfileOpen.update(value => !value);
  }

  closeProfile() {
    this.isProfileOpen.set(false);
  }

  handleSend() {
    if (this.inputValue().trim()) {
      console.log('Send message:', this.inputValue());
      this.inputValue.set('');
    }
  }

  handleQuickAction(action: string) {
    console.log('Quick action:', action);
    if (action === 'swap') {
      this.navigateTo('swap');
    } else if (action === 'shop') {
      this.navigateTo('shop');
    } else if (action === 'book') {
      this.navigateTo('booking');
    }
  }
}
