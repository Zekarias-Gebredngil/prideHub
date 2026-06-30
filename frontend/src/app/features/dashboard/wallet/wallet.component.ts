import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { VendorWallet, WalletTransaction } from '../../../core/models/user.model';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-3xl">
      <div>
        <h1 class="font-display text-2xl font-bold text-dark dark:text-white">My Wallet</h1>
        <p class="text-sm text-gray-500 dark:text-white/50 mt-1">Track earnings, request withdrawals and view transaction history</p>
      </div>

      @if (!isVendor()) {
        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <div class="flex items-center gap-3 text-amber-700">
            <span class="material-icons text-2xl">storefront</span>
            <div>
              <p class="font-semibold">Vendor Wallet</p>
              <p class="text-sm">Your wallet becomes active once you set up a vendor profile.</p>
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

        <!-- Balance Cards -->
        @if (wallet()) {
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 col-span-2 lg:col-span-1">
              <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Available</p>
              <p class="font-display font-bold text-2xl text-green-600">{{ wallet()!.availableBalance | number:'1.0-0' }} ETB</p>
            </div>
            <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
              <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Pending</p>
              <p class="font-display font-bold text-xl text-amber-600">{{ wallet()!.pendingBalance | number:'1.0-0' }} ETB</p>
            </div>
            <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
              <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Lifetime Earned</p>
              <p class="font-display font-bold text-xl text-dark dark:text-white">{{ wallet()!.lifetimeEarnings | number:'1.0-0' }} ETB</p>
            </div>
            <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
              <p class="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Withdrawn</p>
              <p class="font-display font-bold text-xl text-dark dark:text-white">{{ wallet()!.totalWithdrawn | number:'1.0-0' }} ETB</p>
            </div>
          </div>

          <!-- Withdrawal Request -->
          <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
            <h2 class="font-semibold text-dark dark:text-white mb-4 flex items-center gap-2">
              <span class="material-icons text-lg text-primary">account_balance</span>
              Request Withdrawal
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="space-y-1">
                <span class="text-xs font-medium text-gray-500 dark:text-white/50">Amount (ETB)</span>
                <input [(ngModel)]="withdrawForm.amount" type="number" min="100"
                       [max]="wallet()!.availableBalance"
                       class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
              </label>
              <label class="space-y-1">
                <span class="text-xs font-medium text-gray-500 dark:text-white/50">Method</span>
                <select [(ngModel)]="withdrawForm.method"
                        class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                  <option value="BANK">Bank Transfer</option>
                  <option value="TELEBIRR">Telebirr</option>
                  <option value="CHAPA">Chapa</option>
                </select>
              </label>
              @if (withdrawForm.method === 'BANK') {
                <label class="space-y-1">
                  <span class="text-xs font-medium text-gray-500 dark:text-white/50">Bank Name</span>
                  <input [(ngModel)]="withdrawForm.bankName" type="text"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>
                <label class="space-y-1">
                  <span class="text-xs font-medium text-gray-500 dark:text-white/50">Account Number</span>
                  <input [(ngModel)]="withdrawForm.accountNumber" type="text"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                </label>
              }
            </div>
            <button (click)="requestWithdrawal()" [disabled]="withdrawing() || !withdrawForm.amount"
                    class="mt-4 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-900 disabled:opacity-50">
              {{ withdrawing() ? 'Submitting...' : 'Request Withdrawal' }}
            </button>
          </div>
        } @else if (loadingWallet()) {
          <div class="text-center text-gray-400 py-8">Loading wallet...</div>
        }

        <!-- Transaction History -->
        <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-gray-100 dark:border-white/10">
            <h2 class="font-semibold text-dark dark:text-white">Transaction History</h2>
          </div>
          @if (!transactions().length) {
            <div class="p-8 text-center text-gray-400">No transactions yet.</div>
          } @else {
            <div class="divide-y divide-gray-50 dark:divide-white/5">
              @for (tx of transactions(); track tx.id) {
                <div class="flex items-center justify-between px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center"
                         [class]="tx.type === 'CREDIT' ? 'bg-green-50' : 'bg-red-50'">
                      <span class="material-icons text-base"
                            [class]="tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'">
                        {{ tx.type === 'CREDIT' ? 'arrow_downward' : 'arrow_upward' }}
                      </span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-dark dark:text-white">{{ txLabel(tx.type) }}</p>
                      <p class="text-xs text-gray-400">{{ tx.createdAt | date:'MMM d, y HH:mm' }}</p>
                      @if (tx.description) {
                        <p class="text-xs text-gray-400 mt-0.5">{{ tx.description }}</p>
                      }
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-sm"
                       [class]="tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'">
                      {{ tx.type === 'CREDIT' ? '+' : '-' }}{{ tx.amount | number:'1.0-0' }} ETB
                    </p>
                    <p class="text-xs text-gray-400">Balance: {{ tx.balanceAfter | number:'1.0-0' }}</p>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class WalletComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly isVendor = this.auth.hasVendorAccess;
  readonly error = signal('');
  readonly success = signal('');
  readonly loadingWallet = signal(true);
  readonly wallet = signal<VendorWallet | null>(null);
  readonly transactions = signal<WalletTransaction[]>([]);
  readonly withdrawing = signal(false);

  withdrawForm = { amount: 0, method: 'BANK', bankName: '', accountNumber: '' };

  ngOnInit(): void {
    if (!this.isVendor()) return;
    this.api.get<VendorWallet>('commission/wallet').subscribe({
      next: (w) => { this.wallet.set(w); this.loadingWallet.set(false); },
      error: () => this.loadingWallet.set(false),
    });
    this.api.getPaginated<WalletTransaction>('commission/wallet/transactions', { limit: 20 }).subscribe({
      next: (res) => this.transactions.set(res.data),
    });
  }

  requestWithdrawal(): void {
    if (!this.withdrawForm.amount || this.withdrawForm.amount <= 0) return;
    this.withdrawing.set(true);
    this.error.set('');
    const body: any = { amount: this.withdrawForm.amount, method: this.withdrawForm.method };
    if (this.withdrawForm.bankName) body.bankName = this.withdrawForm.bankName;
    if (this.withdrawForm.accountNumber) body.accountNumber = this.withdrawForm.accountNumber;

    this.api.post<any>('commission/wallet/withdraw', body).subscribe({
      next: () => {
        this.withdrawing.set(false);
        this.success.set('Withdrawal request submitted. An admin will review it shortly.');
        this.withdrawForm = { amount: 0, method: 'BANK', bankName: '', accountNumber: '' };
        // Refresh wallet balance
        this.api.get<VendorWallet>('commission/wallet').subscribe({ next: (w) => this.wallet.set(w) });
      },
      error: (err) => {
        this.withdrawing.set(false);
        this.error.set(err?.error?.message || 'Withdrawal request failed');
      },
    });
  }

  txLabel(type: string): string {
    const map: Record<string, string> = {
      CREDIT: 'Earnings Credited',
      DEBIT: 'Debit',
      HOLD: 'Withdrawal Held',
      RELEASE: 'Hold Released',
      WITHDRAWAL: 'Withdrawal Processed',
      ADJUSTMENT: 'Manual Adjustment',
      REFUND: 'Refund',
    };
    return map[type] || type;
  }
}
