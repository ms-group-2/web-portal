import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Header } from 'lib/components/header/header';
import { ProfileSidebarComponent } from '../components/profile-sidebar/profile-sidebar';
import { TranslationService } from 'lib/services/translation.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-profile-shell',
  imports: [RouterModule, Header, ProfileSidebarComponent, MatIconModule, TranslatePipe],
  templateUrl: './profile-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileShellComponent implements OnInit {
  private translation = inject(TranslationService);
  private location = inject(Location);

  ngOnInit() {
    this.translation.loadModule('profile').subscribe();
  }

  goBack(): void {
    this.location.back();
  }
}

