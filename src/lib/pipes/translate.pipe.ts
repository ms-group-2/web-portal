import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy, effect, EffectRef } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private effectRef: EffectRef;

  constructor() {
    this.effectRef = effect(() => {
      this.translationService.instant()('');
      this.cdr.markForCheck();
    });
  }

  transform(key: string): string {
    return this.translationService.translate(key);
  }

  ngOnDestroy() {
    this.effectRef.destroy();
  }
}
