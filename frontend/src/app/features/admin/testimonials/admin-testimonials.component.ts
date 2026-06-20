import { Component } from '@angular/core';
import { AdminResourceConfig, AdminResourceListComponent } from '../shared/admin-resource-list.component';

@Component({
  selector: 'app-admin-testimonials',
  standalone: true,
  imports: [AdminResourceListComponent],
  template: `<app-admin-resource-list [config]="config" />`,
})
export class AdminTestimonialsComponent {
  readonly config: AdminResourceConfig = {
    title: 'Testimonials',
    description: 'Review submitted testimonials and approve them for the public site.',
    endpoint: 'testimonials',
    query: { approvedOnly: false },
    canCreate: false,
    canEdit: false,
    columns: [
      { key: 'clientName', label: 'Client' },
      { key: 'eventType', label: 'Event' },
      { key: 'rating', label: 'Rating' },
      { key: 'isApproved', label: 'Approved', type: 'boolean' },
      { key: 'isFeatured', label: 'Featured', type: 'boolean' },
    ],
    actions: [
      { label: 'Approve', icon: 'check_circle', method: 'patch', endpoint: row => `testimonials/${row.id}/approve`, visible: row => !row.isApproved },
      { label: 'Delete', icon: 'delete', method: 'delete', endpoint: row => `testimonials/${row.id}`, confirm: 'Delete this testimonial?' },
    ],
  };
}
