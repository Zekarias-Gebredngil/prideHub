import { Component } from '@angular/core';
import { AdminResourceConfig, AdminResourceListComponent } from '../shared/admin-resource-list.component';

@Component({
  selector: 'app-admin-packages',
  standalone: true,
  imports: [AdminResourceListComponent],
  template: `<app-admin-resource-list [config]="config" />`,
})
export class AdminPackagesComponent {
  readonly config: AdminResourceConfig = {
    title: 'Packages',
    description: 'Manage package tiers, prices, discounts, and public feature flags.',
    endpoint: 'packages',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'tier', label: 'Tier' },
      { key: 'price', label: 'Price', type: 'money' },
      { key: 'discountPct', label: 'Discount' },
      { key: 'isFeatured', label: 'Featured', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'tier', label: 'Tier', type: 'select', required: true, options: ['Silver', 'Gold', 'Platinum', 'Diamond'].map(tier => ({ label: tier, value: tier })) },
      { key: 'shortDesc', label: 'Short Description', type: 'textarea' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'price', label: 'Price', type: 'number', required: true },
      { key: 'discountPct', label: 'Discount %', type: 'number' },
      { key: 'maxGuests', label: 'Max Guests', type: 'number' },
      { key: 'duration', label: 'Duration' },
      { key: 'color', label: 'Color' },
      { key: 'isFeatured', label: 'Featured', type: 'checkbox' },
    ],
    defaultCreate: { discountPct: 0 },
    actions: [
      { label: 'Delete', icon: 'delete', method: 'delete', endpoint: row => `packages/${row.id}`, confirm: 'Delete this package?' },
    ],
  };
}
