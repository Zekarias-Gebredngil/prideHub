import { Component } from '@angular/core';
import { AdminResourceConfig, AdminResourceListComponent } from '../shared/admin-resource-list.component';

@Component({
  selector: 'app-admin-vendors',
  standalone: true,
  imports: [AdminResourceListComponent],
  template: `<app-admin-resource-list [config]="config" />`,
})
export class AdminVendorsComponent {
  readonly config: AdminResourceConfig = {
    title: 'Vendors',
    description: 'Review vendor profiles, update core details, and verify approved providers.',
    endpoint: 'vendors',
    canCreate: false,
    columns: [
      { key: 'businessName', label: 'Business' },
      { key: 'category', path: 'category.name', label: 'Category' },
      { key: 'city', label: 'City' },
      { key: 'basePrice', label: 'Base Price', type: 'money' },
      { key: 'isVerified', label: 'Verified', type: 'boolean' },
    ],
    fields: [
      { key: 'businessName', label: 'Business Name', required: true },
      { key: 'categoryId', label: 'Category', type: 'select', required: true, optionsEndpoint: 'vendors/categories' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'bio', label: 'Bio', type: 'textarea' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'website', label: 'Website' },
      { key: 'basePrice', label: 'Base Price', type: 'number' },
      { key: 'priceUnit', label: 'Price Unit' },
    ],
    actions: [
      { label: 'Verify', icon: 'verified', method: 'patch', endpoint: row => `vendors/${row.id}/verify`, body: () => ({ isVerified: true }), visible: row => !row.isVerified },
      { label: 'Unverify', icon: 'block', method: 'patch', endpoint: row => `vendors/${row.id}/verify`, body: () => ({ isVerified: false }), visible: row => row.isVerified },
      { label: 'Delete', icon: 'delete', method: 'delete', endpoint: row => `vendors/${row.id}`, confirm: 'Delete this vendor profile?' },
    ],
  };
}
