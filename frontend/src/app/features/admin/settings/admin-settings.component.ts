import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface SettingRow {
  key: string;
  value: unknown;
  group?: string;
  description?: string;
  isPublic?: boolean;
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="space-y-5">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-dark dark:text-white">Settings</h1>
          <p class="text-sm text-gray-500 dark:text-white/50 mt-1">Update public site and system configuration values.</p>
        </div>
        <button (click)="startCreate()" class="btn-primary inline-flex items-center gap-2 text-sm">
          <span class="material-icons text-base">add</span>
          New Setting
        </button>
      </div>

      <div class="flex gap-3">
        <select [(ngModel)]="group" (change)="load()" class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-dark dark:text-white">
          <option value="general">General</option>
          <option value="site">Site</option>
          <option value="booking">Booking</option>
          <option value="payments">Payments</option>
          <option value="mail">Mail</option>
        </select>
        <button (click)="load()" class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-white/70">
          Refresh
        </button>
      </div>

      @if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
      }

      @if (editing()) {
        <form (ngSubmit)="save()" class="bg-white dark:bg-dark rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="space-y-1">
              <span class="text-xs font-medium text-gray-500">Key</span>
              <input [(ngModel)]="form.key" name="key" required [readonly]="editingExisting()"
                     class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white">
            </label>
            <label class="space-y-1">
              <span class="text-xs font-medium text-gray-500">Group</span>
              <input [(ngModel)]="form.group" name="group"
                     class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white">
            </label>
            <label class="space-y-1 md:col-span-2">
              <span class="text-xs font-medium text-gray-500">Value</span>
              <textarea [(ngModel)]="valueText" name="value" rows="3"
                        class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white"></textarea>
            </label>
            <label class="space-y-1 md:col-span-2">
              <span class="text-xs font-medium text-gray-500">Description</span>
              <input [(ngModel)]="form.description" name="description"
                     class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white">
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70">
              <input [(ngModel)]="form.isPublic" name="isPublic" type="checkbox" class="accent-primary">
              Public
            </label>
          </div>
          <div class="flex justify-end gap-3">
            <button type="button" (click)="cancelEdit()" class="btn-outline text-sm">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary text-sm">{{ saving() ? 'Saving...' : 'Save' }}</button>
          </div>
        </form>
      }

      <div class="overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-dark shadow-sm">
        @if (loading()) {
          <div class="p-8 text-center text-gray-400">Loading...</div>
        } @else if (!settings().length) {
          <div class="p-8 text-center text-gray-400">No settings found.</div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-white/5 text-left text-xs uppercase text-gray-400">
              <tr>
                <th class="px-4 py-3">Key</th>
                <th class="px-4 py-3">Value</th>
                <th class="px-4 py-3">Public</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-white/10">
              @for (setting of settings(); track setting.key) {
                <tr>
                  <td class="px-4 py-3 font-medium text-dark dark:text-white">{{ setting.key }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ stringify(setting.value) }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ setting.isPublic ? 'Yes' : 'No' }}</td>
                  <td class="px-4 py-3 text-right">
                    <button (click)="startEdit(setting)" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500">
                      <span class="material-icons text-base">edit</span>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </section>
  `,
})
export class AdminSettingsComponent {
  private readonly api = inject(ApiService);

  readonly settings = signal<SettingRow[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly editing = signal(false);
  readonly editingExisting = signal(false);

  group = 'general';
  valueText = '';
  form: SettingRow = { key: '', value: '', group: this.group, isPublic: false };

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.get<SettingRow[]>(`settings/group/${this.group}`).subscribe({
      next: rows => {
        this.settings.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load settings.');
        this.loading.set(false);
      },
    });
  }

  startCreate(): void {
    this.form = { key: '', value: '', group: this.group, isPublic: false };
    this.valueText = '';
    this.editingExisting.set(false);
    this.editing.set(true);
  }

  startEdit(setting: SettingRow): void {
    this.form = { ...setting };
    this.valueText = this.stringify(setting.value);
    this.editingExisting.set(true);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.editingExisting.set(false);
  }

  save(): void {
    this.saving.set(true);
    const { id, updatedAt, createdAt, ...restForm } = this.form as any;
    const payload = {
      ...restForm,
      value: this.parseValue(this.valueText),
      group: restForm.group || this.group,
    };
    this.api.post('settings', payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.load();
      },
      error: () => {
        this.error.set('Setting save failed.');
        this.saving.set(false);
      },
    });
  }

  stringify(value: unknown): string {
    return typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  }

  private parseValue(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
