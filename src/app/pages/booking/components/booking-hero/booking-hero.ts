import { Component, ChangeDetectionStrategy, signal, output, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { HERO_SLIDES } from '../../booking.mock-data';

@Component({
  selector: 'app-booking-hero',
  imports: [FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './booking-hero.html',
  styleUrl: './booking-hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingHero implements OnInit {
  private destroyRef = inject(DestroyRef);

  slides = HERO_SLIDES;
  currentIndex = signal(0);
  slideDirection = signal<'next' | 'prev'>('next');
  searchQuery = signal('');
  searchLocation = signal('');

  search = output<{ query: string; location: string }>();

  currentSlide = computed(() => this.slides[this.currentIndex()]);

  ngOnInit() {
    const intervalId = setInterval(() => this.nextSlide(), 3000);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }

  nextSlide() {
    this.slideDirection.set('next');
    this.currentIndex.update(i => (i + 1) % this.slides.length);
  }

  prevSlide() {
    this.slideDirection.set('prev');
    this.currentIndex.update(i => (i - 1 + this.slides.length) % this.slides.length);
  }

  goToSlide(index: number) {
    this.slideDirection.set(index > this.currentIndex() ? 'next' : 'prev');
    this.currentIndex.set(index);
  }

  onSearch() {
    this.search.emit({
      query: this.searchQuery(),
      location: this.searchLocation(),
    });
  }
}
