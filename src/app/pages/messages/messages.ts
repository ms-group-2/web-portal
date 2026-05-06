import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  signal,
  computed,
  effect,
  DestroyRef,
  viewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Header } from 'lib/components/header/header';
import { TranslatePipe } from 'lib/pipes/translate.pipe';
import { MessagingService } from 'lib/services/messaging/messaging.service';
import { AuthService } from 'lib/services/identity/auth.service';
import { ProfileApiService } from 'lib/services/profile/profile-api.service';
import { Profile } from 'lib/services/profile/models/profile.model';
import { ConversationPreview } from 'lib/services/messaging/models/messaging.model';
import { formatRelativeShort } from 'lib/utils/relative-time';

interface ConversationView extends ConversationPreview {
  otherName: string;
  otherAvatar: string;
}

@Component({
  selector: 'app-messages',
  imports: [MatIconModule, FormsModule, RouterLink, Header, TranslatePipe],
  templateUrl: './messages.html',
  styleUrl: './messages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Messages implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  messaging = inject(MessagingService);
  private auth = inject(AuthService);
  private profileApi = inject(ProfileApiService);

  messageInput = signal('');
  profileCache = signal<Map<string, Profile>>(new Map());
  messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  conversationViews = computed<ConversationView[]>(() => {
    const convos = this.messaging.conversations();
    const cache = this.profileCache();
    return convos.map(c => {
      const profile = cache.get(c.other_user_id);
      return {
        ...c,
        otherName: profile ? `${profile.name} ${profile.surname}` : '',
        otherAvatar: profile?.avatar_url ?? '',
      };
    });
  });

  activeConvo = computed(() => {
    const id = this.messaging.activeConversationId();
    return this.conversationViews().find(c => c.id === id) ?? null;
  });

  activeMessages = this.messaging.activeMessages;
  isTyping = computed(() => {
    const id = this.messaging.activeConversationId();
    if (!id) return false;
    return this.messaging.typingUsers().get(id) ?? false;
  });

  currentUserId = computed(() => this.auth.user()?.id ?? '');

  constructor() {
    this.messaging.init();

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('conversationId');
        if (id) {
          this.messaging.openConversation(id);
        }
      });

    this.messaging.stateChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.cdr.markForCheck();
        this.scrollToBottom();
      });

    effect(() => {
      const convos = this.messaging.conversations();
      for (const c of convos) {
        if (!this.profileCache().has(c.other_user_id)) {
          this.resolveProfile(c.other_user_id);
        }
      }
    });

    effect(() => {
      const msgs = this.activeMessages();
      if (msgs.length > 0) {
        this.scrollToBottom();
      }
    });
  }

  ngOnDestroy(): void {
    this.messaging.teardown();
  }

  goBack(): void {
    this.location.back();
  }

  selectConversation(convo: ConversationView): void {
    this.router.navigate(['/messages', convo.id]);
  }

  goBackToList(): void {
    this.messaging.closeConversation();
    this.router.navigate(['/messages']);
  }

  sendMessage(): void {
    const content = this.messageInput().trim();
    const convoId = this.messaging.activeConversationId();
    if (!content || !convoId) return;

    this.messaging.sendMessage(convoId, content);
    this.messageInput.set('');
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onTyping(): void {
    const convoId = this.messaging.activeConversationId();
    if (convoId) {
      this.messaging.sendTyping(convoId);
    }
  }

  formatTime(dateStr: string): string {
    return formatRelativeShort(dateStr);
  }

  formatMessageTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isSentByMe(senderId: string): boolean {
    return senderId === this.currentUserId();
  }

  isLastMessageMine(convoId: string): boolean {
    const msgs = this.messaging.messages().get(convoId);
    if (!msgs?.length) return false;
    return msgs[msgs.length - 1].sender_id === this.currentUserId();
  }

  trackByConvo(_: number, c: ConversationView): string {
    return c.id;
  }

  trackByMsg(_: number, m: { id: string }): string {
    return m.id;
  }

  private resolveProfile(userId: string): void {
    this.profileApi.getProfile(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(profile => {
        this.profileCache.update(map => {
          const next = new Map(map);
          next.set(userId, profile);
          return next;
        });
      });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesContainer()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
