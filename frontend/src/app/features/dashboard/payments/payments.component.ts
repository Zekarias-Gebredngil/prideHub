import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Payment } from '../../../core/models/booking.model';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="font-display text-2xl font-bold text-dark dark:text-white mb-6">Payments</h1>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        @for (stat of stats(); track stat.label) {
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
            <p class="text-gray-500 dark:text-white/50 text-xs uppercase tracking-wider mb-1">{{ stat.label }}</p>
            <p class="font-display font-bold text-2xl text-dark dark:text-white">{{ stat.value }}</p>
          </div>
        }
      </div>

      <!-- Payment list -->
      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-gray-100 dark:border-white/10">
          <h2 class="font-semibold text-dark dark:text-white">Payment History</h2>
        </div>

        @if (loading()) {
          <div class="p-8 text-center">
            <span class="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin inline-block"></span>
          </div>
        } @else if (payments().length === 0) {
          <div class="p-12 text-center">
            <span class="material-icons text-5xl text-gray-200 block mb-3">receipt_long</span>
            <p class="text-gray-400">No payments yet</p>
          </div>
        } @else {
          <div class="divide-y divide-gray-50 dark:divide-white/5">
            @for (p of payments(); track p.id) {
              <div class="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     [class]="p.status === 'COMPLETED' ? 'bg-green-50' : p.status === 'FAILED' ? 'bg-red-50' : 'bg-yellow-50'">
                  <span class="material-icons text-base"
                        [class]="p.status === 'COMPLETED' ? 'text-green-500' : p.status === 'FAILED' ? 'text-red-500' : 'text-yellow-500'">
                    {{ p.status === 'COMPLETED' ? 'check_circle' : p.status === 'FAILED' ? 'error' : 'schedule' }}
                  </span>
                </div>
                <div class="flex-1">
                  <p class="font-medium text-dark dark:text-white text-sm">{{ p.method }}</p>
                  <p class="text-gray-400 text-xs">{{ p.transactionRef || 'No ref' }} · {{ p.paidAt | date:'MMM d, y' }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-dark dark:text-white">{{ p.amount | number }} {{ p.currency }}</p>
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [class]="p.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : p.status === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'">
                    {{ p.status }}
                  </span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class PaymentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly payments = signal<Payment[]>([]);
  readonly loading = signal(true);
  readonly stats = signal<any[]>([]);

  ngOnInit(): void {
    this.api.getPaginated<Payment>('payments', { limit: 50 }).subscribe({
      next: (res) => {
        const data = res.data || [];
        this.payments.set(data);
        const total = data.reduce((s, p) => s + Number(p.amount), 0);
        const paid = data.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + Number(p.amount), 0);
        this.stats.set([
          { label: 'Total Paid', value: `${paid.toLocaleString()} ETB` },
          { label: 'Pending', value: `${(total - paid).toLocaleString()} ETB` },
          { label: 'Transactions', value: data.length },
        ]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
