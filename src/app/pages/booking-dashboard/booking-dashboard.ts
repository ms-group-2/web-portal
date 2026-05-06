import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { AuthService } from 'lib/services/identity/auth.service';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { Profile } from 'lib/services/profile/models/profile.model';
import {
  BookingProviderApiService,
  BookingApiService,
  ProviderProfileResponse,
  ServiceOfferingResponse,
  AvailabilityResponse,
  AvailabilityRequest,
  ResourceResponse,
  BookingResponse,
  BookingStatus,
} from 'lib/services/booking';

type BookingTab = 'overview' | 'orders' | 'services' | 'availability' | 'resources';

interface DaySchedule {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface NavTab {
  id: BookingTab;
  icon: string;
  labelKey: string;
}

const TABS: NavTab[] = [
  { id: 'overview', icon: 'ph-squares-four', labelKey: 'bookingDashboard.tabs.overview' },
  { id: 'orders', icon: 'ph-calendar-check', labelKey: 'bookingDashboard.tabs.orders' },
  { id: 'services', icon: 'ph-wrench', labelKey: 'bookingDashboard.tabs.services' },
  { id: 'availability', icon: 'ph-calendar-blank', labelKey: 'bookingDashboard.tabs.availability' },
  { id: 'resources', icon: 'ph-buildings', labelKey: 'bookingDashboard.tabs.resources' },
];

const VALID_TABS: readonly BookingTab[] = ['overview', 'orders', 'services', 'availability', 'resources'];

function tabFromParams(params: Params): BookingTab {
  const raw = params['tab'];
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s || typeof s !== 'string') return 'overview';
  return VALID_TABS.includes(s as BookingTab) ? (s as BookingTab) : 'overview';
}

