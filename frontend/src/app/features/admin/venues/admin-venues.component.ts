import { Component } from '@angular/core';
import { AdminResourceConfig, AdminResourceListComponent } from '../shared/admin-resource-list.component';

@Component({
  selector: 'app-admin-venues',
  standalone: true,
  imports: [AdminResourceListComponent],
  template: `<app-admin-resource-list [config]="config" />`,
})
export class AdminVenuesComponent {
  readonly config: AdminResourceConfig = {
    title: 'Venues',
    description: 'Manage venue details, capacity, pricing, and featured placement.',
    endpoint: 'venues',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'city', label: 'City' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'pricePerDay', label: 'Price/Day', type: 'money' },
      { key: 'isFeatured', label: 'Featured', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'shortDesc', label: 'Short Description', type: 'textarea' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'country', label: 'Country' },
      { key: 'capacity', label: 'Capacity', type: 'number' },
      { key: 'minCapacity', label: 'Minimum Capacity', type: 'number' },
      { key: 'pricePerDay', label: 'Price Per Day', type: 'number' },
      { key: 'googleMapsUrl', label: 'Google Maps URL' },
      { key: 'isFeatured', label: 'Featured', type: 'checkbox' },
    ],
    defaultCreate: { country: 'Ethiopia' },
    actions: [
      { label: 'Delete', icon: 'delete', method: 'delete', endpoint: row => `venues/${row.id}`, confirm: 'Delete this venue?' },
    ],
  };
}
