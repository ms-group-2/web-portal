import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from 'lib/services/identity/auth.service';
import { PROFILE_STATS, CONTACT_FIELDS, ContactTheme, RECENT_ACTIVITIES } from 'lib/constants';

@Component({
  selector: 'app-profile',
  imports: [MatButtonModule, MatIconModule, ReactiveFormsModule, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private fb = inject(NonNullableFormBuilder);

  isEditing = signal(false);
  
  firstName = signal('');
  lastName = signal('');
  name = signal('');
  email = signal('');
  phone = signal('');
  location = signal('');
  bio = signal('');
  age = signal('28');
  gender = signal('Non-binary');

  stats = PROFILE_STATS;
  contactFields = CONTACT_FIELDS;
  activities = RECENT_ACTIVITIES;

  getFieldValue(fieldKey: 'email' | 'phone' | 'location'): string {
    switch (fieldKey) {
      case 'email':
        return this.email();
      case 'phone':
        return this.phone();
      case 'location':
        return this.location();
      default:
        return '';
    }
  }

  getIconBgClass(theme: ContactTheme): string {
    return `bg-${theme}`;
  }

  getIconTextClass(theme: ContactTheme): string {
    return theme === 'swap' ? 'text-black' : 'text-white';
  }

  getHoverBorderClass(theme: ContactTheme): string {
    return `hover:border-${theme}`;
  }

  genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

  form = this.fb.group({
    firstName: this.fb.control(''),
    lastName: this.fb.control(''),
    name: this.fb.control(''),
    email: this.fb.control(''),
    phone: this.fb.control(''),
    location: this.fb.control(''),
    bio: this.fb.control(''),
    age: this.fb.control(''),
    gender: this.fb.control(''),
  });

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const storedFirstName = localStorage.getItem('vipo_user_firstName') || '';
    const storedLastName = localStorage.getItem('vipo_user_lastName') || '';
    const storedEmail = localStorage.getItem('vipo_user_email') || '';

    const user = this.auth.user();
    const emailFromUser = user?.email || '';

    const pendingReg = this.auth.pendingRegistration();
    const firstNameFromPending = pendingReg?.firstName || '';
    const lastNameFromPending = pendingReg?.lastName || '';
    const emailFromPending = pendingReg?.email || '';

    const firstName = storedFirstName || firstNameFromPending;
    const lastName = storedLastName || lastNameFromPending;
    const email = storedEmail || emailFromPending || emailFromUser;

    this.firstName.set(firstName);
    this.lastName.set(lastName);
    this.name.set(`${firstName} ${lastName}`.trim() || '');
    this.email.set(email);
    
    this.form.patchValue({
      firstName: firstName,
      lastName: lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: email,
      phone: this.phone(),
      location: this.location(),
      bio: this.bio(),
      age: this.age(),
      gender: this.gender(),
    });
  }

  toggleEdit() {
    if (this.isEditing()) {
      const formValue = this.form.getRawValue();
      const firstName = formValue.firstName || '';
      const lastName = formValue.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      this.firstName.set(firstName);
      this.lastName.set(lastName);
      this.name.set(fullName);
      this.phone.set(formValue.phone || '');
      this.location.set(formValue.location || '');
      this.bio.set(formValue.bio || '');
      this.age.set(formValue.age || '');
      this.gender.set(formValue.gender || '');

      if (firstName) localStorage.setItem('vipo_user_firstName', firstName);
      if (lastName) localStorage.setItem('vipo_user_lastName', lastName);
    } else {
      this.form.patchValue({
        firstName: this.firstName(),
        lastName: this.lastName(),
        name: this.name(),
        phone: this.phone(),
        location: this.location(),
        bio: this.bio(),
        age: this.age(),
        gender: this.gender(),
      });
    }
    this.isEditing.set(!this.isEditing());
  }

  goBack() {
    this.router.navigateByUrl('/landing');
  }

  deleteAccount() {
    console.log('Delete account');
  }
}

