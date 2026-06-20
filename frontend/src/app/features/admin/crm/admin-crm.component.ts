import { Component } from '@angular/core';
import { AdminResourceConfig, AdminResourceListComponent } from '../shared/admin-resource-list.component';

@Component({
  selector: 'app-admin-crm',
  standalone: true,
  imports: [AdminResourceListComponent],
  template: `<app-admin-resource-list [config]="config" />`,
})
export class AdminCrmComponent {
  readonly config: AdminResourceConfig = {
    title: 'CRM',
    description: 'Capture leads and update follow-up status for sales conversations.',
    endpoint: 'crm/leads',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'source', label: 'Source' },
      { key: 'status', label: 'Status' },
      { key: 'budget', label: 'Budget', type: 'money' },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'email', label: 'Email', required: true },
      { key: 'phone', label: 'Phone' },
      { key: 'source', label: 'Source' },
      { key: 'interest', label: 'Interest' },
      { key: 'status', label: 'Status', type: 'select', options: ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'].map(status => ({ label: status, value: status })) },
      { key: 'budget', label: 'Budget', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    defaultCreate: { status: 'NEW' },
  };
}
