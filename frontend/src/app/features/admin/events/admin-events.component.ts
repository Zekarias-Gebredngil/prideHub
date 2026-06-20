import { Component } from '@angular/core';
import { AdminResourceConfig, AdminResourceListComponent } from '../shared/admin-resource-list.component';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [AdminResourceListComponent],
  template: `<app-admin-resource-list [config]="config" />`,
})
export class AdminEventsComponent {
  readonly config: AdminResourceConfig = {
    title: 'Events',
    description: 'Monitor upcoming events created from confirmed bookings.',
    endpoint: 'events/upcoming',
    paginated: false,
    canCreate: false,
    canEdit: false,
    columns: [
      { key: 'name', label: 'Event' },
      { key: 'booking', path: 'booking.bookingNumber', label: 'Booking' },
      { key: 'client', path: 'booking.client.fullName', label: 'Client' },
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'progress', label: 'Progress' },
    ],
  };
}
