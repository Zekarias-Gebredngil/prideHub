import { Component } from '@angular/core';
import { AdminResourceConfig, AdminResourceListComponent } from '../shared/admin-resource-list.component';

@Component({
  selector: 'app-admin-blog',
  standalone: true,
  imports: [AdminResourceListComponent],
  template: `<app-admin-resource-list [config]="config" />`,
})
export class AdminBlogComponent {
  readonly config: AdminResourceConfig = {
    title: 'Blog Posts',
    description: 'Create and manage blog content, SEO text, and publishing status.',
    endpoint: 'blog',
    query: { status: 'ALL' },
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category', path: 'category.name', label: 'Category' },
      { key: 'status', label: 'Status' },
      { key: 'views', label: 'Views' },
      { key: 'publishedAt', label: 'Published', type: 'date' },
    ],
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'categoryId', label: 'Category', type: 'select', optionsEndpoint: 'blog/categories' },
      { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
      { key: 'content', label: 'Content', type: 'textarea', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'].map(status => ({ label: status, value: status })) },
      { key: 'seoTitle', label: 'SEO Title' },
      { key: 'seoDesc', label: 'SEO Description', type: 'textarea' },
    ],
    defaultCreate: { status: 'DRAFT' },
    actions: [
      { label: 'Delete', icon: 'delete', method: 'delete', endpoint: row => `blog/${row.id}`, confirm: 'Delete this blog post?' },
    ],
  };
}
