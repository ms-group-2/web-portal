import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { RegistrationStep } from 'lib/models/vendor.models';

@Component({
  selector: 'app-progress-stepper',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './progress-stepper.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressStepperComponent {
  currentStep = input.required<number>();
  steps = input.required<RegistrationStep[]>();
}
