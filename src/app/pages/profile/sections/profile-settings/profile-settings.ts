import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgClass, NgStyle } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { AuthService } from 'lib/services/identity/auth.service';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { UpdateProfileRequest } from 'lib/services/profile/models/profile.model';
import { formInputErrors } from 'lib/constants/enums/form-input-errors.enum';
import { PROFILE_STATS } from 'lib/constants';
import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { phoneNationalValidator } from 'lib/validators/phone-national.validator';
import { PhoneUtil } from 'lib/services/profile/utils/phone.util';
import { GenderUtil } from 'lib/services/profile/utils/gender.util';
import { COUNTRIES } from 'lib/constants/countries';
import { AvatarUploadComponent } from '../../../../../lib/components/avatar-upload/avatar-upload';
import { ChangePasswordDialogService } from '../../../../../lib/components/change-password-dialog/change-password-dialog.service';
import { SNACKBAR_MESSAGES } from 'lib/constants/enums/snackbar-messages.enum';
import { SnackbarService } from 'lib/services/snackbar.service';
import { sanitizeTextInput, sanitizePhoneInput } from 'lib/utils/input-sanitizers.util';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { ProfileSettingsSkeletonComponent } from '../../components/skeletons/profile-settings-skeleton';
import { VerificationService } from 'lib/services/verification/verification.service';
import { VerificationDialogService } from 'lib/components/verification-dialog/verification-dialog.service';
import { ChangeEmailDialogService } from 'lib/components/change-email-dialog/change-email-dialog.service';

