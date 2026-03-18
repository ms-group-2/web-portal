import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';

@Component({
  selector: 'app-profile-header',
  imports: [CommonModule, RouterModule, MatIconModule, TranslatePipe],
  templateUrl: './profile-header.html',
  styleUrl: './profile-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileHeaderComponent  {
  private router = inject(Router);
  translation = inject(TranslationService);



  goBack() {
    if (window.history.length > 1) {
      this.router.navigateByUrl('/landing`');
    } else {
      this.router.navigateByUrl('/landing');
    }
  }
}

