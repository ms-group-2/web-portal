import {
  Component,
  ChangeDetectionStrategy,
  inject,
  ElementRef,
  viewChild,
  effect,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ChatService } from 'lib/services/chat/chat.service';
import { TranslationService } from 'lib/services/translation.service';

@Component({
  selector: 'app-chat-widget',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWidget {
  chatService = inject(ChatService);
  private translation = inject(TranslationService);

  hasInput = signal(false);

  private messagesContainer = viewChild<ElementRef<HTMLElement>>('messagesContainer');
  private messageInput = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');


  //eseni bolos
  // quickActions = [
  //   { icon: 'swap_horiz', translationKey: 'chat.action.swap', bgColor: '#90427b' },
  //   { icon: 'shopping_bag', translationKey: 'chat.action.shop', bgColor: '#3E5AD8' },
  //   { icon: 'calendar_today', translationKey: 'chat.action.book', bgColor: '#80CBC4' },
  //   { icon: 'trending_up', translationKey: 'chat.action.trending', bgColor: '#F3B582' },
  // ];

  welcomeSuggestions = [
    'chat.suggestion.findSwap',
    'chat.suggestion.shopProducts',
    'chat.suggestion.bookService',
    'chat.suggestion.browseDeals',
  ];

  constructor() {
    effect(() => {
      this.chatService.messages();
      this.chatService.isLoading();
      const el = this.messagesContainer()?.nativeElement;
      if (el) {
        setTimeout(() => (el.scrollTop = el.scrollHeight));
      }
    });
  }

  send(input: HTMLTextAreaElement) {
    this.chatService.sendMessage(input.value);
    input.value = '';
    input.style.height = 'auto';
    this.hasInput.set(false);
  }

  onEnter(event: Event) {
    const ke = event as KeyboardEvent;
    if (ke.shiftKey) return;
    ke.preventDefault();
    const textarea = ke.target as HTMLTextAreaElement;
    this.send(textarea);
  }

  onInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.hasInput.set(textarea.value.trim().length > 0);
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  }

  onSuggestionClick(translationKey: string) {
    const input = this.messageInput()?.nativeElement;
    if (input) {
      input.value = this.translation.translate(translationKey);
      this.hasInput.set(true);
      input.focus();
    }
  }

  onQuickAction(translationKey: string) {
    this.chatService.sendMessage(this.translation.translate(translationKey));
  }

  formatMessage(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" class="text-blue-600 underline break-all">$1</a>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n/g, '<br>');
  }
}
