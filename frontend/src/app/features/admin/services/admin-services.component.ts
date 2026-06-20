import { Component } from '@angular/core';
import { AdminResourceConfig, AdminResourceListComponent } from '../shared/admin-resource-list.component';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [AdminResourceListComponent],
  template: `<app-admin-resource-list [config]="config" />`,
})
export class AdminServicesComponent {
  readonly config: AdminResourceConfig = {
    title: 'Services',
    description: 'Create and manage event services shown on the public site.',
    endpoint: 'services',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'category', path: 'category.name', label: 'Category' },
      { key: 'price', label: 'Price', type: 'money' },
      { key: 'duration', label: 'Duration' },
      { key: 'isFeatured', label: 'Featured', type: 'boolean' },
    ],
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'categoryId', label: 'Category', type: 'select', required: true, optionsEndpoint: 'services/categories' },
      { key: 'shortDesc', label: 'Short Description', type: 'textarea' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'priceUnit', label: 'Price Unit' },
      { key: 'duration', label: 'Duration' },
      { key: 'isFeatured', label: 'Featured', type: 'checkbox' },
    ],
    actions: [
      { label: 'Delete', icon: 'delete', method: 'delete', endpoint: row => `services/${row.id}`, confirm: 'Delete this service?' },
    ],
  };
}
