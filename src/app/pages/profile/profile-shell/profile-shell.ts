import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Header } from 'lib/components/header/header';
import { ProfileSidebarComponent } from '../components/profile-sidebar/profile-sidebar';
import { ProfileBottomNavComponent } from '../components/profile-bottom-nav/profile-bottom-nav';
import { TranslationService } from 'lib/services/translation.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-profile-shell',
  imports: [RouterModule, Header, ProfileSidebarComponent, ProfileBottomNavComponent, MatIconModule, TranslatePipe, ],
  templateUrl: './profile-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileShellComponent implements OnInit {
  private translation = inject(TranslationService);
  private location = inject(Location);
  private router = inject(Router);

  currentRoute = signal<string>('');
  isCartRoute = computed(() => this.currentRoute().includes('/profile/cart'));

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
}

