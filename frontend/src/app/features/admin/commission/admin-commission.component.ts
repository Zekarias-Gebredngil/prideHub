import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-commission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl font-bold text-dark dark:text-white">Commission Engine</h1>
        <p class="text-sm text-gray-500 dark:text-white/50 mt-1">Configure commission rules, rates and revenue settings</p>
      </div>

      <!-- Error -->
      @if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
      }

      <!-- Revenue Stats -->
      @if (stats()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
            <p class="font-display font-bold text-xl text-dark dark:text-white">{{ stats().totalRevenue | number:'1.0-0' }} ETB</p>
          </div>
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Commission Settled</p>
            <p class="font-display font-bold text-xl text-dark dark:text-white">{{ stats().totalCommissionSettled | number:'1.0-0' }} ETB</p>
          </div>
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Escrow Balance</p>
            <p class="font-display font-bold text-xl text-dark dark:text-white">{{ stats().escrowBalance | number:'1.0-0' }} ETB</p>
          </div>
          <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Vendor Payouts</p>
            <p class="font-display font-bold text-xl text-dark dark:text-white">{{ stats().totalVendorPayouts | number:'1.0-0' }} ETB</p>
          </div>
        </div>
      }

      <!-- Settings -->
      @if (settings()) {
        <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-semibold text-dark dark:text-white">Global Commission Settings</h2>
              <p class="text-xs text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-1 font-medium">
                <span class="material-icons text-sm">verified</span> Platform is 100% free for clients. Commission is deducted from profit earners.
              </p>
            </div>
            <button (click)="saveSettings()" [disabled]="savingSettings()"
                    class="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-900 disabled:opacity-50 transition-colors">
              {{ savingSettings() ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label class="space-y-1">
              <span class="text-xs font-medium text-gray-500 dark:text-white/50">Default Profit Earner Commission (%)</span>
              <input type="number" [(ngModel)]="settingsForm.globalDefaultRate" min="0" max="100" step="0.1"
                     class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
            </label>
            <label class="space-y-1">
              <span class="text-xs font-medium text-gray-500 dark:text-white/50">Client Service Fee Rate (%)</span>
              <input type="number" [(ngModel)]="settingsForm.platformFeeRate" min="0" max="0" readonly
                     class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/10 text-sm text-gray-400 cursor-not-allowed">
              <span class="text-[11px] text-gray-400">Locked at 0.0% (Free for Clients)</span>
            </label>
            <label class="space-y-1">
              <span class="text-xs font-medium text-gray-500 dark:text-white/50">Escrow Hold Days</span>
              <input type="number" [(ngModel)]="settingsForm.escrowHoldDays" min="1" max="90"
                     class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
            </label>
          </div>
        </div>
      }

      <!-- Create Rule -->
      @if (showCreate()) {
        <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-dark dark:text-white">New Commission Rule</h2>
            <button (click)="showCreate.set(false)" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
              <span class="material-icons text-base">close</span>
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label class="space-y-1">
              <span class="text-xs font-medium text-gray-500 dark:text-white/50">Rule Name *</span>
              <input [(ngModel)]="newRule.name" type="text" placeholder="e.g. Wedding Premium Rate"
                     class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm focus:outline-none focus:border-primary text-dark dark:text-white">
            </label>
            <label class="space-y-1">
              <span class="text-xs font-medium text-gray-500 dark:text-white/50">Type</span>
              <select [(ngModel)]="newRule.type"
                      class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm focus:outline-none focus:border-primary text-dark dark:text-white">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
                <option value="TIERED">Tiered</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-xs font-medium text-gray-500 dark:text-white/50">Rate (0–1, e.g. 0.08 = 8%)</span>
              <input [(ngModel)]="newRule.rate" type="number" min="0" max="1" step="0.01" placeholder="0.08"
                     class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm focus:outline-none focus:border-primary text-dark dark:text-white">
            </label>
            <label class="space-y-1">
              <span class="text-xs font-medium text-gray-500 dark:text-white/50">Subscription Tier (optional)</span>
              <select [(ngModel)]="newRule.subscriptionTier"
                      class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm focus:outline-none focus:border-primary text-dark dark:text-white">
                <option value="">— All tiers —</option>
                <option value="FREE">Free</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-xs font-medium text-gray-500 dark:text-white/50">Priority (higher = evaluated first)</span>
              <input [(ngModel)]="newRule.priority" type="number" min="0"
                     class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm focus:outline-none focus:border-primary text-dark dark:text-white">
            </label>
          </div>
          <div class="flex justify-end gap-3 mt-4">
            <button (click)="showCreate.set(false)" class="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">Cancel</button>
            <button (click)="createRule()" [disabled]="creatingRule()"
                    class="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-900 disabled:opacity-50">
              {{ creatingRule() ? 'Creating...' : 'Create Rule' }}
            </button>
          </div>
        </div>
      }

      <!-- Rules List -->
      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
          <div>
            <h2 class="font-semibold text-dark dark:text-white">Rule Priority Hierarchy</h2>
            <p class="text-xs text-gray-400">Rules are evaluated strictly by priority score</p>
          </div>
          <button (click)="showCreate.set(true)" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-900">
            <span class="material-icons text-base">add</span> New Rule
          </button>
        </div>
        @if (loading()) {
          <div class="p-8 text-center text-gray-400">Loading rules...</div>
        } @else if (!rules().length) {
          <div class="p-8 text-center text-gray-400">No commission rules configured. Global default rate applies.</div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400">
                <tr>
                  <th class="text-left px-4 py-3 font-semibold">Priority</th>
                  <th class="text-left px-4 py-3 font-semibold">Name</th>
                  <th class="text-left px-4 py-3 font-semibold">Type</th>
                  <th class="text-left px-4 py-3 font-semibold">Rate</th>
                  <th class="text-left px-4 py-3 font-semibold">Tier</th>
                  <th class="text-left px-4 py-3 font-semibold">Status</th>
                  <th class="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-white/5">
                @for (rule of rules(); track rule.id; let idx = $index) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary">
                        Priority #{{ rule.priority }}
                      </span>
                    </td>
                    <td class="px-4 py-3 font-medium text-dark dark:text-white">{{ rule.name }}</td>
                    <td class="px-4 py-3 text-gray-500">{{ rule.type }}</td>
                    <td class="px-4 py-3 font-semibold text-dark dark:text-white">
                      {{ rule.rate ? (rule.rate * 100 | number:'1.1-1') + '%' : (rule.fixedAmount | number) + ' ETB' }}
                    </td>
                    <td class="px-4 py-3 text-gray-500">{{ rule.subscriptionTier || '—' }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            [class]="rule.isEnabled ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500'">
                        {{ rule.isEnabled ? 'Active' : 'Disabled' }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex justify-end gap-2">
                        <button (click)="toggleRule(rule)"
                                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500"
                                [title]="rule.isEnabled ? 'Disable' : 'Enable'">
                          <span class="material-icons text-base">{{ rule.isEnabled ? 'toggle_on' : 'toggle_off' }}</span>
                        </button>
                        <button (click)="deleteRule(rule.id)"
                                class="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Deactivate">
                          <span class="material-icons text-base">delete_outline</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Revenue by Category -->
      @if (stats()?.byCategory?.length) {
        <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
          <h2 class="font-semibold text-dark dark:text-white mb-4">Revenue by Category</h2>
          <div class="space-y-3">
            @for (cat of stats().byCategory; track cat.category) {
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-white/70">{{ cat.category }}</span>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-400">{{ cat.count }} transactions</span>
                  <span class="font-semibold text-dark dark:text-white text-sm">{{ cat.total | number:'1.0-0' }} ETB</span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminCommissionComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly rules = signal<any[]>([]);
  readonly settings = signal<any>(null);
  readonly stats = signal<any>(null);
  readonly showCreate = signal(false);
  readonly savingSettings = signal(false);
  readonly creatingRule = signal(false);

  settingsForm: any = {};
  newRule: any = { name: '', type: 'PERCENTAGE', rate: 0.08, priority: 0, subscriptionTier: '' };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.api.get<any>('commission/settings').subscribe({
      next: (s) => {
        this.settings.set(s);
        this.settingsForm = {
          globalDefaultRate: +(s.globalDefaultRate * 100).toFixed(2),
          platformFeeRate: +(s.platformFeeRate * 100).toFixed(2),
          escrowHoldDays: s.escrowHoldDays,
        };
      },
    });
    this.api.get<any[]>('commission/rules').subscribe({
      next: (r) => { this.rules.set(r); this.loading.set(false); },
      error: () => { this.error.set('Failed to load rules'); this.loading.set(false); },
    });
    this.api.get<any>('commission/revenue/stats').subscribe({
      next: (s) => this.stats.set(s),
    });
  }

  saveSettings(): void {
    this.savingSettings.set(true);
    const body = {
      globalDefaultRate: this.settingsForm.globalDefaultRate / 100,
      platformFeeRate: 0,
      escrowHoldDays: +this.settingsForm.escrowHoldDays,
    };
    this.api.patch<any>('commission/settings', body).subscribe({
      next: () => this.savingSettings.set(false),
      error: () => { this.error.set('Failed to save settings'); this.savingSettings.set(false); },
    });
  }

  createRule(): void {
    if (!this.newRule.name) return;
    this.creatingRule.set(true);
    const body: any = {
      name: this.newRule.name,
      type: this.newRule.type,
      rate: this.newRule.rate,
      priority: +this.newRule.priority,
    };
    if (this.newRule.subscriptionTier) body.subscriptionTier = this.newRule.subscriptionTier;
    this.api.post<any>('commission/rules', body).subscribe({
      next: () => {
        this.creatingRule.set(false);
        this.showCreate.set(false);
        this.newRule = { name: '', type: 'PERCENTAGE', rate: 0.08, priority: 0, subscriptionTier: '' };
        this.loadAll();
      },
      error: () => { this.error.set('Failed to create rule'); this.creatingRule.set(false); },
    });
  }

  toggleRule(rule: any): void {
    this.api.patch<any>(`commission/rules/${rule.id}`, { isEnabled: !rule.isEnabled }).subscribe({
      next: () => this.loadAll(),
      error: () => this.error.set('Failed to update rule'),
    });
  }

  deleteRule(id: string): void {
    this.api.delete<any>(`commission/rules/${id}`).subscribe({
      next: () => this.loadAll(),
      error: () => this.error.set('Failed to deactivate rule'),
    });
  }
}
