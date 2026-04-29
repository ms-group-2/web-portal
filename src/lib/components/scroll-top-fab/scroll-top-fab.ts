import { Component, ChangeDetectionStrategy, signal, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-scroll-top-fab',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './scroll-top-fab.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollTopFab implements OnInit {
  private destroyRef = inject(DestroyRef);

  isVisible = signal(false);

  ngOnInit() {
    fromEvent(window, 'scroll')
      .pipe(throttleTime(100, undefined, { leading: true, trailing: true }), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isVisible.set(window.scrollY > 400);
      });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