@Component({
  selector: 'app-profile-settings',
  imports: [
    NgClass,
    NgStyle,
    RouterModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatOptionModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    AvatarUploadComponent,
    TranslatePipe,
    ProfileSettingsSkeletonComponent,

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
  private changePasswordDialog = inject(ChangePasswordDialogService);
  private translationService = inject(TranslationService);
  private verificationService = inject(VerificationService);
  private verificationDialog = inject(VerificationDialogService);
  private changeEmailDialog = inject(ChangeEmailDialogService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private isBrowser = isPlatformBrowser(this.platformId);

  isEditing = signal(false);
  isLoading = signal(false);
  isAvatarActionLoading = signal(false);
  isEmailChangeLoading = signal(false);
  avatarUrl = signal<string | null>(null);
  dateParseError = signal(false);
  originalFormValue: ReturnType<typeof this.form.getRawValue> | null = null;

  profileId = computed(() => this.auth.user()?.id ?? null);
  isVerified = this.verificationService.isVerified;

  ERRORS = formInputErrors;
  stats = PROFILE_STATS;
  countries = COUNTRIES;
  currentYear = new Date().getFullYear();
  defaultPickerDate = new Date(2000, 0, 1);

  birthDateFilter = (date: Date | null): boolean => {
    if (!date) return true;
    const minDate = new Date(1926, 0, 1);
    const maxDate = new Date(2009, 11, 31);
    return date >= minDate && date <= maxDate;
  };

  /** View mode label — form stores stable keys `male` | `female` | `-`, not translated text. */
  genderLabel = computed(() => {
    const g = this.formValue().gender;
    if (g === 'male' || g === 'კაცი' || g === 'Male') {
      return this.translationService.translate('profile.genderMale');
    }
    if (g === 'female' || g === 'ქალი' || g === 'Female') {
      return this.translationService.translate('profile.genderFemale');
    }
    return this.translationService.translate('profile.genderNotSpecified');
  });

  form = this.fb.group({
    firstName: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(50), emptySpaceValidator()]),
    lastName: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(50), emptySpaceValidator()]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    countryCode: this.fb.control('+995'),
    phoneNumber: this.fb.control('', [phoneNationalValidator()]),
    location: this.fb.control('', [Validators.maxLength(50)]),
    bio: this.fb.control('', [Validators.maxLength(400)]),
    birthDate: this.fb.control<Date | null>(null),
    gender: this.fb.control('-'),
  });

  formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.value)),
    { initialValue: this.form.value }
  );

  name = computed(() => {
    const { firstName = '', lastName = '' } = this.formValue();
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
    const { phoneNumber, countryCode } = this.formValue();
    return phoneNumber ? `${countryCode} ${phoneNumber}` : '';
  });

  ngOnInit() {
    this.form.controls.email.valueChanges.subscribe(() => {
      const errors = this.form.controls.email.errors;
      if (errors?.['alreadyRegistered']) {
        const { alreadyRegistered, ...rest } = errors;
        this.form.controls.email.setErrors(Object.keys(rest).length ? rest : null);
      }
    });

    const userId = this.profileId();
    if (userId) {
      this.loadProfile(userId);
    }
    //  else {
    //   this.prefillFromFallbacks();
    // }
  }

  loadProfile(profileId: string) {
    this.isLoading.set(true);
    this.profileApi.getProfile(profileId).subscribe({
      next: (profile) => {
        this.isLoading.set(false);
        this.patchFormWithProfile(profile);
      }
      // ,
      // error: (err) => {
      //   this.isLoading.set(false);
      //   this.handleLoadError(err);
      // },
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
      location: profile.location || '',
      bio: profile.bio || '',
      birthDate: this.isoToDate(profile.birth_date),
      gender: GenderUtil.toFormValue(profile.gender),
    });

    this.originalFormValue = this.form.getRawValue();

    this.avatarUrl.set(profile.avatar_url || null);
  }

  private splitPhoneNumber(fullNumber: string | null): { code: string, number: string } {
    return PhoneUtil.splitGePhone(fullNumber);
  }

  // private handleLoadError(err: any) {
  //   this.snackbar.error(
  //     err?.status === 404
  //       ? 'პროფილი ვერ მოიძებნა. გთხოვთ შექმნათ პროფილი.'
  //       : SNACKBAR_MESSAGES.ERROR_GENERIC
  //   );
  //   this.prefillFromFallbacks();
  // }

  // prefillFromFallbacks() {
  //   const pendingReg = this.auth.pendingRegistration();
  //   const user = this.auth.user();

  //   this.form.patchValue({
  //     firstName: localStorage.getItem('vipo_user_firstName') || pendingReg?.firstName || '',
  //     lastName: localStorage.getItem('vipo_user_lastName') || pendingReg?.lastName || '',
  //     email: localStorage.getItem('vipo_user_email') || pendingReg?.email || user?.email || '',
  //   });
  // }

  private isoToDate(isoDate: string): Date | null {
    if (!isoDate) return null;
    return new Date(isoDate + 'T00:00:00');
  }

  private dateToIso(date: Date | null): string | null {
    if (!date) return null;
    return date.toLocaleDateString('en-CA');
  }

  startEdit() {
    this.isEditing.set(true);
  }

  cancelEdit() {
    if (this.originalFormValue) {
      this.form.patchValue(this.originalFormValue);
    }

    const userId = this.profileId();
    if (userId) {
      this.loadProfile(userId);
    }

    this.isEditing.set(false);
  }

  private hasFormChanged(): boolean {
    if (!this.originalFormValue) return true;
    const current = this.getComparableFormValues(this.form.getRawValue());
    const original = this.getComparableFormValues(this.originalFormValue);
    return JSON.stringify(current) !== JSON.stringify(original);
  }

  private getComparableFormValues(values: ReturnType<typeof this.form.getRawValue>) {
    const { email, ...rest } = values;
    return rest;
  }

  save() {
    const userId = this.profileId();
    if (!userId) {
      this.snackbar.error(this.translationService.translate('profile.errors.notAuthenticated'));
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.hasFormChanged()) {
      this.isEditing.set(false);
      return;
    }

    const formValues = this.form.getRawValue();
    const fullPhone = PhoneUtil.toGeE164(formValues.phoneNumber);

    const updateRequest: any = {
      name: formValues.firstName || '',
      surname: formValues.lastName || '',
    };

    // Add optional fields with null if empty
    updateRequest.phone_number = (fullPhone && fullPhone !== '+995') ? fullPhone : null;
    updateRequest.birth_date = formValues.birthDate ? this.dateToIso(formValues.birthDate)! : null;
    updateRequest.location = formValues.location || null;
    updateRequest.gender =
      formValues.gender && formValues.gender !== '-' ? GenderUtil.toApiBoolean(formValues.gender) : null;
    updateRequest.bio = formValues.bio || null;

    this.isLoading.set(true);

    this.profileApi.updateProfile(updateRequest).subscribe({
      next: (profile) => {
        this.isLoading.set(false);

        if (this.isBrowser) {
          try {
            localStorage.setItem('vipo_user_firstName', profile.name);
            localStorage.setItem('vipo_user_lastName', profile.surname);
            window.dispatchEvent(new Event('profileUpdated'));
          } catch {
            // ignore
          }
        }

        this.patchFormWithProfile(profile);
        this.isEditing.set(false);
        this.snackbar.success(SNACKBAR_MESSAGES.SAVE_SUCCESS);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackbar.error(this.getErrorMessageFromResponse(err));
      },
    });
  }

  private getErrorMessageFromResponse(err: any): string {
    if (err?.status === 413 || err?.status === 0) {
      return this.translationService.translate('profile.errors.avatarTooLarge');
    }

    if (err?.status === 422 && Array.isArray(err?.error?.detail) && err.error.detail.length > 0) {
      const firstError = err.error.detail[0];

      if (firstError.loc && Array.isArray(firstError.loc) && firstError.loc.includes('phone_number')) {
        return this.translationService.translate('profile.errors.invalidPhoneFormat');
      }
      return typeof firstError === 'string' ? firstError : firstError.msg || SNACKBAR_MESSAGES.ERROR_GENERIC;
    }

    return err?.status === 500
      ? 'Server error (500). Check backend logs / profile_id might be wrong.'
      : SNACKBAR_MESSAGES.ERROR_GENERIC;
  }

  getErrorMessage(controlName: 'firstName' | 'lastName'): string {
    const control = this.form.controls[controlName];
    if (!control || !control.errors) return '';

    if (control.errors['required']) return this.ERRORS['required'];
    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength;
      return this.ERRORS['minlength'].replace('{n}', requiredLength);
    }
    if (control.errors['maxlength']) {
      const requiredLength = control.errors['maxlength'].requiredLength;
      return this.ERRORS['maxlength'].replace('{n}', requiredLength);
    }
    if (control.errors['emptySpace']) return this.ERRORS['emptySpace'];
    if (control.errors['edgeSpaces']) return this.ERRORS['edgeSpaces'];

    return '';
  }

  getPhoneErrorMessage(): string {
    const control = this.form.controls.phoneNumber;
    if (!control.errors) {
      return '';
    }

    if (control.errors['invalidPhone']) {
      return this.translationService.translate('profile.errors.invalidPhoneFormat');
    }

    return '';
  }

  onPhoneInput(event: Event): void {
    sanitizePhoneInput(event, this.form.controls.phoneNumber);
  }

  onPhoneBlur(): void {
    const control = this.form.controls.phoneNumber;
    control.markAsTouched();
    control.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  onAvatarFileSelected(file: File): void {
    const userId = this.profileId();
    if (!userId) {
      this.snackbar.error(this.translationService.translate('profile.errors.notAuthenticated'));
      return;
    }

    this.isAvatarActionLoading.set(true);
    this.profileApi.uploadAvatar(file).subscribe({
      next: (profile) => {
        this.isAvatarActionLoading.set(false);
        this.patchFormWithProfile(profile);
        this.snackbar.success(SNACKBAR_MESSAGES.SAVE_SUCCESS);
      },
      error: (err) => {
        this.isAvatarActionLoading.set(false);
        this.snackbar.error(this.getErrorMessageFromResponse(err));
      },
    });
  }

  onAvatarDeleteRequested(): void {
    const userId = this.profileId();
    if (!userId) {
      this.snackbar.error(this.translationService.translate('profile.errors.notAuthenticated'));
      return;
    }

    this.isAvatarActionLoading.set(true);
    this.profileApi.deleteAvatar().subscribe({
      next: (profile) => {
        this.isAvatarActionLoading.set(false);
        this.patchFormWithProfile(profile);
        this.snackbar.success(SNACKBAR_MESSAGES.SAVE_SUCCESS);
      },
      error: (err) => {
        this.isAvatarActionLoading.set(false);
        this.snackbar.error(this.getErrorMessageFromResponse(err));
      },
    });
  }

  onTextInput(event: Event, controlName: 'firstName' | 'lastName'): void {
    sanitizeTextInput(event, this.form.controls[controlName]);
  }

  hasPendingEmailChange(): boolean {
    const currentEmail = (this.auth.user()?.email ?? '').trim().toLowerCase();
    const editedEmail = this.form.controls.email.value.trim().toLowerCase();
    return !!editedEmail && editedEmail !== currentEmail;
  }

  requestEmailChange(): void {
    const emailControl = this.form.controls.email;
    const newEmail = emailControl.value.trim();
    const currentEmail = (this.auth.user()?.email ?? '').trim();

    if (emailControl.invalid) {
      emailControl.markAsTouched();
      return;
    }

    if (!newEmail || newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      return;
    }

    this.isEmailChangeLoading.set(true);
    this.auth.requestChangeEmail(newEmail).subscribe({
      next: () => {
        this.isEmailChangeLoading.set(false);
        this.changeEmailDialog.open({ newEmail }).subscribe(result => {
          if (!result) return;

          this.form.controls.email.setValue(result.email);
          this.auth.loadMe().subscribe({
            next: () => {
              this.form.controls.email.setValue(this.auth.user()?.email ?? result.email);
            },
            error: () => {
              // Keep optimistic value even if re-fetch fails.
            },
          });

          if (this.originalFormValue) {
            this.originalFormValue = {
              ...this.originalFormValue,
              email: result.email,
            };
          }
          this.snackbar.success(this.translationService.translate('profile.emailChange.success'));
        });
      },
      error: (err) => {
        this.isEmailChangeLoading.set(false);
        if (err?.status === 409) {
          emailControl.setErrors({ alreadyRegistered: true });
          emailControl.markAsTouched();
          return;
        }
        if (err?.status === 429) {
          this.snackbar.error(this.translationService.translate('validation.rateLimitExceeded'));
          return;
        }
        this.snackbar.error(SNACKBAR_MESSAGES.ERROR_GENERIC);
      },
    });
  }

  changePassword(): void {
    this.changePasswordDialog.open().subscribe(result => {
      if (result) {
        this.auth.changePassword({
          old_password: result.currentPassword,
          new_password: result.newPassword,
        }).subscribe({
          next: () => {
            this.snackbar.success(this.translationService.translate('profile.errors.passwordChangeSuccess'));
          },
          error: (err) => {
            if (err.status === 400) {
              this.snackbar.error(this.translationService.translate('profile.errors.incorrectCurrentPassword'));
            } else if (err.status === 401 ) {
              this.snackbar.error(this.translationService.translate('profile.errors.authenticationExpired'));
            } else if (err.status === 404) {
              this.snackbar.error(this.translationService.translate('profile.errors.userNotFound'));
            } else if (err.status === 422) {
              this.snackbar.error(this.translationService.translate('profile.errors.incorrectCurrentPassword'));
            }
          },
        });
      }
    });
  }

  openVerificationDialog(): void {
    this.verificationDialog.open().subscribe(data => {
      if (data) {
        this.verificationService.verify(data.idNumber);
        this.snackbar.success(this.translationService.translate('profile.verification.verified'));
      }
    });
  }

}
