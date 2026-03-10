import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

export interface SwiperConfig {
  slidesPerView?: number | 'auto';
  spaceBetween?: number;
  pagination?: boolean;
  navigation?: boolean;
  breakpoints?: Record<string, { slidesPerView: number }>;
}

@Component({
  selector: 'app-swiper',
  imports: [],
  templateUrl: './swiper.html',
  styleUrl: './swiper.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Swiper {
  config = input<SwiperConfig>({
    slidesPerView: 'auto',
    spaceBetween: 16,
    pagination: false,
    navigation: true,
  });

  styleClass = input<string>('');

  get breakpointsJson(): string | null {
    const breakpoints = this.config().breakpoints;
    return breakpoints && Object.keys(breakpoints).length > 0
      ? JSON.stringify(breakpoints)
      : null;
  }
}
