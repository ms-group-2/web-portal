import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import { TiltDirective } from 'lib/directives/tilt.directive';
import { FEATURED_HOSTS } from '../../booking.mock-data';

@Component({
  selector: 'app-booking-featured-hosts',
  imports: [MatIconModule, TranslatePipe, ScrollAnimateDirective, TiltDirective],
  templateUrl: './booking-featured-hosts.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingFeaturedHosts {
  hosts = FEATURED_HOSTS;
}
