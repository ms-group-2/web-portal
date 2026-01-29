import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'lib/services/identity/auth.service';

@Component({
  standalone: true,
  selector: 'vipo-google-callback',
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <p class="text-sm text-gray-600 font-semibold">Signing you in with Google…</p>
    </div>
  `,
})
export class GoogleCallback {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

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

    this.auth.me().subscribe({
      next: (user) => {
        this.auth.user.set(user);
        this.router.navigateByUrl('/home');
      },
      error: () => {
        this.router.navigateByUrl('/auth/sign-in');
      },
    });
  }
}