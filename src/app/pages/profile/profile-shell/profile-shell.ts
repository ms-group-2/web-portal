import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Header } from 'lib/components/header/header';
import { ProfileSidebarComponent } from '../components/profile-sidebar/profile-sidebar';

@Component({
  selector: 'app-profile-shell',
  imports: [RouterModule, Header, ProfileSidebarComponent],
  templateUrl: './profile-shell.html',
  styleUrl: './profile-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileShellComponent {}

