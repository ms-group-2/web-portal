import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import {
  BookingProviderApiService,
  ServiceOfferingResponse,
  AvailabilityResponse,
  AvailabilityRequest,
  ResourceResponse,
} from 'lib/services/booking';

interface DaySchedule {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-settings-section',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    TranslatePipe,
  ],
  templateUrl: './settings-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSection implements OnInit {
  private fb = inject(FormBuilder);
  private providerApi = inject(BookingProviderApiService);
  private destroyRef = inject(DestroyRef);
  private translation = inject(TranslationService);

  isProvider = signal(false);
  isLoading = signal(true);

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
    this.initForms();
    this.loadProviderData();
  }

  // ── Services ───────────────────────────────────────────────────

  toggleServiceForm(): void {
    this.showServiceForm.update(v => !v);
    if (this.showServiceForm()) {
      this.serviceForm.reset({ capacity: 1 });
    }
  }

  saveService(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }
    const val = this.serviceForm.getRawValue();
    this.providerApi
      .createService(
        {
          name: val.name,
          description: val.description,
          session_duration: val.session_duration,
          session_price: val.session_price,
          capacity: val.capacity || 1,
        },
        { successMessage: this.translation.translate('vendor.settingsServices.saved') },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(created => {
        this.services.update(list => [...list, created]);
        this.showServiceForm.set(false);
      });
  }

  toggleServiceActive(service: ServiceOfferingResponse): void {
    this.providerApi
      .updateService(service.id, { is_active: !service.is_active })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => {
        this.services.update(list =>
          list.map(s => (s.id === updated.id ? updated : s)),
        );
      });
  }

  deleteService(service: ServiceOfferingResponse): void {
    const msg = this.translation.translate('vendor.settingsServices.deleteConfirm');
    if (!confirm(msg)) return;

    this.providerApi
      .deleteService(service.id, {
        successMessage: this.translation.translate('vendor.settingsServices.deleted'),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.services.update(list => list.filter(s => s.id !== service.id));
      });
  }

  // ── Availability ───────────────────────────────────────────────

  toggleDay(index: number): void {
    this.weekSchedule.update(schedule => {
      const updated = [...schedule];
      updated[index] = { ...updated[index], enabled: !updated[index].enabled };
      return updated;
    });
  }

  updateDayTime(index: number, field: 'startTime' | 'endTime', value: string): void {
    this.weekSchedule.update(schedule => {
      const updated = [...schedule];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  saveSchedule(): void {
    this.savingSchedule.set(true);
    const body: AvailabilityRequest[] = this.weekSchedule()
      .filter(d => d.enabled)
      .map(d => ({
        day_of_week: d.dayOfWeek,
        start_time: d.startTime,
        end_time: d.endTime,
      }));

    this.providerApi
      .setAvailability(body, {
        successMessage: this.translation.translate('vendor.settingsAvailability.saved'),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.applyAvailabilityToSchedule(saved);
          this.savingSchedule.set(false);
        },
        error: () => this.savingSchedule.set(false),
      });
  }

  // ── Resources ──────────────────────────────────────────────────

  toggleResourceForm(): void {
    this.showResourceForm.update(v => !v);
    if (this.showResourceForm()) {
      this.resourceForm.reset();
    }
  }

  saveResource(): void {
    if (this.resourceForm.invalid) {
      this.resourceForm.markAllAsTouched();
      return;
    }
    const val = this.resourceForm.getRawValue();
    this.providerApi
      .createResource(
        { name: val.name },
        { successMessage: this.translation.translate('vendor.settingsResources.saved') },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(created => {
        this.resources.update(list => [...list, created]);
        this.showResourceForm.set(false);
      });
  }

  deleteResource(resource: ResourceResponse): void {
    const msg = this.translation.translate('vendor.settingsResources.deleteConfirm');
    if (!confirm(msg)) return;

    this.providerApi
      .deleteResource(resource.id, {
        successMessage: this.translation.translate('vendor.settingsResources.deleted'),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.resources.update(list => list.filter(r => r.id !== resource.id));
      });
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

  private loadProviderData(): void {
    this.providerApi
      .getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isProvider.set(true);
          this.isLoading.set(false);
          this.loadServices();
          this.loadAvailability();
          this.loadResources();
        },
        error: () => {
          this.isProvider.set(false);
          this.isLoading.set(false);
        },
      });
  }

  private loadServices(): void {
    this.providerApi
      .getServices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => this.services.set(list));
  }

  private loadAvailability(): void {
    this.providerApi
      .getAvailability()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => this.applyAvailabilityToSchedule(list));
  }

  private loadResources(): void {
    this.providerApi
      .getResources()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => this.resources.set(list));
  }

  private applyAvailabilityToSchedule(availability: AvailabilityResponse[]): void {
    this.weekSchedule.update(schedule =>
      schedule.map(day => {
        const match = availability.find(a => a.day_of_week === day.dayOfWeek);
        return match
          ? { ...day, enabled: true, startTime: match.start_time, endTime: match.end_time }
          : { ...day, enabled: false };
      }),
    );
  }
}
