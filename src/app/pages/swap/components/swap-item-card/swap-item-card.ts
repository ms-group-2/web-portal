import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { SwapItem } from '../../swap.models';
import { SwapListingPhoto } from '../swap-listing-photo/swap-listing-photo';

@Component({
  selector: 'app-swap-item-card',
  imports: [NgClass, MatIconModule, TranslatePipe, SwapListingPhoto],
  templateUrl: './swap-item-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwapItemCard {
  private translation = inject(TranslationService);

  item = input.required<SwapItem>();
  isFavorite = input(false);
  isExchanged = input(false);

  favoriteToggle = output<Event>();
  cardClick = output<void>();

  activeBoostTier = computed(() => {
    const i = this.item();
    if (!i.boost_tier || !i.boost_expires_at) return null;
    if (new Date(i.boost_expires_at).getTime() <= Date.now()) return null;
    return i.boost_tier;
  });

  getStickerColor(code: string): string {
    const v = code.toLowerCase();
    if (v.includes('gold') || v.includes('premium')) return 'bg-gradient-to-r from-yellow-500 to-amber-500';
    if (v.includes('hot') || v.includes('fire')) return 'bg-gradient-to-r from-red-500 to-orange-500';
    if (v.includes('new')) return 'bg-gradient-to-r from-emerald-500 to-green-500';
    if (v.includes('urgent') || v.includes('flash')) return 'bg-gradient-to-r from-pink-500 to-rose-500';
    return 'bg-gradient-to-r from-purple-500 to-swap';
  }

  getStickerIcon(code: string): string {
    const v = code.toLowerCase();
    if (v.includes('gold') || v.includes('premium')) return 'workspace_premium';
    if (v.includes('hot') || v.includes('fire')) return 'local_fire_department';
    if (v.includes('new')) return 'new_releases';
    return 'style';
  }

  getStickerLabel(code: string): string {
    const key = 'swap.stickerNames.' + code;
    const translated = this.translation.translate(key);
    return translated === key ? code.replace(/_/g, ' ') : translated;
  }

  onToggleFavorite(event: Event) {
    event.stopPropagation();
    this.favoriteToggle.emit(event);
  }

  onCardClick() {
    this.cardClick.emit();
  }
}
