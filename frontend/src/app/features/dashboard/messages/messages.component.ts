import { Component, OnInit, inject, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Message } from '../../../core/models/content.model';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex h-[calc(100vh-8rem)] gap-0 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm bg-white dark:bg-dark">

      <!-- Inbox List -->
      <div class="w-72 flex-shrink-0 border-r border-gray-100 dark:border-white/10 flex flex-col">
        <div class="p-4 border-b border-gray-100 dark:border-white/10">
          <h2 class="font-semibold text-dark dark:text-white">Messages</h2>
        </div>
        <div class="flex-1 overflow-y-auto">
          @if (inbox().length === 0) {
            <div class="p-6 text-center text-gray-400 text-sm">
              <span class="material-icons text-4xl text-gray-200 block mb-2">chat_bubble_outline</span>
              No conversations yet
            </div>
          } @else {
            @for (msg of inbox(); track msg.id) {
              <button (click)="openConversation(msg.sender!.id)"
                      class="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border-b border-gray-50 dark:border-white/5"
                      [class.bg-primary/5]="activeUserId() === msg.sender!.id">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {{ msg.sender?.fullName?.[0] || 'U' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-dark dark:text-white text-sm truncate">{{ msg.sender?.fullName }}</p>
                  <p class="text-gray-400 text-xs truncate">{{ msg.content }}</p>
                </div>
                @if (!msg.isRead) {
                  <div class="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                }
              </button>
            }
          }
        </div>
      </div>

      <!-- Conversation -->
      <div class="flex-1 flex flex-col">
        @if (!activeUserId()) {
          <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
            <span class="material-icons text-6xl text-gray-200 block mb-4">forum</span>
            <h3 class="font-semibold text-dark dark:text-white mb-1">Select a conversation</h3>
            <p class="text-gray-400 text-sm">Choose a conversation from the left to start chatting</p>
          </div>
        } @else {
          <!-- Header -->
          <div class="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-white/10">
            <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {{ activeUser()?.fullName?.[0] || 'U' }}
            </div>
            <div>
              <p class="font-semibold text-dark dark:text-white text-sm">{{ activeUser()?.fullName || 'User' }}</p>
              <p class="text-green-500 text-xs">Online</p>
            </div>
          </div>

          <!-- Messages -->
          <div #messagesContainer class="flex-1 overflow-y-auto p-4 space-y-3">
            @for (msg of messages(); track msg.id) {
              <div class="flex" [class.justify-end]="msg.senderId === auth.currentUser()?.id">
                <div class="max-w-xs lg:max-w-md">
                  <div class="px-4 py-2.5 rounded-2xl text-sm"
                       [class]="msg.senderId === auth.currentUser()?.id
                         ? 'bg-primary text-white rounded-br-sm'
                         : 'bg-gray-100 dark:bg-white/10 text-dark dark:text-white rounded-bl-sm'">
                    {{ msg.content }}
                  </div>
                  <p class="text-gray-400 text-xs mt-1 px-1" [class.text-right]="msg.senderId === auth.currentUser()?.id">
                    {{ msg.createdAt | date:'h:mm a' }}
                    @if (msg.senderId === auth.currentUser()?.id) {
                      <span class="material-icons text-xs ml-1" [class]="msg.isRead ? 'text-primary' : 'text-gray-300'">
                        done_all
                      </span>
                    }
                  </p>
                </div>
              </div>
            }
            @if (messages().length === 0) {
              <div class="text-center py-8 text-gray-400 text-sm">
                Start the conversation!
              </div>
            }
          </div>

          <!-- Input -->
          <div class="p-4 border-t border-gray-100 dark:border-white/10">
            <div class="flex items-center gap-3">
              <input [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" type="text"
                     placeholder="Type a message..."
                     class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
              <button (click)="sendMessage()" [disabled]="!newMessage.trim()"
                      class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-900 disabled:opacity-40 transition-colors">
                <span class="material-icons text-base">send</span>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class MessagesComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private container!: ElementRef;
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly inbox = signal<Message[]>([]);
  readonly messages = signal<Message[]>([]);
  readonly activeUserId = signal('');
  readonly activeUser = signal<any>(null);
  newMessage = '';

  ngOnInit(): void {
    this.api.get<any>('messages/inbox').subscribe({
      next: (data) => this.inbox.set(Array.isArray(data) ? data : data.data || []),
    });
  }

  ngAfterViewChecked(): void {
    if (this.container) {
      this.container.nativeElement.scrollTop = this.container.nativeElement.scrollHeight;
    }
  }

  openConversation(userId: string): void {
    this.activeUserId.set(userId);
    const found = this.inbox().find(m => m.sender?.id === userId);
    this.activeUser.set(found?.sender || null);
    this.api.get<any>(`messages/${userId}`).subscribe({
      next: (data) => this.messages.set(data.data || data || []),
    });
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content || !this.activeUserId()) return;
    this.newMessage = '';
    this.api.post<Message>('messages', { receiverId: this.activeUserId(), content }).subscribe({
      next: (msg) => this.messages.update(ms => [...ms, msg]),
    });
  }
}
