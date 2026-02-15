import { FormControl } from '@angular/forms';

export function sanitizeTextInput(event: Event, control: FormControl): void {
  const input = event.target as HTMLInputElement;
  if (!input) return;

  const sanitized = input.value.replace(/[^a-zA-Zა-ჰ]/g, '');
  input.value = sanitized;
  control.setValue(sanitized);
}

export function sanitizePasswordInput(event: Event, control: FormControl): void {
  const input = event.target as HTMLInputElement;
  if (!input) return;

  const sanitized = input.value.replace(/[^A-Za-z0-9!@#$%^&*(),.?":{}|<>]/g, '');
  input.value = sanitized;
  control.setValue(sanitized);
}

export function sanitizePhoneInput(event: Event, control: FormControl): void {
  const input = event.target as HTMLInputElement;
  if (!input) return;

  const filtered = input.value.replace(/\D/g, '');
  if (input.value !== filtered) {
    control.setValue(filtered);
  }
}
