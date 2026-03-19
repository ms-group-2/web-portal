import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Location, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Header } from 'lib/components/header/header';
import { ProfileSidebarComponent } from '../components/profile-sidebar/profile-sidebar';
import { TranslationService } from 'lib/services/translation.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-profile-shell',
  imports: [RouterModule, Header, ProfileSidebarComponent, MatIconModule, TranslatePipe, NgClass],
  templateUrl: './profile-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileShellComponent implements OnInit {
  private translation = inject(TranslationService);
  private location = inject(Location);
  private router = inject(Router);

  currentRoute = signal<string>('');
  isCartRoute = computed(() => this.currentRoute().includes('/profile/cart'));
  sidebarOpen = signal<boolean>(false);

  ngOnInit() {
    this.translation.loadModule('profile').subscribe();

    this.currentRoute.set(this.router.url);
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute.set(event.url);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }
}

