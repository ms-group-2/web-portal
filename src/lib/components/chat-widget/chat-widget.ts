import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  ElementRef,
  viewChild,
  effect,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { ChatService } from 'lib/services/chat/chat.service';

@Component({
  selector: 'app-chat-widget',
  imports: [MatIconModule, MatButtonModule, TranslatePipe],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWidget {
  chatService = inject(ChatService);

  color = input<string>('var(--color-primary)');

  private messagesContainer = viewChild<ElementRef<HTMLElement>>('messagesContainer');

  constructor() {

    effect(() => {
      this.chatService.messages();
      this.chatService.isLoading();
      const el = this.messagesContainer()?.nativeElement;
      if (el) {
        setTimeout(() => el.scrollTop = el.scrollHeight);
      }
    });
  }

  send(input: HTMLTextAreaElement) {
    this.chatService.sendMessage(input.value);
    input.value = '';
    input.style.height = 'auto';
  }

  onEnter(event: Event) {
    const ke = event as KeyboardEvent;
    if (ke.shiftKey) return;
    ke.preventDefault();
    const textarea = ke.target as HTMLTextAreaElement;
    this.send(textarea);
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  }

  formatMessage(text: string): string {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" class="text-blue-600 underline break-all">$1</a>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n/g, '<br>');
    return html;
  }
}
