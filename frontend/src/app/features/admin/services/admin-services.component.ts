import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="font-display text-2xl font-bold text-dark dark:text-white mb-4">Services</h1>
      <p class="text-gray-500 dark:text-white/50">Services management panel.</p>
    </div>
  `
})
export class AdminServicesComponent {}
