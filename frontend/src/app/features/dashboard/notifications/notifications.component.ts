import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Notification } from '../../../core/models/content.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-display text-2xl font-bold text-dark dark:text-white">Notifications</h1>
          <p class="text-gray-500 dark:text-white/50 text-sm">{{ unreadCount() }} unread</p>
        </div>
        @if (unreadCount() > 0) {
          <button (click)="markAllRead()"
                  class="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            <span class="material-icons text-base">done_all</span> Mark all read
          </button>
        }
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton h-16 rounded-2xl"></div>
          }
        </div>
      } @else if (notifications().length === 0) {
        <div class="text-center py-16 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
          <span class="material-icons text-5xl text-gray-200 block mb-3">notifications_none</span>
          <p class="text-gray-400">No notifications yet</p>
        </div>
      } @else {
        <div class="space-y-2">
          @for (n of notifications(); track n.id) {
            <div (click)="markRead(n.id)"
                 class="flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer"
                 [class]="n.isRead
                   ? 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 hover:border-gray-200'
                   : 'bg-primary/3 border-primary/20 dark:bg-primary/10'">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   [class]="n.isRead ? 'bg-gray-100 dark:bg-white/10' : 'bg-primary/10'">
                <span class="material-icons text-lg" [class]="n.isRead ? 'text-gray-400' : 'text-primary'">
                  {{ getIcon(n.type) }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm" [class]="n.isRead ? 'text-gray-700 dark:text-white/70' : 'text-dark dark:text-white'">
                  {{ n.title }}
                </p>
                <p class="text-gray-500 dark:text-white/40 text-xs mt-0.5 line-clamp-1">{{ n.body }}</p>
                <p class="text-gray-400 text-xs mt-1">{{ n.createdAt | date:'MMM d, h:mm a' }}</p>
              </div>
              @if (!n.isRead) {
                <div class="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0"></div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly notifications = signal<Notification[]>([]);
  readonly loading = signal(true);
  readonly unreadCount = () => this.notifications().filter(n => !n.isRead).length;

  ngOnInit(): void {
    this.api.get<any>('notifications').subscribe({
      next: (res) => { this.notifications.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  markRead(id: string): void {
    this.api.patch(`notifications/${id}/read`, {}).subscribe();
    this.notifications.update(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  markAllRead(): void {
    this.api.patch('notifications/read-all', {}).subscribe();
    this.notifications.update(ns => ns.map(n => ({ ...n, isRead: true })));
  }

  getIcon(type: string): string {
    const m: Record<string, string> = {
      IN_APP: 'notifications', EMAIL: 'email', SMS: 'sms', PUSH: 'smartphone',
    };
    return m[type] || 'notifications';
  }
}
