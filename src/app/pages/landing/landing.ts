import { Component, OnInit, DestroyRef, ElementRef, ViewChild, signal, inject, effect, computed } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Header } from "lib/components/header/header";
import { Footer } from "lib/components/footer/footer";
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { TranslationService } from 'lib/services/translation.service';
import { ChatService } from 'lib/services/chat/chat.service';
import { ShopService } from 'lib/services/shop/shop.service';
import { Product } from '../shop/shop.models';

interface ProductPreviewCard {
  productId: number;
  sourceUrl: string;
  loading: boolean;
  product: Product | null;
}

@Component({
  selector: 'app-landing',
  imports: [ MatButtonModule, MatIconModule, FormsModule, Header, Footer, TranslatePipe, RouterLink],
  templateUrl: './landing.html',
  styleUrls: ['./landing.scss']
})
export class Landing implements OnInit {
  private router = inject(Router);
  translation = inject(TranslationService);
  chatService = inject(ChatService);
  private shopService = inject(ShopService);
  private destroyRef = inject(DestroyRef);
  private extractedProductIds = new Set<number>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  inputValue = signal<string>('');
  showProductRail = signal<boolean>(true);
  productPreviewCards = signal<ProductPreviewCard[]>([]);
  hasVisibleProductRail = computed(() => this.showProductRail() && this.productPreviewCards().length > 0);

  constructor() {
    effect(() => {
      const messages = this.chatService.messages();
      if (!messages.length) return;
      this.scrollToBottom();

      for (const message of messages) {
        if (message.role !== 'bot' || !message.text) continue;

        const links = this.extractLinks(message.text);
        for (const link of links) {
          const productId = this.extractProductId(link);
          if (!productId || this.extractedProductIds.has(productId)) continue;
          this.extractedProductIds.add(productId);
          this.upsertProductPreview(productId, link);
        }
      }
    });
  }

  ngOnInit() {
    this.translation.loadModule('landing')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

  closeProductRail(): void {
    this.showProductRail.set(false);
  }

  openProductRail(): void {
    this.showProductRail.set(true);
  }

  removeProductCard(productId: number): void {
    this.productPreviewCards.update(cards => cards.filter(card => card.productId !== productId));
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }

  handleSend(): void {
    const value = this.inputValue().trim();
    if (!value || this.chatService.isBusy()) return;

    this.chatService.sendMessage(value);
    this.inputValue.set('');
  }

  handleQuickAction(action: string): void {
    const promptMap: Record<string, string> = {
      swap: this.translation.translate('landing.hero.promptSwap'),
      shop: this.translation.translate('landing.hero.promptShop'),
      book: this.translation.translate('landing.hero.promptBook'),
    };

    const prompt = promptMap[action];
    if (!prompt) return;

    this.inputValue.set(prompt);
    this.handleSend();
  }

  private upsertProductPreview(productId: number, sourceUrl: string): void {
    const existing = this.productPreviewCards().find(card => card.productId === productId);
    if (existing) {
      this.productPreviewCards.update(cards => {
        const matched = cards.find(card => card.productId === productId);
        if (!matched) return cards;
        const filtered = cards.filter(card => card.productId !== productId);
        return [{ ...matched, sourceUrl }, ...filtered];
      });
      this.showProductRail.set(true);
      return;
    }

    this.productPreviewCards.update(cards => [
      {
        productId,
        sourceUrl,
        loading: true,
        product: null,
      },
      ...cards,
    ]);
    this.showProductRail.set(true);

    this.shopService.getProductById(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(product => {
        this.productPreviewCards.update(cards => cards.map(card =>
          card.productId === productId
            ? { ...card, product, loading: false }
            : card,
        ));
      });
  }

  private extractLinks(text: string): string[] {
    const matches = text.match(/(https?:\/\/[^\s<)]+|\/shop\/product\/\d+[^\s<)]*)/g);
    if (!matches) return [];
    return matches.map(link => link.replace(/[.,!?;:]+$/, ''));
  }

  private extractProductId(link: string): number | null {
    const match = link.match(/\/shop\/product\/(\d+)/);
    if (!match) return null;
    const id = Number(match[1]);
    return Number.isNaN(id) ? null : id;
  }
}
