import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { VerificationService } from 'lib/services/verification/verification.service';
import {
  BookingProviderApiService,
  BookingCatalogApiService,
  CategoryResponse,
  ProviderProfileRequest,
  ProviderCallType,
  ProviderBusinessType,
} from 'lib/services/booking';
import { phoneNationalValidator } from 'lib/validators/phone-national.validator';
import { sanitizePhoneInput } from 'lib/utils/input-sanitizers.util';
import { PhoneUtil } from 'lib/services/profile/utils/phone.util';
import { Footer } from 'lib/components/footer/footer';

@Component({
  selector: 'app-booking-registration',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    TranslatePipe,
    Footer,
  ],
  templateUrl: './booking-registration.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingRegistrationComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  translation = inject(TranslationService);
  private verificationService = inject(VerificationService);
  private providerApi = inject(BookingProviderApiService);
  private catalogApi = inject(BookingCatalogApiService);

  isVerified = this.verificationService.isVerified;

  currentStep = signal<1 | 2>(1);
  submitting = signal(false);
  categories = signal<CategoryResponse[]>([]);

  readonly callTypeOptions: ProviderCallType[] = ['ONSITE', 'OUTCALL', 'BOTH'];
  readonly providerBusinessTypeOptions: ProviderBusinessType[] = ['INDIVIDUAL', 'COMPANY'];
  readonly COUNTRY_CODE = PhoneUtil.GE_DIAL_CODE;

  providerForm!: FormGroup;

  ngOnInit(): void {
    this.translation.loadModule('profile').subscribe();
    this.translation.loadModule('validation').subscribe();
    this.loadCategories();
    this.initForm();
  }

  onPhoneInput(event: Event): void {
    const control = this.providerForm.get('phone_number') as FormControl | null;
    if (control) {
      sanitizePhoneInput(event, control);
    }
  }

  getErrorMessage(fieldName: string): string {
    const control = this.providerForm.get(fieldName);
    const errors = control?.errors as Record<string, unknown> | null;
    if (!errors) return '';

    const key = Object.keys(errors)[0];
    if (key === 'minlength') {
      const err = errors['minlength'] as { requiredLength: number };
      return this.translation.translate('validation.minlength', { n: err.requiredLength });
    }
    if (key === 'maxlength') {
      const err = errors['maxlength'] as { requiredLength: number };
      return this.translation.translate('validation.maxlength', { n: err.requiredLength });
    }
    if (key === 'invalidPhone') {
      return this.translation.translate('profile.errors.invalidPhoneFormat');
    }
    return `validation.${key}`;
  }

  goToReview(): void {
    if (this.providerForm.valid) {
      this.currentStep.set(2);
    } else {
      this.providerForm.markAllAsTouched();
    }
  }

  goBackToForm(): void {
    this.currentStep.set(1);
  }

  getCategoryName(categoryId: number): string {
    return this.categories().find(c => c.id === categoryId)?.name ?? '';
  }

  getFormValue(): ProviderProfileRequest {
    const raw = this.providerForm.getRawValue();
    return {
      name: raw.name,
      description: raw.description?.trim() || undefined,
      phone_number: PhoneUtil.toGeE164((raw.phone_number ?? '').toString()),
      call_type: raw.call_type,
      business_type: raw.business_type,
      category_id: Number(raw.category_id),
    };
  }

  onSubmit(): void {
    this.submitting.set(true);
    const payload = this.getFormValue();

    this.providerApi
      .upsertProfile(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(
            this.translation.translate('bookingRegistration.success'),
            'Close',
            { duration: 3000 },
          );
          this.submitting.set(false);
          this.router.navigate(['/profile/booking-provider']);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          const httpErr = err instanceof HttpErrorResponse ? err : null;
          const body = httpErr?.error as { message?: string } | null;
          const msg =
            typeof body?.message === 'string' && body.message.trim()
              ? body.message
              : this.translation.translate('bookingRegistration.error');
          this.snackBar.open(msg, 'Close', { duration: 4000 });
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/profile/booking-provider']);
  }

  private initForm(): void {
    this.providerForm = this.fb.group({
      name: this.fb.control('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
      ]),
      description: this.fb.control('', [Validators.maxLength(300)]),
      phone_number: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(9),
          Validators.pattern(/^\d+$/),
          phoneNationalValidator(),
        ],
        updateOn: 'blur',
      }),
      call_type: this.fb.control('ONSITE', [Validators.required]),
      business_type: this.fb.control('INDIVIDUAL', [Validators.required]),
      category_id: this.fb.control(null, [Validators.required]),
    });
  }

  private loadCategories(): void {
    this.catalogApi
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cats => this.categories.set(cats));
  }
}
