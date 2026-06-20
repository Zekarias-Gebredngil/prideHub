import { Component } from '@angular/core';
import { AdminResourceConfig, AdminResourceListComponent } from '../shared/admin-resource-list.component';

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [AdminResourceListComponent],
  template: `<app-admin-resource-list [config]="config" />`,
})
export class AdminGalleryComponent {
  readonly config: AdminResourceConfig = {
    title: 'Gallery',
    description: 'Create public gallery albums for event memories.',
    endpoint: 'gallery/albums',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'coverImage', label: 'Cover', type: 'image' },
      { key: 'media', path: '_count.media', label: 'Media' },
    ],
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'coverImage', label: 'Cover Image', type: 'image' },
    ],
  };
}
