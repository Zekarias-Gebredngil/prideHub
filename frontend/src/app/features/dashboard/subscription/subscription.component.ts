import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SubscriptionPlan, VendorSubscription } from '../../../core/models/user.model';

const TIER_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  SILVER: 'bg-blue-50 text-blue-700',
  GOLD: 'bg-amber-50 text-amber-700',
  PLATINUM: 'bg-purple-50 text-purple-700',
  ENTERPRISE: 'bg-primary/10 text-primary',
};

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-4xl">
      <div>
        <h1 class="font-display text-2xl font-bold text-dark dark:text-white">My Subscription</h1>
        <p class="text-sm text-gray-500 dark:text-white/50 mt-1">Manage your vendor subscription plan</p>
      </div>

      @if (!isVendor()) {
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <div class="flex items-center gap-3 text-amber-700">
            <span class="material-icons text-2xl">workspace_premium</span>
            <div>
              <p class="font-semibold">Vendor Subscriptions</p>
              <p class="text-sm">Subscription plans are available once you set up a vendor profile.</p>
            </div>
          </div>
          <a routerLink="/vendor-setup"
             class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700">
            <span class="material-icons text-base">add_business</span>
            Set Up Vendor Profile
          </a>
        </div>
      } @else {
        @if (error()) {
          <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
        }
        @if (success()) {
          <div class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{{ success() }}</div>
        }

        <!-- Current Subscription -->
        @if (current()) {
          <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <span class="px-3 py-1 rounded-full text-xs font-bold" [class]="tierColor(current()!.plan?.tier ?? '')">
                    {{ current()!.plan!.tier }}
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [class]="statusClass(current()!.status)">
                    {{ current()!.status }}
                  </span>
                </div>
                <h2 class="font-semibold text-dark dark:text-white text-lg">{{ current()!.plan!.name }} Plan</h2>
                <p class="text-sm text-gray-500 dark:text-white/50 mt-1">
                  Commission rate: <strong class="text-dark dark:text-white">{{ (current()!.plan!.commissionRate * 100).toFixed(1) }}%</strong>
                </p>
                <p class="text-xs text-gray-400 mt-2">
                  Billing: {{ current()!.billingCycle }} ·
                  Renews: {{ (current()!.currentPeriodEnd | date:'MMM d, y') || '—' }}
                </p>
              </div>
              @if (current()!.status !== 'CANCELLED') {
                <button (click)="cancel()" [disabled]="cancelling()"
                        class="shrink-0 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50">
                  {{ cancelling() ? 'Cancelling...' : 'Cancel' }}
                </button>
              }
            </div>
          </div>
        }

        <!-- Available Plans -->
        <div>
          <h2 class="font-semibold text-dark dark:text-white mb-4">
            {{ current() ? 'Upgrade Your Plan' : 'Choose a Plan' }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (plan of plans(); track plan.id) {
              <div class="bg-white dark:bg-white/5 rounded-2xl border p-5 shadow-sm transition-all"
                   [class]="isCurrentPlan(plan) ? 'border-primary' : 'border-gray-100 dark:border-white/10 hover:border-primary/50'">
                @if (isCurrentPlan(plan)) {
                  <div class="text-xs font-semibold text-primary mb-2">✓ Current Plan</div>
                }
                <span class="px-3 py-1 rounded-full text-xs font-bold" [class]="tierColor(plan.tier)">{{ plan.tier }}</span>
                <h3 class="font-semibold text-dark dark:text-white mt-2">{{ plan.name }}</h3>
                <p class="text-sm text-gray-500 dark:text-white/50 mt-1 min-h-[2.5rem]">{{ plan.description }}</p>
                <div class="mt-3 space-y-1">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Commission</span>
                    <span class="font-bold text-primary">{{ (plan.commissionRate * 100).toFixed(1) }}%</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Monthly</span>
                    <span class="font-semibold text-dark dark:text-white">{{ plan.monthlyPrice | number:'1.0-0' }} ETB</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Yearly</span>
                    <span class="font-semibold text-dark dark:text-white">{{ plan.yearlyPrice | number:'1.0-0' }} ETB</span>
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-1.5">
                  @if (plan.hasAnalytics) { <span class="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">Analytics</span> }
                  @if (plan.hasEarlyPayout) { <span class="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">Early Payout</span> }
                  @if (plan.hasDedicatedManager) { <span class="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">Manager</span> }
                  @if (plan.hasApiAccess) { <span class="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">API</span> }
                  @if (plan.trialDays > 0) { <span class="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">{{ plan.trialDays }}d Trial</span> }
                </div>
                @if (!isCurrentPlan(plan)) {
                  <button (click)="subscribe(plan.id)" [disabled]="subscribingId() === plan.id"
                          class="mt-4 w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-900 disabled:opacity-50">
                    {{ subscribingId() === plan.id ? 'Processing...' : plan.monthlyPrice === 0 ? 'Start Free' : 'Subscribe' }}
                  </button>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class SubscriptionComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly isVendor = this.auth.hasVendorAccess;
  readonly error = signal('');
  readonly success = signal('');
  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly current = signal<VendorSubscription | null>(null);
  readonly subscribingId = signal('');
  readonly cancelling = signal(false);

  ngOnInit(): void {
    this.api.get<SubscriptionPlan[]>('subscriptions/plans').subscribe({ next: (p) => this.plans.set(p) });
    if (this.isVendor()) {
      this.api.get<VendorSubscription>('subscriptions/my').subscribe({
        next: (s) => this.current.set(s),
        error: () => {}, // no subscription yet — ok
      });
    }
  }

  subscribe(planId: string): void {
    this.subscribingId.set(planId);
    this.error.set('');
    this.api.post<any>('subscriptions/subscribe', { planId, billingCycle: 'MONTHLY' }).subscribe({
      next: (sub) => {
        this.subscribingId.set('');
        this.current.set(sub);
        this.success.set('Subscription activated successfully.');
      },
      error: (err) => {
        this.subscribingId.set('');
        this.error.set(err?.error?.message || 'Subscription failed');
      },
    });
  }

  cancel(): void {
    this.cancelling.set(true);
    this.api.delete<any>('subscriptions/cancel').subscribe({
      next: (sub) => {
        this.cancelling.set(false);
        this.current.set(sub);
        this.success.set('Subscription cancelled. Access continues until end of billing period.');
      },
      error: (err) => {
        this.cancelling.set(false);
        this.error.set(err?.error?.message || 'Cancellation failed');
      },
    });
  }

  isCurrentPlan(plan: SubscriptionPlan): boolean {
    return this.current()?.planId === plan.id && this.current()?.status !== 'CANCELLED';
  }

  tierColor(tier: string): string { return TIER_COLORS[tier] || 'bg-gray-100 text-gray-600'; }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-50 text-green-700',
      TRIAL: 'bg-blue-50 text-blue-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
      GRACE_PERIOD: 'bg-amber-50 text-amber-700',
      EXPIRED: 'bg-red-50 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-500';
  }
}