@Component({
  selector: 'app-booking-dashboard',
  imports: [
    NgClass,
    DatePipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    TranslatePipe,
  ],
  templateUrl: './booking-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingDashboard implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  translation = inject(TranslationService);
  private auth = inject(AuthService);
  private profileApi = inject(ProfileApiService);
  private providerApi = inject(BookingProviderApiService);
  private bookingApi = inject(BookingApiService);

  provider = signal<ProviderProfileResponse | null>(null);
  userProfile = signal<Profile | null>(null);
  isLoading = signal(true);
  activeTab = signal<BookingTab>(tabFromParams(this.route.snapshot.queryParams));
  sidebarOpen = signal(false);
  tabs = TABS;

  // Orders
  bookings = signal<BookingResponse[]>([]);
  ordersLoading = signal(false);
  orderFilter = signal<'all' | 'pending' | 'approved' | 'completed'>('all');

  filteredBookings = computed(() => {
    const all = this.bookings();
    const f = this.orderFilter();
    if (f === 'all') return all;
    if (f === 'pending') return all.filter(b => b.status === 'PENDING' || b.status === 'PENDING_PAYMENT');
    if (f === 'approved') return all.filter(b => b.status === 'APPROVED');
    return all.filter(b => b.status === 'COMPLETED' || b.status === 'NO_SHOW');
  });

  pendingCount = computed(() => this.bookings().filter(b => b.status === 'PENDING').length);

  // Services
  services = signal<ServiceOfferingResponse[]>([]);
  showServiceForm = signal(false);
  serviceForm!: FormGroup;

  // Availability
  weekSchedule = signal<DaySchedule[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      enabled: i >= 1 && i <= 5,
      startTime: '09:00',
      endTime: '18:00',
    })),
  );
  savingSchedule = signal(false);

  // Resources
  resources = signal<ResourceResponse[]>([]);
  showResourceForm = signal(false);
  resourceForm!: FormGroup;

  ngOnInit(): void {
    this.translation.loadModule('vendor').subscribe();
    this.translation.loadModule('booking').subscribe();
    this.translation.loadModule('profile').subscribe();
    this.initForms();
    this.loadProvider();
    this.loadUserProfile();

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => {
        if (p['tab']) this.setTab(tabFromParams(p), false);
      });
  }

  // ── Navigation ─────────────────────────────────────────────────

  setTab(tab: BookingTab, syncUrl = true): void {
    this.activeTab.set(tab);
    if (syncUrl) {
      const current = this.route.snapshot.queryParams['tab'];
      if (current !== tab) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { tab },
          queryParamsHandling: 'merge',
        });
      }
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  goBack(): void {
    this.router.navigate(['/profile/booking-provider']);
  }

  // ── Orders ─────────────────────────────────────────────────────

  setOrderFilter(f: 'all' | 'pending' | 'approved' | 'completed'): void {
    this.orderFilter.set(f);
  }

  getStatusClass(status: BookingStatus): string {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'PENDING': case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED': return 'bg-blue-100 text-blue-700';
      case 'CANCELLED': case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'NO_SHOW': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  approveBooking(b: BookingResponse): void {
    this.bookingApi
      .approveBooking(b.id, { successMessage: this.translation.translate('booking.status.APPROVED') })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(u => this.updateBooking(u));
  }

  rejectBooking(b: BookingResponse): void {
    this.bookingApi
      .rejectBooking(b.id, { successMessage: this.translation.translate('booking.status.REJECTED') })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(u => this.updateBooking(u));
  }

  completeBooking(b: BookingResponse): void {
    this.bookingApi
      .completeBooking(b.id, { successMessage: this.translation.translate('booking.status.COMPLETED') })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(u => this.updateBooking(u));
  }

  cancelBooking(b: BookingResponse): void {
    this.bookingApi
      .cancelBooking(b.id, { successMessage: this.translation.translate('booking.status.CANCELLED') })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(u => this.updateBooking(u));
  }

  // ── Services ───────────────────────────────────────────────────

  toggleServiceForm(): void {
    this.showServiceForm.update(v => !v);
    if (this.showServiceForm()) this.serviceForm.reset({ capacity: 1 });
  }

  saveService(): void {
    if (this.serviceForm.invalid) { this.serviceForm.markAllAsTouched(); return; }
    const v = this.serviceForm.getRawValue();
    this.providerApi
      .createService(
        { name: v.name, description: v.description, session_duration: v.session_duration, session_price: v.session_price, capacity: v.capacity || 1 },
        { successMessage: this.translation.translate('vendor.settingsServices.saved') },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(c => { this.services.update(l => [...l, c]); this.showServiceForm.set(false); });
  }

  toggleServiceActive(s: ServiceOfferingResponse): void {
    this.providerApi
      .updateService(s.id, { is_active: !s.is_active })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(u => this.services.update(l => l.map(x => x.id === u.id ? u : x)));
  }

  deleteService(s: ServiceOfferingResponse): void {
    if (!confirm(this.translation.translate('vendor.settingsServices.deleteConfirm'))) return;
    this.providerApi
      .deleteService(s.id, { successMessage: this.translation.translate('vendor.settingsServices.deleted') })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.services.update(l => l.filter(x => x.id !== s.id)));
  }

  // ── Availability ───────────────────────────────────────────────

  toggleDay(i: number): void {
    this.weekSchedule.update(s => { const u = [...s]; u[i] = { ...u[i], enabled: !u[i].enabled }; return u; });
  }

  updateDayTime(i: number, field: 'startTime' | 'endTime', value: string): void {
    this.weekSchedule.update(s => { const u = [...s]; u[i] = { ...u[i], [field]: value }; return u; });
  }

  saveSchedule(): void {
    this.savingSchedule.set(true);
    const body: AvailabilityRequest[] = this.weekSchedule()
      .filter(d => d.enabled)
      .map(d => ({ day_of_week: d.dayOfWeek, start_time: d.startTime, end_time: d.endTime }));

    this.providerApi
      .setAvailability(body, { successMessage: this.translation.translate('vendor.settingsAvailability.saved') })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: saved => { this.applyAvailability(saved); this.savingSchedule.set(false); },
        error: () => this.savingSchedule.set(false),
      });
  }

  // ── Resources ──────────────────────────────────────────────────

  toggleResourceForm(): void {
    this.showResourceForm.update(v => !v);
    if (this.showResourceForm()) this.resourceForm.reset();
  }

  saveResource(): void {
    if (this.resourceForm.invalid) { this.resourceForm.markAllAsTouched(); return; }
    this.providerApi
      .createResource(
        { name: this.resourceForm.getRawValue().name },
        { successMessage: this.translation.translate('vendor.settingsResources.saved') },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(c => { this.resources.update(l => [...l, c]); this.showResourceForm.set(false); });
  }

  deleteResource(r: ResourceResponse): void {
    if (!confirm(this.translation.translate('vendor.settingsResources.deleteConfirm'))) return;
    this.providerApi
      .deleteResource(r.id, { successMessage: this.translation.translate('vendor.settingsResources.deleted') })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resources.update(l => l.filter(x => x.id !== r.id)));
  }

  // ── Private ────────────────────────────────────────────────────

  private initForms(): void {
    this.serviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(300)]],
      session_duration: [null, [Validators.required, Validators.min(5)]],
      session_price: [null, [Validators.required, Validators.min(0)]],
      capacity: [1, [Validators.min(1)]],
    });
    this.resourceForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  private loadProvider(): void {
    this.providerApi
      .getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: p => {
          this.provider.set(p);
          this.isLoading.set(false);
          this.loadServices();
          this.loadAvailability();
          this.loadResources();
          this.loadOrders();
        },
        error: () => this.isLoading.set(false),
      });
  }

  private loadUserProfile(): void {
    const userId = this.auth.user()?.id;
    if (userId) {
      this.profileApi.getProfile(userId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(p => this.userProfile.set(p));
    }
  }

  private loadServices(): void {
    this.providerApi.getServices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(l => this.services.set(l));
  }

  private loadAvailability(): void {
    this.providerApi.getAvailability()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(l => this.applyAvailability(l));
  }

  private loadResources(): void {
    this.providerApi.getResources()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(l => this.resources.set(l));
  }

  private loadOrders(): void {
    this.ordersLoading.set(true);
    this.bookingApi.getProviderSeries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: series => {
          const all = series.flatMap(s => s.bookings);
          all.sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());
          this.bookings.set(all);
          this.ordersLoading.set(false);
        },
        error: () => this.ordersLoading.set(false),
      });
  }

  private updateBooking(updated: BookingResponse): void {
    this.bookings.update(l => l.map(b => b.id === updated.id ? updated : b));
  }

  private applyAvailability(list: AvailabilityResponse[]): void {
    this.weekSchedule.update(schedule =>
      schedule.map(day => {
        const match = list.find(a => a.day_of_week === day.dayOfWeek);
        return match
          ? { ...day, enabled: true, startTime: match.start_time, endTime: match.end_time }
          : { ...day, enabled: false };
      }),
    );
  }
}
