import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'lib/services/identity/auth.service';
import { TranslationService } from 'lib/services/translation.service';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'vipo-google-callback',
  imports: [TranslatePipe],
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <p class="text-sm text-gray-600 font-semibold">{{ 'auth.signInWithGoogle' | translate }}</p>
    </div>
  `,
})
export class GoogleCallback {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  translation = inject(TranslationService);

  ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;

    const access_token = qp.get('access_token');
    const refresh_token = qp.get('refresh_token');
    const token_type = qp.get('token_type') ?? 'bearer';

    if (!access_token || !refresh_token) {
      this.router.navigateByUrl('/auth/sign-in');
      return;
    }

    this.auth.setTokensFromResponse({ access_token, refresh_token, token_type });

    this.auth.loadMe().subscribe({
      next: () => {
        this.router.navigateByUrl('/landing');
      },
      error: () => {
        this.router.navigateByUrl('/auth/sign-in');
      },
    });
  }
}