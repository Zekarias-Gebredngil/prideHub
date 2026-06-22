import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Booking } from '../../../../core/models/booking.model';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="flex items-center justify-center py-20">
        <span class="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
      </div>
    } @else if (booking()) {
      <div>
        <!-- Header -->
        <div class="flex items-center gap-4 mb-6">
          <a routerLink="/dashboard/bookings" class="p-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 transition-colors">
            <span class="material-icons text-gray-600 dark:text-white">arrow_back</span>
          </a>
          <div>
            <h1 class="font-display text-2xl font-bold text-dark dark:text-white">{{ booking()!.bookingNumber }}</h1>
            <p class="text-gray-500 dark:text-white/50 text-sm">{{ booking()!.eventType }} · {{ booking()!.eventDate | date:'MMMM d, y' }}</p>
          </div>
          <div class="ml-auto">
            <span class="px-4 py-2 rounded-xl text-sm font-semibold" [class]="statusClass(booking()!.status)">
              {{ booking()!.status }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-5">

            <!-- Event Details -->
            <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
              <h2 class="font-semibold text-dark dark:text-white mb-4">Event Details</h2>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-400">Event Type</p>
                  <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking()!.eventType }}</p>
                </div>
                <div>
                  <p class="text-gray-400">Event Date</p>
                  <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking()!.eventDate | date:'EEEE, MMMM d, y' }}</p>
                </div>
                @if (booking()!.guestCount) {
                  <div>
                    <p class="text-gray-400">Guest Count</p>
                    <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking()!.guestCount }} guests</p>
                  </div>
                }
                @if (booking()!.venue) {
                  <div>
                    <p class="text-gray-400">Venue</p>
                    <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking()!.venue!.name }}</p>
                  </div>
                }
                @if (booking()!.package) {
                  <div>
                    <p class="text-gray-400">Package</p>
                    <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking()!.package!.name }}</p>
                  </div>
                }
                @if (booking()!.planner) {
                  <div>
                    <p class="text-gray-400">Assigned Planner</p>
                    <p class="font-medium text-dark dark:text-white mt-0.5">{{ booking()!.planner!.fullName }}</p>
                  </div>
                }
              </div>
              @if (booking()!.specialRequests) {
                <div class="mt-4 pt-4 border-t border-gray-50 dark:border-white/10">
                  <p class="text-gray-400 text-sm mb-1">Special Requests</p>
                  <p class="text-gray-600 dark:text-white/70 text-sm">{{ booking()!.specialRequests }}</p>
                </div>
              }
            </div>

            <!-- Tasks / Checklist -->
            @if ((booking()!.tasks?.length ?? 0) > 0) {
              <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
                <h2 class="font-semibold text-dark dark:text-white mb-4">Tasks</h2>
                <div class="space-y-2">
                  @for (task of booking()!.tasks!; track task.id) {
                    <div class="flex items-center gap-3 p-3 rounded-xl" [class]="task.isCompleted ? 'bg-green-50 dark:bg-green-900/10' : 'bg-gray-50 dark:bg-white/5'">
                      <span class="material-icons text-lg" [class]="task.isCompleted ? 'text-green-500' : 'text-gray-300'">
                        {{ task.isCompleted ? 'check_circle' : 'radio_button_unchecked' }}
                      </span>
                      <div class="flex-1">
                        <p class="text-sm font-medium" [class]="task.isCompleted ? 'line-through text-gray-400' : 'text-dark dark:text-white'">
                          {{ task.title }}
                        </p>
                        @if (task.dueDate) {
                          <p class="text-xs text-gray-400">Due: {{ task.dueDate | date:'MMM d' }}</p>
                        }
                      </div>
                      <span class="px-2 py-0.5 rounded-full text-xs"
                            [class]="task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : task.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-500'">
                        {{ task.priority }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Payments -->
            @if ((booking()!.payments?.length ?? 0) > 0) {
              <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
                <h2 class="font-semibold text-dark dark:text-white mb-4">Payment History</h2>
                <div class="space-y-3">
                  @for (p of booking()!.payments!; track p.id) {
                    <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                      <div class="flex items-center gap-3">
                        <span class="material-icons text-green-500">payments</span>
                        <div>
                          <p class="text-sm font-medium text-dark dark:text-white">{{ p.amount | number }} ETB</p>
                          <p class="text-xs text-gray-400">{{ p.method }} · {{ p.paidAt | date:'MMM d, y' }}</p>
                        </div>
                      </div>
                      <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">{{ p.status }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Sidebar -->
          <div class="space-y-5">
            <!-- Financial Summary -->
            <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
              <h2 class="font-semibold text-dark dark:text-white mb-4">Financial Summary</h2>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-white/50">Total Amount</span>
                  <span class="font-semibold text-dark dark:text-white">{{ booking()!.totalAmount | number }} ETB</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-white/50">Paid</span>
                  <span class="font-semibold text-green-600">{{ booking()!.paidAmount | number }} ETB</span>
                </div>
                <div class="flex justify-between border-t border-gray-100 dark:border-white/10 pt-3">
                  <span class="text-gray-500 dark:text-white/50">Remaining</span>
                  <span class="font-bold text-primary">{{ (booking()!.totalAmount - booking()!.paidAmount) | number }} ETB</span>
                </div>
              </div>
              @if (booking()!.totalAmount > booking()!.paidAmount) {
                <button (click)="makePayment()" [disabled]="makingPayment()"
                   class="block w-full mt-4 text-center py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                  {{ makingPayment() ? 'Processing...' : 'Make Payment' }}
                </button>
              }
            </div>

            <!-- Quick Actions -->
            <div class="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10 shadow-sm">
              <h2 class="font-semibold text-dark dark:text-white mb-3">Quick Actions</h2>
              <div class="space-y-2">
                @for (action of actions; track action.label) {
                  <button (click)="action.handler()"
                          class="flex items-center gap-3 w-full p-3 rounded-xl text-sm text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <span class="material-icons text-primary text-base">{{ action.icon }}</span>
                    <span class="text-gray-700 dark:text-white/70">{{ action.label }}</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    }
    <!-- Payment Initiation Dialog -->
    @if (pendingPayment()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div class="bg-white dark:bg-dark rounded-2xl border border-gray-100 dark:border-white/10 p-6 max-w-sm w-full shadow-luxury animate-fade-in">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span class="material-icons text-xl">payments</span>
            </div>
            <h3 class="text-lg font-bold text-dark dark:text-white">Make Payment</h3>
          </div>
          <p class="text-gray-600 dark:text-white/70 mb-6">You will be redirected to Chapa to securely complete your payment. Do you want to proceed?</p>
          <div class="flex items-center justify-end gap-3">
            <button (click)="pendingPayment.set(false)" class="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <button (click)="confirmMakePayment()" class="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-900 transition-colors shadow-sm">
              Proceed
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Payment Result Alert -->
    @if (paymentAlert()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div class="bg-white dark:bg-dark rounded-2xl border border-gray-100 dark:border-white/10 p-6 max-w-sm w-full shadow-luxury animate-fade-in">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full flex items-center justify-center"
                 [class]="paymentAlert()!.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'">
              <span class="material-icons text-xl">{{ paymentAlert()!.type === 'success' ? 'check_circle' : 'error' }}</span>
            </div>
            <h3 class="text-lg font-bold text-dark dark:text-white">{{ paymentAlert()!.type === 'success' ? 'Success' : 'Notice' }}</h3>
          </div>
          <p class="text-gray-600 dark:text-white/70 mb-6">{{ paymentAlert()!.message }}</p>
          <div class="flex justify-end">
            <button (click)="closePaymentAlert()" class="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/10 text-dark dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class BookingDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly booking = signal<Booking | null>(null);
  readonly loading = signal(true);
  readonly makingPayment = signal(false);
  
  readonly pendingPayment = signal(false);
  readonly paymentAlert = signal<{type: 'success' | 'error', message: string} | null>(null);

  actions = [
    { icon: 'chat', label: 'Message Planner', handler: () => this.messagePlanner() },
    { icon: 'download', label: 'Download Invoice', handler: () => this.downloadInvoice() },
    { icon: 'share', label: 'Share Booking', handler: () => this.shareBooking() },
  ];

  messagePlanner() {
    this.router.navigate(['/dashboard/messages'], { queryParams: { bookingId: this.booking()?.id } });
  }

  downloadInvoice() {
    const booking = this.booking();
    if (!booking) return;

    // Check if there are any completed payments
    const completedPayments = booking.payments?.filter(p => p.status === 'COMPLETED') ?? [];
    if (completedPayments.length === 0) {
      this.paymentAlert.set({ type: 'error', message: 'No completed payments found. Invoice is only available after a successful payment.' });
      return;
    }

    const totalPaid = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(booking.totalAmount) - Number(booking.paidAmount);
    const isFullyPaid = remaining <= 0;
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const eventDateStr = new Date(booking.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const paymentRows = completedPayments.map(p => `
      <tr>
        <td>${new Date(p.paidAt ?? p.createdAt ?? '').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
        <td>${p.method}</td>
        <td>${p.transactionRef ?? '-'}</td>
        <td class="amount">ETB ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice – ${booking.bookingNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; font-size: 13px; }
    .page { max-width: 820px; margin: 0 auto; padding: 48px 52px; }
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 28px; border-bottom: 3px solid #7c3aed; }
    .brand { display: flex; flex-direction: column; gap: 4px; }
    .brand-name { font-size: 28px; font-weight: 800; color: #7c3aed; letter-spacing: -0.5px; }
    .brand-tagline { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-label { text-align: right; }
    .invoice-label .title { font-size: 22px; font-weight: 700; color: #1a1a2e; text-transform: uppercase; letter-spacing: 2px; }
    .invoice-label .number { font-size: 13px; color: #7c3aed; font-weight: 600; margin-top: 4px; }
    .invoice-label .date { font-size: 11px; color: #6b7280; margin-top: 2px; }
    /* Status badge */
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-partial { background: #fef3c7; color: #92400e; }
    /* Parties */
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
    .party-block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin-bottom: 10px; font-weight: 600; }
    .party-block p { font-size: 13px; color: #374151; line-height: 1.6; }
    .party-block .name { font-weight: 700; font-size: 15px; color: #1a1a2e; margin-bottom: 2px; }
    /* Event info box */
    .event-box { background: #f5f3ff; border-left: 4px solid #7c3aed; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .event-box .item label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #7c3aed; font-weight: 600; display: block; margin-bottom: 4px; }
    .event-box .item span { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    /* Table */
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; font-weight: 600; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    table thead tr { background: #7c3aed; color: #fff; }
    table thead th { padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; }
    table thead th.amount { text-align: right; }
    table tbody tr { border-bottom: 1px solid #f3f4f6; }
    table tbody tr:last-child { border-bottom: none; }
    table tbody td { padding: 10px 14px; color: #374151; font-size: 13px; }
    table tbody td.amount { text-align: right; font-weight: 600; }
    /* Summary */
    .summary { display: flex; justify-content: flex-end; margin-bottom: 36px; }
    .summary-box { width: 280px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
    .summary-row:last-child { border-bottom: none; }
    .summary-row.total { font-weight: 700; font-size: 15px; padding-top: 12px; color: #1a1a2e; }
    .summary-row.paid { color: #059669; font-weight: 600; }
    .summary-row.remaining { color: ${isFullyPaid ? '#059669' : '#d97706'}; font-weight: 600; }
    /* Footer */
    .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 11px; color: #9ca3af; }
    .footer .thank-you { font-size: 13px; font-weight: 600; color: #7c3aed; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 32px 40px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="brand">
        <div class="brand-name">PrideHub</div>
        <div class="brand-tagline">Event Management Platform</div>
        <div style="margin-top:8px;font-size:11px;color:#6b7280;">
          Addis Ababa, Ethiopia<br>
          contact@pridehub.com
        </div>
      </div>
      <div class="invoice-label">
        <div class="title">Invoice</div>
        <div class="number">${booking.bookingNumber}</div>
        <div class="date">Issued: ${dateStr}</div>
        <div>
          <span class="status-badge ${isFullyPaid ? 'status-paid' : 'status-partial'}">
            ${isFullyPaid ? 'Paid in Full' : 'Partially Paid'}
          </span>
        </div>
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div class="party-block">
        <h3>Bill To</h3>
        <p class="name">${booking.client?.fullName ?? 'Client'}</p>
        <p>${booking.client?.email ?? ''}</p>
        ${booking.client?.phone ? `<p>${booking.client.phone}</p>` : ''}
      </div>
      <div class="party-block">
        <h3>Service Provider</h3>
        <p class="name">PrideHub Events</p>
        <p>contact@pridehub.com</p>
        <p>Addis Ababa, Ethiopia</p>
      </div>
    </div>

    <!-- Event Info -->
    <div class="event-box">
      <div class="item">
        <label>Event Type</label>
        <span>${booking.eventType.replace(/_/g, ' ')}</span>
      </div>
      <div class="item">
        <label>Event Date</label>
        <span>${eventDateStr}</span>
      </div>
      ${booking.venue ? `<div class="item"><label>Venue</label><span>${booking.venue.name}, ${booking.venue.city}</span></div>` :
        booking.guestCount ? `<div class="item"><label>Guests</label><span>${booking.guestCount} guests</span></div>` : ''}
    </div>

    <!-- Payment History -->
    <div class="section-title">Payment History</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Method</th>
          <th>Reference</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${paymentRows}
      </tbody>
    </table>

    <!-- Summary -->
    <div class="summary">
      <div class="summary-box">
        <div class="summary-row">
          <span>Total Amount</span>
          <span>ETB ${Number(booking.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="summary-row paid">
          <span>Total Paid</span>
          <span>ETB ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="summary-row remaining">
          <span>${isFullyPaid ? '✓ Fully Paid' : 'Balance Due'}</span>
          <span>ETB ${Math.max(0, remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        Thank you for choosing PrideHub.<br>
        This is a computer-generated invoice and requires no signature.
      </p>
      <div class="thank-you">🎉 Making your events unforgettable</div>
    </div>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onafterprint = () => URL.revokeObjectURL(url);
    } else {
      URL.revokeObjectURL(url);
      this.paymentAlert.set({ type: 'error', message: 'Please allow popups to download the invoice.' });
    }
  }

  shareBooking() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Booking ${this.booking()?.bookingNumber}`,
        text: 'Check out my event booking on PrideHub!',
        url: url,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(url);
      this.paymentAlert.set({ type: 'success', message: 'Booking link copied to clipboard!' });
    }
  }

  ngOnInit(): void {
    this.loadBooking();
    
    // Check if returning from Chapa payment
    const paymentRef = this.route.snapshot.queryParamMap.get('payment_ref');
    if (paymentRef) {
      this.verifyPayment(paymentRef);
    }
  }

  loadBooking(silent = false): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    if (!silent) this.loading.set(true);
    this.api.get<Booking>(`bookings/${id}`).subscribe({
      next: (b) => { this.booking.set(b); if (!silent) this.loading.set(false); },
      error: () => { if (!silent) this.loading.set(false); },
    });
  }

  verifyPayment(txRef: string): void {
    // Remove query param from URL without reloading
    window.history.replaceState({}, document.title, window.location.pathname);
    
    this.api.get<any>(`payments/verify/${txRef}`).subscribe({
      next: (payment) => {
        if (payment.status === 'COMPLETED') {
          this.paymentAlert.set({ type: 'success', message: 'Your payment was successful!' });
        } else if (payment.status === 'FAILED') {
          this.paymentAlert.set({ type: 'error', message: 'Your payment failed or was cancelled.' });
        } else {
          this.paymentAlert.set({ type: 'error', message: 'Payment is still processing. It may take a moment to update.' });
        }
        this.loadBooking(true); // Reload booking silently to show updated amounts
      },
      error: () => {
        this.paymentAlert.set({ type: 'error', message: 'Could not verify payment status.' });
      }
    });
  }

  statusClass(s: string): string {
    const m: Record<string, string> = {
      PENDING: 'bg-yellow-50 text-yellow-700',
      CONFIRMED: 'bg-green-50 text-green-700',
      COMPLETED: 'bg-blue-50 text-blue-700',
      CANCELLED: 'bg-red-50 text-red-700',
      PLANNING: 'bg-purple-50 text-purple-700',
    };
    return m[s] || 'bg-gray-100 text-gray-600';
  }

  makePayment(): void {
    this.pendingPayment.set(true);
  }

  confirmMakePayment(): void {
    this.pendingPayment.set(false);
    const b = this.booking();
    if (!b) return;

    this.makingPayment.set(true);
    const amount = Number(b.totalAmount) - Number(b.paidAmount);

    this.api.post<any>('payments', {
      bookingId: b.id,
      amount,
      method: 'CHAPA'
    }).subscribe({
      next: (payment) => {
        this.api.post<any>(`payments/${payment.id}/chapa`, {}).subscribe({
          next: (res) => {
            window.location.href = res.checkoutUrl;
          },
          error: (err) => {
            this.paymentAlert.set({ type: 'error', message: err?.error?.message || 'Failed to initiate Chapa payment. Please contact support.' });
            this.makingPayment.set(false);
          }
        });
      },
      error: (err) => {
        this.paymentAlert.set({ type: 'error', message: err?.error?.message || 'Failed to create payment.' });
        this.makingPayment.set(false);
      }
    });
  }

  closePaymentAlert(): void {
    this.paymentAlert.set(null);
  }
}
