import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ScrollAnimateDirective } from 'lib/directives/scroll-animate.directive';
import { AiMatch } from '../../swap.models';

@Component({
  selector: 'app-swap-ai-match',
  imports: [MatIconModule, TranslatePipe, ScrollAnimateDirective],
  templateUrl: './swap-ai-match.html',
  styleUrl: './swap-ai-match.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapAiMatch {
  aiMatches = input.required<AiMatch[]>();
}
