import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-settlement',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-dark dark:text-white">Settlement Engine</h1>
          <p class="text-sm text-gray-500 dark:text-white/50 mt-1">Manage escrow releases, vendor settlements and disputes</p>
        </div>
        <button (click)="triggerSettlement()" [disabled]="triggering()"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-900 disabled:opacity-50">
          <span class="material-icons text-base">{{ triggering() ? 'hourglass_empty' : 'play_circle' }}</span>
          {{ triggering() ? 'Processing...' : 'Run Settlement' }}
        </button>
      </div>

      @if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
      }
      @if (success()) {
        <div class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{{ success() }}</div>
      }

      <!-- Escrow Stats -->
      @if (escrowStats()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Held in Escrow</p>
            <p class="font-display font-bold text-xl text-dark dark:text-white">{{ escrowStats().held.amount | number:'1.0-0' }} ETB</p>
            <p class="text-xs text-gray-400 mt-1">{{ escrowStats().held.count }} accounts</p>
          </div>
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Released</p>
            <p class="font-display font-bold text-xl text-dark dark:text-white">{{ escrowStats().released.amount | number:'1.0-0' }} ETB</p>
            <p class="text-xs text-gray-400 mt-1">{{ escrowStats().released.count }} accounts</p>
          </div>
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Refunded</p>
            <p class="font-display font-bold text-xl text-dark dark:text-white">{{ escrowStats().refunded.amount | number:'1.0-0' }} ETB</p>
          </div>
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Open Disputes</p>
            <p class="font-display font-bold text-xl text-red-600">{{ escrowStats().openDisputes }}</p>
          </div>
        </div>
      }

      <!-- Settlement Batches -->
      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
          <h2 class="font-semibold text-dark dark:text-white">Settlement Batches</h2>
          <button (click)="releaseMatureEscrows()" [disabled]="releasing()"
                  class="text-sm text-primary hover:underline disabled:opacity-50">
            {{ releasing() ? 'Releasing...' : 'Release Mature Escrows' }}
          </button>
        </div>
        @if (loadingBatches()) {
          <div class="p-8 text-center text-gray-400">Loading...</div>
        } @else if (!batches().length) {
          <div class="p-8 text-center text-gray-400">No settlement batches yet.</div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400">
                <tr>
                  <th class="text-left px-4 py-3 font-semibold">Batch #</th>
                  <th class="text-left px-4 py-3 font-semibold">Frequency</th>
                  <th class="text-left px-4 py-3 font-semibold">Period</th>
                  <th class="text-left px-4 py-3 font-semibold">Total Payout</th>
                  <th class="text-left px-4 py-3 font-semibold">Commission</th>
                  <th class="text-left px-4 py-3 font-semibold">Vendors</th>
                  <th class="text-left px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-white/5">
                @for (batch of batches(); track batch.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td class="px-4 py-3 font-mono text-xs text-primary">{{ batch.batchNumber }}</td>
                    <td class="px-4 py-3 text-gray-500">{{ batch.frequency }}</td>
                    <td class="px-4 py-3 text-gray-500 text-xs">
                      {{ batch.periodStart | date:'MMM d' }} – {{ batch.periodEnd | date:'MMM d, y' }}
                    </td>
                    <td class="px-4 py-3 font-medium text-dark dark:text-white">{{ batch.totalNetPayout | number:'1.0-0' }} ETB</td>
                    <td class="px-4 py-3 text-gray-500">{{ batch.totalCommission | number:'1.0-0' }} ETB</td>
                    <td class="px-4 py-3 text-gray-500">{{ batch.vendorCount }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                            [class]="statusClass(batch.status)">{{ batch.status }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Open Disputes -->
      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-gray-100 dark:border-white/10">
          <h2 class="font-semibold text-dark dark:text-white">Open Disputes</h2>
        </div>
        @if (!disputes().length) {
          <div class="p-8 text-center text-gray-400">No open disputes.</div>
        } @else {
          <div class="divide-y divide-gray-50 dark:divide-white/5">
            @for (d of disputes(); track d.id) {
              <div class="px-5 py-4">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-dark dark:text-white text-sm truncate">{{ d.type }}</p>
                    <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ d.reason }}</p>
                    <p class="text-xs text-gray-400 mt-1">Disputed: {{ d.disputedAmount | number:'1.0-0' }} ETB</p>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 shrink-0">{{ d.status }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminSettlementComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loadingBatches = signal(true);
  readonly triggering = signal(false);
  readonly releasing = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly batches = signal<any[]>([]);
  readonly escrowStats = signal<any>(null);
  readonly disputes = signal<any[]>([]);

  ngOnInit(): void {
    this.loadBatches();
    this.loadEscrowStats();
    this.loadDisputes();
  }

  loadBatches(): void {
    this.api.getPaginated<any>('settlement/batches').subscribe({
      next: (res) => { this.batches.set(res.data); this.loadingBatches.set(false); },
      error: () => this.loadingBatches.set(false),
    });
  }

  loadEscrowStats(): void {
    this.api.get<any>('settlement/escrow/stats').subscribe({
      next: (s) => this.escrowStats.set(s),
    });
  }

  loadDisputes(): void {
    this.api.get<any[]>('settlement/disputes', { status: 'OPEN' }).subscribe({
      next: (d) => this.disputes.set(Array.isArray(d) ? d : []),
    });
  }

  triggerSettlement(): void {
    this.triggering.set(true);
    this.error.set('');
    this.success.set('');
    this.api.post<any>('settlement/batches/trigger', {}).subscribe({
      next: (res) => {
        this.triggering.set(false);
        this.success.set(`Settlement batch ${res.batchNumber || ''} completed: ${res.processed} processed, ${res.failed} failed.`);
        this.loadBatches();
        this.loadEscrowStats();
      },
      error: (err) => {
        this.triggering.set(false);
        this.error.set(err?.error?.message || 'Settlement failed');
      },
    });
  }

  releaseMatureEscrows(): void {
    this.releasing.set(true);
    this.api.post<any>('settlement/escrow/release-mature', {}).subscribe({
      next: (res) => {
        this.releasing.set(false);
        this.success.set(`Released ${res.releasedCount} mature escrow accounts.`);
        this.loadEscrowStats();
      },
      error: () => { this.error.set('Failed to release escrows'); this.releasing.set(false); },
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'bg-green-50 text-green-700',
      PROCESSING: 'bg-blue-50 text-blue-700',
      PENDING: 'bg-amber-50 text-amber-700',
      FAILED: 'bg-red-50 text-red-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
    };
    return map[status] || 'bg-gray-100 text-gray-500';
  }
}
