import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgClass } from '@angular/common';
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
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  isEditing = signal(false);
  isLoading = signal(false);
  avatarUrl = signal<string | null>(null);
  selectedAvatarFile = signal<File | null>(null);
  deleteAvatar = signal(false);
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
    const maxDate = new Date(2015, 11, 31);
    return date >= minDate && date <= maxDate;
  };

  genderOptions = computed(() => {
    const currentGender = this.formValue().gender;
    const male = this.translationService.translate('profile.genderMale');
    const female = this.translationService.translate('profile.genderFemale');
    const notSpecified = this.translationService.translate('profile.genderNotSpecified');

    if (currentGender && currentGender !== '-') {
      return [male, female];
    }
    return [notSpecified, male, female];
  });

  form = this.fb.group({
    firstName: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(50), emptySpaceValidator()]),
    lastName: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(50), emptySpaceValidator()]),
    email: this.fb.control(''),
    countryCode: this.fb.control('+995'),
    phoneNumber: this.fb.control(''),
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
      gender: GenderUtil.toString(profile.gender),
    });

    this.originalFormValue = this.form.getRawValue();

    this.avatarUrl.set(profile.avatar_url || null);
  }

  private splitPhoneNumber(fullNumber: string | null): { code: string, number: string } {
    const defaultResult = { code: '+995', number: '' };

    if (!fullNumber) return defaultResult;

    const cleaned = PhoneUtil.sanitize(fullNumber.replace(/^tel:/i, ''));
    if (!cleaned) return defaultResult;

    const country = this.countries.find(c => cleaned.startsWith(c.dialCode));
    return country
      ? { code: country.dialCode, number: cleaned.substring(country.dialCode.length) }
      : defaultResult;
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
    this.clearAvatarState();

    if (this.originalFormValue) {
      this.form.patchValue(this.originalFormValue);
    }

    const userId = this.profileId();
    if (userId) {
      this.loadProfile(userId);
    }

    this.isEditing.set(false);
  }

  private clearAvatarState() {
    this.selectedAvatarFile.set(null);
    this.deleteAvatar.set(false);
  }

  private hasFormChanged(): boolean {
    if (!this.originalFormValue) return true;
    const current = this.form.getRawValue();
    return JSON.stringify(current) !== JSON.stringify(this.originalFormValue);
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
    console.log('Form values:', formValues);

    const fullPhone = formValues.phoneNumber ? `${formValues.countryCode}${formValues.phoneNumber}` : '';
    const normalizedPhone = PhoneUtil.normalizeForApi(fullPhone);

    const updateRequest: any = {
      name: formValues.firstName || '',
      surname: formValues.lastName || '',
    };

    console.log('Name:', formValues.firstName, 'Surname:', formValues.lastName);

    // Add optional fields with null if empty
    updateRequest.phone_number = (normalizedPhone && normalizedPhone !== '+995') ? normalizedPhone : null;
    updateRequest.birth_date = formValues.birthDate ? this.dateToIso(formValues.birthDate)! : null;
    updateRequest.location = formValues.location || null;
    updateRequest.gender = (formValues.gender && formValues.gender !== '-') ? GenderUtil.toBoolean(formValues.gender) : null;
    updateRequest.bio = formValues.bio || null;

    console.log('Update request payload:', JSON.stringify(updateRequest, null, 2));
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
        this.clearAvatarState();
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
    if ((err?.status === 413 || err?.status === 0) && this.selectedAvatarFile()) {
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
  onPhoneInput(event: Event): void {
    sanitizePhoneInput(event, this.form.controls.phoneNumber);
  }

  onAvatarFileSelected(file: File): void {
    this.selectedAvatarFile.set(file);
    this.deleteAvatar.set(false);
  }

  onAvatarDeleteRequested(): void {
    this.deleteAvatar.set(true);
    this.selectedAvatarFile.set(null);
    this.avatarUrl.set(null);
  }

  onTextInput(event: Event, controlName: 'firstName' | 'lastName'): void {
    sanitizeTextInput(event, this.form.controls[controlName]);
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
