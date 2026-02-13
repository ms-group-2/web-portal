import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-addresses',
  imports: [RouterModule, MatIconModule],
  templateUrl: './addresses.html',
  styleUrl: './addresses.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressesComponent {}

