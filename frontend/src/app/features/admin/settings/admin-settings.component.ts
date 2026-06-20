import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="font-display text-2xl font-bold text-dark dark:text-white mb-4">Settings</h1>
      <p class="text-gray-500 dark:text-white/50">Settings management panel.</p>
    </div>
  `
})
export class AdminSettingsComponent {}
