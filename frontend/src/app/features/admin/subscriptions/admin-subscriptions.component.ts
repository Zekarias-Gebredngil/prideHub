import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

const TIER_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  SILVER: 'bg-blue-50 text-blue-700',
  GOLD: 'bg-amber-50 text-amber-700',
  PLATINUM: 'bg-purple-50 text-purple-700',
  ENTERPRISE: 'bg-primary/10 text-primary',
};

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl font-bold text-dark dark:text-white">Subscription Plans</h1>
        <p class="text-sm text-gray-500 dark:text-white/50 mt-1">Vendor subscription tiers and recurring revenue</p>
      </div>

      @if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
      }

      <!-- Stats -->
      @if (stats()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (kpi of kpiCards(); track kpi.label) {
            <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
              <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">{{ kpi.label }}</p>
              <p class="font-display font-bold text-xl text-dark dark:text-white">{{ kpi.value }}</p>
            </div>
          }
        </div>
      }

      <!-- Subscription Plans -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (plan of plans(); track plan.id) {
          <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <span class="px-3 py-1 rounded-full text-xs font-bold" [class]="tierColor(plan.tier)">
                {{ plan.tier }}
              </span>
              <span class="text-xs text-gray-400">{{ (plan.commissionRate * 100).toFixed(1) }}% commission</span>
            </div>
            <h3 class="font-semibold text-dark dark:text-white">{{ plan.name }}</h3>
            <p class="text-sm text-gray-500 dark:text-white/50 mt-1 min-h-[2.5rem]">{{ plan.description }}</p>
            <div class="mt-4 space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Monthly</span>
                <span class="font-semibold text-dark dark:text-white">{{ plan.monthlyPrice | number:'1.0-0' }} ETB</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Yearly</span>
                <span class="font-semibold text-dark dark:text-white">{{ plan.yearlyPrice | number:'1.0-0' }} ETB</span>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-100 dark:border-white/10 flex flex-wrap gap-2">
              @if (plan.hasAnalytics) {
                <span class="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs">Analytics</span>
              }
              @if (plan.hasEarlyPayout) {
                <span class="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs">Early Payout</span>
              }
              @if (plan.hasDedicatedManager) {
                <span class="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs">Dedicated Manager</span>
              }
              @if (plan.hasApiAccess) {
                <span class="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs">API Access</span>
              }
              @if (plan.trialDays > 0) {
                <span class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs">{{ plan.trialDays }}d Trial</span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Active Vendor Subscriptions -->
      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-gray-100 dark:border-white/10">
          <h2 class="font-semibold text-dark dark:text-white">Active Vendor Subscriptions</h2>
        </div>
        @if (loadingVendors()) {
          <div class="p-8 text-center text-gray-400">Loading...</div>
        } @else if (!vendorSubs().length) {
          <div class="p-8 text-center text-gray-400">No vendor subscriptions yet.</div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400">
                <tr>
                  <th class="text-left px-4 py-3 font-semibold">Vendor</th>
                  <th class="text-left px-4 py-3 font-semibold">Plan</th>
                  <th class="text-left px-4 py-3 font-semibold">Billing</th>
                  <th class="text-left px-4 py-3 font-semibold">Started</th>
                  <th class="text-left px-4 py-3 font-semibold">Expires</th>
                  <th class="text-left px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-white/5">
                @for (sub of vendorSubs(); track sub.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td class="px-4 py-3 text-gray-700 dark:text-white/70">{{ sub.vendor?.fullName || sub.vendorId }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [class]="tierColor(sub.plan?.tier)">
                        {{ sub.plan?.name || sub.planId }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-gray-500">{{ sub.billingCycle }}</td>
                    <td class="px-4 py-3 text-gray-500 text-xs">{{ sub.startDate | date:'MMM d, y' }}</td>
                    <td class="px-4 py-3 text-gray-500 text-xs">{{ (sub.endDate | date:'MMM d, y') || '—' }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [class]="statusClass(sub.status)">
                        {{ sub.status }}
                      </span>
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
export class AdminSubscriptionsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly error = signal('');
  readonly plans = signal<any[]>([]);
  readonly stats = signal<any>(null);
  readonly vendorSubs = signal<any[]>([]);
  readonly loadingVendors = signal(true);

  ngOnInit(): void {
    this.api.get<any[]>('subscriptions/plans').subscribe({ next: (p) => this.plans.set(p) });
    this.api.get<any>('subscriptions/admin/stats').subscribe({ next: (s) => this.stats.set(s) });
    this.api.getPaginated<any>('subscriptions/admin/all', { limit: 20 }).subscribe({
      next: (res) => { this.vendorSubs.set(res.data); this.loadingVendors.set(false); },
      error: () => this.loadingVendors.set(false),
    });
  }

  kpiCards(): { label: string; value: string | number }[] {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Active', value: s.active },
      { label: 'Trial', value: s.trial },
      { label: 'Cancelled', value: s.cancelled },
      { label: 'Subscription Revenue', value: `${Number(s.totalSubscriptionRevenue).toLocaleString()} ETB` },
    ];
  }

  tierColor(tier: string): string {
    return TIER_COLORS[tier] || 'bg-gray-100 text-gray-600';
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-50 text-green-700',
      TRIAL: 'bg-blue-50 text-blue-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
      EXPIRED: 'bg-red-50 text-red-700',
      GRACE_PERIOD: 'bg-amber-50 text-amber-700',
    };
    return map[status] || 'bg-gray-100 text-gray-500';
  }
}
