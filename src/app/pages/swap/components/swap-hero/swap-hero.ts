import { Component, ChangeDetectionStrategy, signal, output, OnInit, DestroyRef, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
// import { HeroSwap } from '../../swap.models';
import { HERO_SWAPS } from '../../swap.mock-data';

@Component({
  selector: 'app-swap-hero',
  imports: [NgClass, MatIconModule, FormsModule, TranslatePipe],
  templateUrl: './swap-hero.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapHero implements OnInit {
  private destroyRef = inject(DestroyRef);

  heroSwaps = HERO_SWAPS;
  currentSlide = signal(0);
  searchQuery = signal('');

  search = output<string>();
  postItem = output<void>();

  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.startAutoSlide();
    this.destroyRef.onDestroy(() => this.stopAutoSlide());
  }

  nextSlide() {
    this.currentSlide.update((i) => (i + 1) % this.heroSwaps.length);
    this.restartAutoSlide();
  }

  prevSlide() {
    this.currentSlide.update((i) => (i - 1 + this.heroSwaps.length) % this.heroSwaps.length);
    this.restartAutoSlide();
  }

  goToSlide(index: number) {
    this.currentSlide.set(index);
    this.restartAutoSlide();
  }

  onSearch() {
    this.search.emit(this.searchQuery());
  }

  onPostItem() {
    this.postItem.emit();
  }

  private startAutoSlide() {
    this.intervalId = setInterval(() => this.nextSlide(), 5000);
  }

  private stopAutoSlide() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private restartAutoSlide() {
    this.stopAutoSlide();
    this.startAutoSlide();
  }
}
