import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { BookingApiService } from 'lib/services/booking/booking-api.service';
import { BookingResponse, BookingStatus } from 'lib/services/booking/models/booking.models';

type ProviderFilter = 'all' | 'pending' | 'approved' | 'completed';

@Component({
  selector: 'app-orders-section',
  imports: [MatIconModule, TranslatePipe, DatePipe],
  templateUrl: './orders-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersSection implements OnInit {
  private bookingApi = inject(BookingApiService);
  private destroyRef = inject(DestroyRef);
  private translation = inject(TranslationService);

  bookings = signal<BookingResponse[]>([]);
  isLoading = signal(false);
  activeFilter = signal<ProviderFilter>('all');

  filteredBookings = computed(() => {
    const all = this.bookings();
    const filter = this.activeFilter();
    if (filter === 'all') return all;
    if (filter === 'pending') return all.filter(b => b.status === 'PENDING' || b.status === 'PENDING_PAYMENT');
    if (filter === 'approved') return all.filter(b => b.status === 'APPROVED');
    return all.filter(b => b.status === 'COMPLETED' || b.status === 'NO_SHOW');
  });

  pendingCount = computed(() =>
    this.bookings().filter(b => b.status === 'PENDING').length,
  );

  ngOnInit(): void {
    this.translation.loadModule('booking').subscribe();
    this.loadBookings();
  }

  setFilter(filter: ProviderFilter): void {
    this.activeFilter.set(filter);
  }

  loadBookings(): void {
    this.isLoading.set(true);
    this.bookingApi
      .getProviderSeries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (series) => {
          const allBookings = series.flatMap(s => s.bookings);
          allBookings.sort((a, b) =>
            new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime(),
          );
          this.bookings.set(allBookings);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.loadFallback();
        },
      });
  }

  approveBooking(booking: BookingResponse): void {
    const msg = this.translation.translate('booking.management.approveConfirm');
    if (!confirm(msg)) return;

    this.bookingApi
      .approveBooking(booking.id, {
        successMessage: this.translation.translate('booking.status.APPROVED'),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => this.updateBookingInList(updated));
  }

  rejectBooking(booking: BookingResponse): void {
    const msg = this.translation.translate('booking.management.rejectConfirm');
    if (!confirm(msg)) return;

    this.bookingApi
      .rejectBooking(booking.id, {
        successMessage: this.translation.translate('booking.status.REJECTED'),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => this.updateBookingInList(updated));
  }

  completeBooking(booking: BookingResponse): void {
    const msg = this.translation.translate('booking.management.completeConfirm');
    if (!confirm(msg)) return;

    this.bookingApi
      .completeBooking(booking.id, {
        successMessage: this.translation.translate('booking.status.COMPLETED'),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => this.updateBookingInList(updated));
  }

  noShowBooking(booking: BookingResponse): void {
    const msg = this.translation.translate('booking.management.noShowConfirm');
    if (!confirm(msg)) return;

    this.bookingApi
      .noShowBooking(booking.id, {
        successMessage: this.translation.translate('booking.status.NO_SHOW'),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => this.updateBookingInList(updated));
  }

  cancelBooking(booking: BookingResponse): void {
    this.bookingApi
      .cancelBooking(booking.id, {
        successMessage: this.translation.translate('booking.status.CANCELLED'),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => this.updateBookingInList(updated));
  }

  getStatusClass(status: BookingStatus): string {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
      case 'PENDING_PAYMENT':
        return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  canApprove(booking: BookingResponse): boolean {
    return booking.status === 'PENDING';
  }

  canReject(booking: BookingResponse): boolean {
    return booking.status === 'PENDING';
  }

  canComplete(booking: BookingResponse): boolean {
    return booking.status === 'APPROVED';
  }

  canNoShow(booking: BookingResponse): boolean {
    return booking.status === 'APPROVED';
  }

  canCancel(booking: BookingResponse): boolean {
    return booking.status === 'PENDING' || booking.status === 'APPROVED';
  }

  private updateBookingInList(updated: BookingResponse): void {
    this.bookings.update(list =>
      list.map(b => (b.id === updated.id ? updated : b)),
    );
  }

  private loadFallback(): void {
    this.bookingApi
      .getMyBookings(0, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.bookings.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }
}
