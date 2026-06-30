import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-vendor-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">My Services</h1>
        <button (click)="isAdding = true" class="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors">
          Add Service
        </button>
      </div>

      <div *ngIf="isAdding" class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6 border border-gray-100 dark:border-gray-700">
        <h2 class="text-xl font-bold mb-4 dark:text-white">New Service</h2>
        <form (submit)="saveService()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Name</label>
              <input type="text" [(ngModel)]="newService.name" name="name" class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select [(ngModel)]="newService.categoryId" name="categoryId" class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                <option value="" disabled selected>Select a Category</option>
                <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
              <input type="number" [(ngModel)]="newService.price" name="price" class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price Unit</label>
              <input type="text" [(ngModel)]="newService.priceUnit" name="priceUnit" placeholder="e.g. per hour, per event" class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea [(ngModel)]="newService.description" name="desc" class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows="3"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" (click)="isAdding = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white">Cancel</button>
            <button type="submit" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark">Save</button>
          </div>
        </form>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let s of services()" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-lg text-gray-900 dark:text-white">{{ s.name }}</h3>
            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium" *ngIf="s.isActive">Active</span>
          </div>
          <p class="text-xs text-gray-500 mb-2">{{ s.category?.name }}</p>
          <p class="text-primary font-bold mb-3">{{ s.price | currency:'ETB':'symbol':'1.0-0' }} <span *ngIf="s.priceUnit" class="text-sm font-normal text-gray-500">/ {{ s.priceUnit }}</span></p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{{ s.description }}</p>
          <div class="flex justify-end">
            <button (click)="deleteService(s.id)" class="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
          </div>
        </div>
      </div>

      <div *ngIf="services().length === 0 && !isAdding" class="text-center py-12 text-gray-500 dark:text-gray-400">
        You haven't added any services yet.
      </div>
    </div>
  `
})
export class VendorServicesComponent implements OnInit {
  private api = inject(ApiService);
  services = signal<any[]>([]);
  categories = signal<any[]>([]);
  isAdding = false;
  newService: any = { name: '', price: 0, description: '', categoryId: '', priceUnit: '' };

  ngOnInit() {
    this.loadCategories();
    this.loadServices();
  }

  loadCategories() {
    this.api.get<{ data: any[] }>('services/categories').subscribe({
      next: (res) => this.categories.set(res.data),
      error: (err) => console.error(err)
    });
  }

  loadServices() {
    this.api.get<{ data: any[] }>('services', { vendorId: 'me' }).subscribe({
      next: (res) => this.services.set(res.data),
      error: (err) => console.error(err)
    });
  }

  saveService() {
    const payload = { ...this.newService };
    if (payload.price) payload.price = Number(payload.price);
    
    this.api.post('services', payload).subscribe({
      next: () => {
        this.isAdding = false;
        this.newService = { name: '', price: 0, description: '', categoryId: '', priceUnit: '' };
        this.loadServices();
      },
      error: (err) => {
        console.error(err);
        alert('Error saving service: ' + (err.error?.message || err.message));
      }
    });
  }

  deleteService(id: string) {
    if (confirm('Delete this service?')) {
      this.api.delete('services/' + id).subscribe({
        next: () => this.loadServices(),
        error: (err) => console.error(err)
      });
    }
  }
}
