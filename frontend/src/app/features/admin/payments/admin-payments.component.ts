import { Component } from '@angular/core';
import { AdminResourceConfig, AdminResourceListComponent } from '../shared/admin-resource-list.component';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [AdminResourceListComponent],
  template: `<app-admin-resource-list [config]="config" />`,
})
export class AdminPaymentsComponent {
  readonly config: AdminResourceConfig = {
    title: 'Payments',
    description: 'Track payments and confirm manual transfers.',
    endpoint: 'payments',
    canCreate: false,
    canEdit: false,
    columns: [
      { key: 'booking', path: 'booking.bookingNumber', label: 'Booking' },
      { key: 'client', path: 'booking.client.fullName', label: 'Client' },
      { key: 'amount', label: 'Amount', type: 'money' },
      { key: 'method', label: 'Method' },
      { key: 'status', label: 'Status' },
    ],
    actions: [
      {
        label: 'Confirm Payment',
        icon: 'done_all',
        method: 'patch',
        endpoint: row => `payments/${row.id}/confirm`,
        body: row => ({ transactionRef: row.transactionRef || `MANUAL-${Date.now()}` }),
        visible: row => row.status !== 'COMPLETED',
        confirm: 'Confirm this payment?',
      },
      {
        label: 'Mark Failed',
        icon: 'error',
        method: 'patch',
        endpoint: row => `payments/${row.id}/status`,
        body: () => ({ status: 'FAILED' }),
        visible: row => row.status !== 'FAILED' && row.status !== 'COMPLETED',
        confirm: 'Mark payment as FAILED?',
      },
      {
        label: 'Refund',
        icon: 'currency_exchange',
        method: 'patch',
        endpoint: row => `payments/${row.id}/status`,
        body: () => ({ status: 'REFUNDED' }),
        visible: row => row.status === 'COMPLETED',
        confirm: 'Mark payment as REFUNDED?',
      },
    ],
  };
}
