import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { startWith } from 'rxjs/operators';
import { AuthService } from 'lib/services/identity/auth.service';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { SnackbarService } from 'lib/services/snackbar.service';
import { SNACKBAR_MESSAGES } from 'lib/constants/enums/snackbar-messages.enum';
import { formInputErrors } from 'lib/constants/enums/form-input-errors.enum';
import { PROFILE_STATS } from 'lib/constants';
import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { edgeSpacesValidator } from 'lib/validators/password-strength.validator';
import { PhoneUtil } from 'lib/services/profile/utils/phone.util';
import { GenderUtil } from 'lib/services/profile/utils/gender.util';
import { COUNTRIES } from 'lib/constants/countries';

@Component({
  selector: 'app-profile-settings',
  imports: [
    NgClass,
    RouterModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatOptionModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './profile-settings.html',
  styleUrls: [
    './profile-settings.scss',
    '../../../../../lib/themes/material/material-date-picker.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSettingsComponent implements OnInit {
  private auth = inject(AuthService);
  private profileApi = inject(ProfileApiService);
  private snackbar = inject(SnackbarService);
  private fb = inject(NonNullableFormBuilder);

  isEditing = signal(false);
  isLoading = signal(false);

  profileId = computed(() => this.auth.user()?.id ?? null);

  ERRORS = formInputErrors;
  stats = PROFILE_STATS;
  genderOptions = ['-', 'კაცი', 'ქალი'];
  countries = COUNTRIES;

  form = this.fb.group({
    firstName: this.fb.control('', [Validators.required, Validators.minLength(3), emptySpaceValidator(), edgeSpacesValidator()]),
    lastName: this.fb.control('', [Validators.required, Validators.minLength(3), emptySpaceValidator(), edgeSpacesValidator()]),
    email: this.fb.control(''),
    countryCode: this.fb.control('+995'),
    phoneNumber: this.fb.control(''),
    location: this.fb.control(''),
    bio: this.fb.control(''),
    birthDate: this.fb.control<Date | null>(null),
    gender: this.fb.control('-'),
  });

  formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.value)),
    { initialValue: this.form.value }
  );

  name = computed(() => {
    const v = this.formValue();
    const firstName = v.firstName || '';
    const lastName = v.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'User';
  });

  age = computed(() => {
    const birthDate = this.formValue().birthDate;
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return '';
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age}` : '';
  });

  phoneDisplay = computed(() => {
    const formVal = this.formValue();
    if (formVal.phoneNumber) {
      return `${formVal.countryCode} ${formVal.phoneNumber}`;
    }
    return '';
  });

  ngOnInit() {
    const userId = this.profileId();
    if (userId) {
      this.loadProfile(userId);
    } else {
      this.prefillFromFallbacks();
    }
  }

  loadProfile(profileId: string) {
    this.isLoading.set(true);
    this.profileApi.getProfile(profileId).subscribe({
      next: (profile) => {
        this.isLoading.set(false);
        this.patchFormWithProfile(profile);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.handleLoadError(err);
      },
    });
  }

  private patchFormWithProfile(profile: any) {
    const { code, number } = this.splitPhoneNumber(profile.phone_number);

    this.form.patchValue({
      firstName: profile.name,
      lastName: profile.surname,
      email: this.auth.user()?.email || '',
      countryCode: code,
      phoneNumber: number,
      location: profile.location,
      bio: profile.bio,
      birthDate: this.isoToDate(profile.birth_date),
      gender: GenderUtil.toString(profile.gender),
    });
  }

  private splitPhoneNumber(fullNumber: string | null): { code: string, number: string } {
    if (!fullNumber) return { code: '+995', number: '' };

    const cleaned = PhoneUtil.sanitize(fullNumber.replace(/^tel:/i, ''));

    if (!cleaned) return { code: '+995', number: '' };

    const country = this.countries.find(c => cleaned.startsWith(c.dialCode));
    if (country) {
      return {
        code: country.dialCode,
        number: cleaned.substring(country.dialCode.length)
      };
    }

    return { code: '+995', number: '' };
  }

  private handleLoadError(err: any) {
    const message = err?.status === 404
      ? 'პროფილი ვერ მოიძებნა. გთხოვთ შექმნათ პროფილი.'
      : SNACKBAR_MESSAGES.ERROR_GENERIC;

    this.snackbar.error(message);
    this.prefillFromFallbacks();
  }

  prefillFromFallbacks() {
    const pendingReg = this.auth.pendingRegistration();

    this.form.patchValue({
      firstName: localStorage.getItem('vipo_user_firstName') || pendingReg?.firstName || '',
      lastName: localStorage.getItem('vipo_user_lastName') || pendingReg?.lastName || '',
      email: localStorage.getItem('vipo_user_email') || pendingReg?.email || this.auth.user()?.email || '',
    });
  }

  private isoToDate(isoDate: string): Date | null {
    return isoDate ? new Date(isoDate) : null;
  }

  private dateToIso(date: Date | null): string | null {
    return date ? date.toISOString().split('T')[0] : null;
  }

  startEdit() {
    this.isEditing.set(true);
  }

  save() {
    const userId = this.profileId();
    if (!userId) {
      this.snackbar.error('მომხმარებელი არ არის ავტორიზებული');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValues = this.form.getRawValue();
    const birthDate = this.dateToIso(formValues.birthDate);
    const fullPhone = formValues.phoneNumber
      ? `${formValues.countryCode}${formValues.phoneNumber}`
      : '';
    const normalizedPhone = PhoneUtil.normalizeForApi(fullPhone);
    const gender = GenderUtil.toBoolean(formValues.gender ?? '-');

    const updateRequest = {
      name: formValues.firstName ?? '',
      surname: formValues.lastName ?? '',
      ...(normalizedPhone && normalizedPhone !== '+995' ? { phone_number: normalizedPhone } : {}),
      ...(birthDate ? { birth_date: birthDate } : {}),
      location: formValues.location ?? '',
      gender: gender,
      bio: formValues.bio ?? '',
    };

    this.isLoading.set(true);
    this.profileApi.updateProfile(userId, updateRequest).subscribe({
      next: (profile) => {
        this.isLoading.set(false);

        // local storage update sidebaristvis
        localStorage.setItem('vipo_user_firstName', profile.name);
        localStorage.setItem('vipo_user_lastName', profile.surname);
        window.dispatchEvent(new Event('profileUpdated'));

        this.patchFormWithProfile(profile);
        this.isEditing.set(false);
        this.snackbar.success(SNACKBAR_MESSAGES.SAVE_SUCCESS);
      },
      error: (err) => {
        this.isLoading.set(false);

        if (err?.status === 422 && Array.isArray(err?.error?.detail) && err.error.detail.length > 0) {
          const firstError = err.error.detail[0];

          if (firstError.loc && Array.isArray(firstError.loc) && firstError.loc.includes('phone_number')) {
            this.snackbar.error('ნომრის არასწორი ფორმატი არჩეული ქვეყნისთვის');
            return;
          }
          const errorMsg = typeof firstError === 'string' ? firstError : firstError.msg || SNACKBAR_MESSAGES.ERROR_GENERIC;
          this.snackbar.error(errorMsg);
          return;
        }

        const errorMsg = err?.status === 500
          ? 'Server error (500). Check backend logs / profile_id might be wrong.'
          : SNACKBAR_MESSAGES.ERROR_GENERIC;

        this.snackbar.error(errorMsg);
      },
    });
  }

  getErrorMessage(controlName: 'firstName' | 'lastName'): string {
    const control = this.form.controls[controlName];
    if (!control || !control.errors) return '';

    if (control.errors['required']) return this.ERRORS['required'];
    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength;
      return this.ERRORS['minlength'].replace('{n}', requiredLength);
    }
    if (control.errors['emptySpace']) return this.ERRORS['emptySpace'];
    if (control.errors['edgeSpaces']) return this.ERRORS['edgeSpaces'];

    return '';
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filtered = input.value.replace(/\D/g, '');

    if (input.value !== filtered) {
      this.form.controls.phoneNumber.setValue(filtered);
    }
  }
}

