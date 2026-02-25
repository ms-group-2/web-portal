import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Header } from 'lib/components/header/header';
import { ProfileSidebarComponent } from '../components/profile-sidebar/profile-sidebar';
import { TranslationService } from 'lib/services/translation.service';

@Component({
  selector: 'app-profile-shell',
  imports: [RouterModule, Header, ProfileSidebarComponent],
  templateUrl: './profile-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileShellComponent implements OnInit {
  private translation = inject(TranslationService);

  ngOnInit() {
    // Load profile module once for all profile pages (includes validation errors)
    this.translation.loadModule('profile').subscribe();
  }
}

