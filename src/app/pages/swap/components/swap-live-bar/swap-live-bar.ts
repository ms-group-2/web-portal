import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { LiveActivity } from '../../swap.models';


@Component({
  selector: 'app-swap-live-bar',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './swap-live-bar.html',
  styleUrl: './swap-live-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapLiveBar {
  liveActivities = input.required<LiveActivity[]>();
  onlineUsers = input.required<number>();

}
