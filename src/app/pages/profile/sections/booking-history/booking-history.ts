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

type FilterTab = 'all' | 'upcoming' | 'completed' | 'cancelled';

@Component({
  selector: 'app-booking-history',
  imports: [MatIconModule, TranslatePipe, DatePipe],
  templateUrl: './booking-history.html',
  styleUrl: './booking-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingHistoryComponent implements OnInit {
  private bookingApi = inject(BookingApiService);
  private destroyRef = inject(DestroyRef);
  private translation = inject(TranslationService);

  bookings = signal<BookingResponse[]>([]);
  isLoading = signal(false);
  activeFilter = signal<FilterTab>('all');
  page = signal(0);
  hasMore = signal(true);

  filteredBookings = computed(() => {
    const all = this.bookings();
    const filter = this.activeFilter();
    if (filter === 'all') return all;
    if (filter === 'upcoming') {
      return all.filter(b => b.status === 'PENDING' || b.status === 'PENDING_PAYMENT' || b.status === 'APPROVED');
    }
    if (filter === 'completed') return all.filter(b => b.status === 'COMPLETED');
    return all.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED');
  });

  ngOnInit(): void {
    this.loadBookings();
  }

  setFilter(filter: FilterTab): void {
    this.activeFilter.set(filter);
    this.bookings.set([]);
    this.page.set(0);
    this.hasMore.set(true);
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading.set(true);
    const statusFilter = this.getStatusFilter();

    this.bookingApi
      .getMyBookings(this.page(), 20, statusFilter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.bookings.update(prev => [...prev, ...data]);
          this.hasMore.set(data.length === 20);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  loadMore(): void {
    this.page.update(p => p + 1);
    this.loadBookings();
  }

  cancelBooking(booking: BookingResponse): void {
    const msg = this.translation.translate('booking.history.cancelConfirm');
    if (!confirm(msg)) return;

    this.bookingApi
      .cancelBooking(booking.id, {
        successMessage: this.translation.translate('booking.status.CANCELLED'),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => {
        this.bookings.update(list =>
          list.map(b => (b.id === updated.id ? updated : b)),
        );
      });
  }

  retryPayment(booking: BookingResponse): void {
    this.bookingApi
      .retryPayment(booking.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => {
        if (updated.payment_url) {
          window.open(updated.payment_url, '_blank');
        }
        this.bookings.update(list =>
          list.map(b => (b.id === updated.id ? updated : b)),
        );
      });
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

  getStatusIcon(status: BookingStatus): string {
    switch (status) {
      case 'APPROVED':
        return 'check_circle';
      case 'PENDING':
      case 'PENDING_PAYMENT':
        return 'schedule';
      case 'COMPLETED':
        return 'task_alt';
      case 'CANCELLED':
      case 'REJECTED':
        return 'cancel';
      case 'NO_SHOW':
        return 'person_off';
      default:
        return 'info';
    }
  }

  canCancel(booking: BookingResponse): boolean {
    return booking.status === 'PENDING' || booking.status === 'APPROVED';
  }

  canRetryPayment(booking: BookingResponse): boolean {
    return booking.status === 'PENDING_PAYMENT';
  }

  private getStatusFilter(): BookingStatus[] | undefined {
    const filter = this.activeFilter();
    if (filter === 'upcoming') return ['PENDING', 'PENDING_PAYMENT', 'APPROVED'];
    if (filter === 'completed') return ['COMPLETED'];
    if (filter === 'cancelled') return ['CANCELLED', 'REJECTED'];
    return undefined;
  }
}
