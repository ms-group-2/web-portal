import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from 'lib/pipes/translate.pipe';

@Component({
  selector: 'app-settings-section',
  imports: [TranslatePipe],
  templateUrl: './settings-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSection {}
