import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { AuthService } from 'lib/services/identity/auth.service';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { UpdateProfileRequest } from 'lib/services/profile/models/profile.model';
import { SnackbarService } from 'lib/services/snackbar.service';
import { SNACKBAR_MESSAGES } from 'lib/constants/enums/snackbar-messages.enum';
import { formInputErrors } from 'lib/constants/enums/form-input-errors.enum';
import { PROFILE_STATS } from 'lib/constants';
import { emptySpaceValidator } from 'lib/validators/empty-space.validator';
import { PhoneUtil } from 'lib/services/profile/utils/phone.util';
import { GenderUtil } from 'lib/services/profile/utils/gender.util';
import { COUNTRIES } from 'lib/constants/countries';
import { AvatarUploadComponent } from '../../../../../lib/components/avatar-upload/avatar-upload';
import { sanitizeTextInput, sanitizePhoneInput } from 'lib/utils/input-sanitizers.util';
import { ChangePasswordDialogService } from '../../../../../lib/components/change-password-dialog/change-password-dialog.service';

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
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    AvatarUploadComponent
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

  isEditing = signal(false);
  isLoading = signal(false);
  avatarUrl = signal<string | null>(null);
  selectedAvatarFile = signal<File | null>(null);
  deleteAvatar = signal(false);
  dateParseError = signal(false);
  originalFormValue: ReturnType<typeof this.form.getRawValue> | null = null;

  profileId = computed(() => this.auth.user()?.id ?? null);

  ERRORS = formInputErrors;
  stats = PROFILE_STATS;
  countries = COUNTRIES;
  currentYear = new Date().getFullYear();

  birthDateFilter = (date: Date | null): boolean => {
    if (!date) return true;
    const minDate = new Date(1926, 0, 1);
    const maxDate = new Date(2019, 11, 31);
    return date >= minDate && date <= maxDate;
  };

  genderOptions = computed(() => {
    const currentGender = this.formValue().gender;
    if (currentGender && currentGender !== '-') {
      return ['კაცი', 'ქალი'];
    }
    return ['-', 'კაცი', 'ქალი'];
  });

  form = this.fb.group({
    firstName: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(60), emptySpaceValidator()]),
    lastName: this.fb.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(60), emptySpaceValidator()]),
    email: this.fb.control(''),
    countryCode: this.fb.control('+995'),
    phoneNumber: this.fb.control(''),
    location: this.fb.control(''),
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
      location: profile.location,
      bio: profile.bio,
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
      this.snackbar.error('მომხმარებელი არ არის ავტორიზებული');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.hasFormChanged() && !this.selectedAvatarFile() && !this.deleteAvatar()) {
      this.isEditing.set(false);
      return;
    }

    const formValues = this.form.getRawValue();
    const fullPhone = formValues.phoneNumber ? `${formValues.countryCode}${formValues.phoneNumber}` : '';
    const normalizedPhone = PhoneUtil.normalizeForApi(fullPhone);

    const updateRequest: UpdateProfileRequest = {
      name: formValues.firstName ?? '',
      surname: formValues.lastName ?? '',
      ...(normalizedPhone && normalizedPhone !== '+995' && { phone_number: normalizedPhone }),
      ...(formValues.birthDate && { birth_date: this.dateToIso(formValues.birthDate)! }),
      location: formValues.location ?? '',
      gender: GenderUtil.toBoolean(formValues.gender ?? '-'),
      bio: formValues.bio ?? '',
      ...(this.selectedAvatarFile() && { avatar: this.selectedAvatarFile()! }),
      ...(this.deleteAvatar() && { delete_avatar: true }),
    };

    this.isLoading.set(true);
    this.profileApi.updateProfile(userId, updateRequest).subscribe({
      next: (profile) => {
        this.isLoading.set(false);

        // Update localStorage for sidebar sync
        localStorage.setItem('vipo_user_firstName', profile.name);
        localStorage.setItem('vipo_user_lastName', profile.surname);
        window.dispatchEvent(new Event('profileUpdated'));

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
      return 'ავატარის ზომა აღემატება 5მბ-ს';
    }

    if (err?.status === 422 && Array.isArray(err?.error?.detail) && err.error.detail.length > 0) {
      const firstError = err.error.detail[0];

      if (firstError.loc && Array.isArray(firstError.loc) && firstError.loc.includes('phone_number')) {
        return 'ნომრის არასწორი ფორმატი არჩეული ქვეყნისთვის';
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

  getOptionalFieldClasses(hasValue: boolean): string {
    return hasValue ? 'text-gray-700 font-bold' : 'text-gray-500 font-normal';
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
            this.snackbar.success('პაროლი წარმატებით შეიცვალა');
          },
          error: (err) => {
            if (err.status === 400) {
              this.snackbar.error('შეყვანილი ახლანდელი პაროლი არასწორია');
            } else if (err.status === 401 ) {
              this.snackbar.error('ავტორიზაცია ვადაგასულია. გთხოვთ ხელახლა შეხვიდეთ სისტემაში');
            } else if (err.status === 404) {
              this.snackbar.error('მომხმარებელი ვერ მოიძებნა');
            }
          },
        });
      }
    });
  }

}

