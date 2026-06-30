import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-wallets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl font-bold text-dark dark:text-white">Vendor Wallets</h1>
        <p class="text-sm text-gray-500 dark:text-white/50 mt-1">Manage withdrawal requests and vendor payouts</p>
      </div>

      @if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
      }
      @if (success()) {
        <div class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{{ success() }}</div>
      }

      <!-- Pending Withdrawal Requests -->
      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-gray-100 dark:border-white/10">
          <h2 class="font-semibold text-dark dark:text-white">Pending Withdrawal Requests</h2>
        </div>
        @if (loading()) {
          <div class="p-8 text-center text-gray-400">Loading...</div>
        } @else if (!withdrawals().length) {
          <div class="p-8 text-center text-gray-400">No pending withdrawal requests.</div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400">
                <tr>
                  <th class="text-left px-4 py-3 font-semibold">Vendor</th>
                  <th class="text-left px-4 py-3 font-semibold">Amount</th>
                  <th class="text-left px-4 py-3 font-semibold">Method</th>
                  <th class="text-left px-4 py-3 font-semibold">Account</th>
                  <th class="text-left px-4 py-3 font-semibold">Requested</th>
                  <th class="text-left px-4 py-3 font-semibold">Status</th>
                  <th class="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-white/5">
                @for (w of withdrawals(); track w.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td class="px-4 py-3 text-gray-700 dark:text-white/70">{{ w.vendorId }}</td>
                    <td class="px-4 py-3 font-semibold text-dark dark:text-white">{{ w.amount | number:'1.0-0' }} ETB</td>
                    <td class="px-4 py-3 text-gray-500">{{ w.method }}</td>
                    <td class="px-4 py-3 text-gray-500 text-xs">
                      {{ w.bankName ? w.bankName + ' — ' + w.accountNumber : w.accountNumber || '—' }}
                    </td>
                    <td class="px-4 py-3 text-gray-500 text-xs">{{ w.requestedAt | date:'MMM d, y HH:mm' }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [class]="withdrawalStatusClass(w.status)">
                        {{ w.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      @if (w.status === 'PENDING') {
                        <div class="flex justify-end gap-2">
                          <button (click)="approve(w.id)" [disabled]="processing()[w.id]"
                                  class="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 disabled:opacity-50">
                            Approve
                          </button>
                          <button (click)="reject(w.id)" [disabled]="processing()[w.id]"
                                  class="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50">
                            Reject
                          </button>
                        </div>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminWalletsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly success = signal('');
  readonly withdrawals = signal<any[]>([]);
  readonly processing = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.loadWithdrawals();
  }

  loadWithdrawals(): void {
    this.loading.set(true);
    // Reuse the commission wallet withdraw endpoints with admin approval
    // We fetch all pending requests via the commission module endpoint
    this.api.get<any>('commission/wallet/withdraw', { status: 'PENDING', limit: 50 }).subscribe({
      next: (res) => { 
        const data = Array.isArray(res) ? res : (res?.data || []);
        this.withdrawals.set(data); 
        this.loading.set(false); 
      },
      error: () => {
        // Fallback: withdrawal management may come from a dedicated endpoint
        this.loading.set(false);
      },
    });
  }

  approve(id: string): void {
    this.processing.update(p => ({ ...p, [id]: true }));
    this.api.patch<any>(`commission/wallet/withdraw/${id}/approve`, {}).subscribe({
      next: () => {
        this.processing.update(p => ({ ...p, [id]: false }));
        this.success.set('Withdrawal approved.');
        this.loadWithdrawals();
      },
      error: (err) => {
        this.processing.update(p => ({ ...p, [id]: false }));
        this.error.set(err?.error?.message || 'Failed to approve withdrawal');
      },
    });
  }

  reject(id: string): void {
    this.processing.update(p => ({ ...p, [id]: true }));
    this.api.patch<any>(`commission/wallet/withdraw/${id}/reject`, { reason: 'Rejected by admin' }).subscribe({
      next: () => {
        this.processing.update(p => ({ ...p, [id]: false }));
        this.success.set('Withdrawal rejected.');
        this.loadWithdrawals();
      },
      error: (err) => {
        this.processing.update(p => ({ ...p, [id]: false }));
        this.error.set(err?.error?.message || 'Failed to reject withdrawal');
      },
    });
  }

  withdrawalStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-50 text-amber-700',
      APPROVED: 'bg-blue-50 text-blue-700',
      COMPLETED: 'bg-green-50 text-green-700',
      REJECTED: 'bg-red-50 text-red-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
    };
    return map[status] || 'bg-gray-100 text-gray-500';
  }
}
