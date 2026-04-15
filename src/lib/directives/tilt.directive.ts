import {
  Directive,
  ElementRef,
  OnInit,
  DestroyRef,
  inject,
  input,
  NgZone,
} from '@angular/core';

@Directive({
  selector: '[appTilt]',
  standalone: true,
})
export class TiltDirective implements OnInit {
  private el = inject(ElementRef);
  private zone = inject(NgZone);
  private destroyRef = inject(DestroyRef);

  /** Max rotation in degrees */
  maxTilt = input(8);
  /** Glare intensity 0–1 */
  glare = input(0.15);
  /** Transition speed when leaving (ms) */
  resetSpeed = input(400);

  private glareEl!: HTMLElement;

  ngOnInit() {
    const el = this.el.nativeElement as HTMLElement;
    el.style.transformStyle = 'preserve-3d';
    el.style.willChange = 'transform';

    // Create glare overlay
    this.glareEl = document.createElement('div');
    Object.assign(this.glareEl.style, {
      position: 'absolute',
      inset: '0',
      borderRadius: 'inherit',
      pointerEvents: 'none',
      opacity: '0',
      transition: `opacity ${this.resetSpeed()}ms ease`,
      background:
        'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)',
      zIndex: '50',
    });

    // Ensure relative positioning for glare overlay
    const pos = getComputedStyle(el).position;
    if (pos === 'static') {
      el.style.position = 'relative';
    }
    el.appendChild(this.glareEl);

    this.zone.runOutsideAngular(() => {
      el.addEventListener('mousemove', this.onMouseMove);
      el.addEventListener('mouseleave', this.onMouseLeave);
    });

    this.destroyRef.onDestroy(() => {
      el.removeEventListener('mousemove', this.onMouseMove);
      el.removeEventListener('mouseleave', this.onMouseLeave);
    });
  }

  private onMouseMove = (e: MouseEvent) => {
    const el = this.el.nativeElement as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const tiltX = (0.5 - y) * this.maxTilt() * 2;
    const tiltY = (x - 0.5) * this.maxTilt() * 2;

    el.style.transition = 'transform 100ms ease-out';
    el.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;

    // Move glare to follow cursor
    const glareOpacity = this.glare();
    this.glareEl.style.opacity = String(glareOpacity);
    this.glareEl.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 60%)`;
  };

  private onMouseLeave = () => {
    const el = this.el.nativeElement as HTMLElement;
    el.style.transition = `transform ${this.resetSpeed()}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    this.glareEl.style.opacity = '0';
  };
}
