import {
  Directive,
  ElementRef,
  OnInit,
  DestroyRef,
  inject,
  input,
} from '@angular/core';

export type ScrollAnimation =
  | 'fade-up'
  | 'fade-in'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in';

@Directive({
  selector: '[appScrollAnimate]',
  standalone: true,
})
export class ScrollAnimateDirective implements OnInit {
  private el = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  appScrollAnimate = input<ScrollAnimation>('fade-up');
  delay = input(0);
  duration = input(600);
  easing = input('cubic-bezier(0.22, 1, 0.36, 1)');
  threshold = input(0.15);

  private observer!: IntersectionObserver;

  ngOnInit() {
    const el = this.el.nativeElement as HTMLElement;
    const d = this.delay();
    const dur = this.duration();
    const ease = this.easing();

    el.style.opacity = '0';
    el.style.transition = `opacity ${dur}ms ${ease} ${d}ms, transform ${dur}ms ${ease} ${d}ms`;
    this.applyInitialTransform(el);

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translate3d(0, 0, 0) scale(1)';
        } else {
          el.style.opacity = '0';
          this.applyInitialTransform(el);
        }
      },
      { threshold: this.threshold() }
    );

    this.observer.observe(el);

    this.destroyRef.onDestroy(() => {
      this.observer.disconnect();
    });
  }

  private applyInitialTransform(el: HTMLElement) {
    switch (this.appScrollAnimate()) {
      case 'fade-up':
        el.style.transform = 'translate3d(0, 40px, 0)';
        break;
      case 'fade-left':
        el.style.transform = 'translate3d(-40px, 0, 0)';
        break;
      case 'fade-right':
        el.style.transform = 'translate3d(40px, 0, 0)';
        break;
      case 'zoom-in':
        el.style.transform = 'scale(0.9)';
        break;
      case 'fade-in':
      default:
        el.style.transform = 'translate3d(0, 0, 0)';
        break;
    }
  }
}
