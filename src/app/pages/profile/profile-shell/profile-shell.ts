import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileHeaderComponent } from '../components/profile-header/profile-header';
import { ProfileSidebarComponent } from '../components/profile-sidebar/profile-sidebar';

@Component({
  selector: 'app-profile-shell',
  imports: [RouterModule, ProfileHeaderComponent, ProfileSidebarComponent],
  templateUrl: './profile-shell.html',
  styleUrl: './profile-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileShellComponent {}

