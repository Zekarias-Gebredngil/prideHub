import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface AdminResourceField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'checkbox' | 'select';
  required?: boolean;
  options?: { label: string; value: unknown }[];
  optionsEndpoint?: string;
  optionLabel?: string;
  optionValue?: string;
}

export interface AdminResourceColumn {
  key: string;
  label: string;
  type?: 'text' | 'money' | 'boolean' | 'date' | 'nested';
  path?: string;
}

export interface AdminResourceAction {
  label: string;
  icon: string;
  endpoint: (row: any) => string;
  method: 'patch' | 'delete';
  body?: (row: any) => unknown;
  confirm?: string;
  visible?: (row: any) => boolean;
}

export interface AdminResourceConfig {
  title: string;
  description: string;
  endpoint: string;
  paginated?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  fields?: AdminResourceField[];
  columns: AdminResourceColumn[];
  actions?: AdminResourceAction[];
  defaultCreate?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

@Component({
  selector: 'app-admin-resource-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="space-y-5">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-dark dark:text-white">{{ config.title }}</h1>
          <p class="text-sm text-gray-500 dark:text-white/50 mt-1">{{ config.description }}</p>
        </div>
        @if (config.canCreate !== false && config.fields?.length) {
          <button (click)="startCreate()" class="btn-primary inline-flex items-center gap-2 text-sm">
            <span class="material-icons text-base">add</span>
            New
          </button>
        }
      </div>

      <div class="flex gap-3">
        <input [(ngModel)]="search"
               (keyup.enter)="load()"
               type="search"
               placeholder="Search"
               class="w-full sm:max-w-sm px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
        <button (click)="load()" class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-white/70 hover:border-primary">
          <span class="material-icons text-base align-middle">search</span>
        </button>
      </div>

      @if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
      }

      @if (editing()) {
        <form (ngSubmit)="save()" class="bg-white dark:bg-dark rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-dark dark:text-white">{{ editingId() ? 'Edit' : 'Create' }} {{ config.title }}</h2>
            <button type="button" (click)="cancelEdit()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
              <span class="material-icons text-base">close</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (field of config.fields || []; track field.key) {
              <label class="space-y-1" [class.md:col-span-2]="field.type === 'textarea'">
                <span class="text-xs font-medium text-gray-500 dark:text-white/50">{{ field.label }}</span>
                @if (field.type === 'textarea') {
                  <textarea [(ngModel)]="form[field.key]" [name]="field.key" rows="4"
                            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary"></textarea>
                } @else if (field.type === 'checkbox') {
                  <div class="h-11 flex items-center">
                    <input [(ngModel)]="form[field.key]" [name]="field.key" type="checkbox" class="accent-primary">
                  </div>
                } @else if (field.type === 'select') {
                  <select [(ngModel)]="form[field.key]" [name]="field.key" [required]="!!field.required"
                          class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                    <option value="">Select</option>
                    @for (option of optionsFor(field); track option.value) {
                      <option [ngValue]="option.value">{{ option.label }}</option>
                    }
                  </select>
                } @else {
                  <input [(ngModel)]="form[field.key]" [name]="field.key" [required]="!!field.required"
                         [type]="field.type === 'number' ? 'number' : 'text'"
                         class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
                }
              </label>
            }
          </div>

          <div class="flex justify-end gap-3">
            <button type="button" (click)="cancelEdit()" class="btn-outline text-sm">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary text-sm">
              {{ saving() ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      }

      <div class="overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-dark shadow-sm">
        @if (loading()) {
          <div class="p-8 text-center text-gray-400">Loading...</div>
        } @else if (!rows().length) {
          <div class="p-8 text-center text-gray-400">No records found.</div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-white/5 text-left text-xs uppercase text-gray-400">
                <tr>
                  @for (column of config.columns; track column.key) {
                    <th class="px-4 py-3 font-semibold">{{ column.label }}</th>
                  }
                  <th class="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-white/10">
                @for (row of rows(); track row.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-white/5">
                    @for (column of config.columns; track column.key) {
                      <td class="px-4 py-3 text-gray-600 dark:text-white/70">{{ display(row, column) }}</td>
                    }
                    <td class="px-4 py-3">
                      <div class="flex justify-end gap-2">
                        @if (config.canEdit !== false && config.fields?.length) {
                          <button (click)="startEdit(row)" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500" title="Edit">
                            <span class="material-icons text-base">edit</span>
                          </button>
                        }
                        @for (action of visibleActions(row); track action.label) {
                          <button (click)="runAction(action, row)" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500" [title]="action.label">
                            <span class="material-icons text-base">{{ action.icon }}</span>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </section>
  `,
})
export class AdminResourceListComponent implements OnInit, OnChanges {
  @Input({ required: true }) config!: AdminResourceConfig;

  private readonly api = inject(ApiService);

  readonly rows = signal<any[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly editing = signal(false);
  readonly editingId = signal('');
  readonly dynamicOptions = signal<Record<string, { label: string; value: unknown }[]>>({});

  search = '';
  form: Record<string, any> = {};

  ngOnInit(): void {
    this.loadOptions();
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && !changes['config'].firstChange) {
      this.loadOptions();
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const params = { limit: 50, search: this.search, ...(this.config.query || {}) };
    const request: Observable<any> = this.config.paginated === false
      ? this.api.get<any[]>(this.config.endpoint, params)
      : this.api.getPaginated<any>(this.config.endpoint, params);

    request.subscribe({
      next: (res: any) => {
        this.rows.set(Array.isArray(res) ? res : res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(`Could not load ${this.config.title.toLowerCase()}.`);
        this.loading.set(false);
      },
    });
  }

  startCreate(): void {
    this.form = { ...(this.config.defaultCreate || {}) };
    for (const field of this.config.fields || []) {
      if (this.form[field.key] === undefined) {
        this.form[field.key] = field.type === 'checkbox' ? false : '';
      }
    }
    this.editingId.set('');
    this.editing.set(true);
  }

  startEdit(row: any): void {
    this.form = {};
    for (const field of this.config.fields || []) {
      this.form[field.key] = row[field.key] ?? (field.type === 'checkbox' ? false : '');
    }
    this.editingId.set(row.id);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.editingId.set('');
    this.form = {};
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    const body = this.normalizeBody();
    const request = this.editingId()
      ? this.api.patch(`${this.config.endpoint}/${this.editingId()}`, body)
      : this.api.post(this.config.endpoint, body);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.load();
      },
      error: () => {
        this.error.set('Save failed. Check required fields and try again.');
        this.saving.set(false);
      },
    });
  }

  runAction(action: AdminResourceAction, row: any): void {
    if (action.confirm && !confirm(action.confirm)) return;
    const request = action.method === 'delete'
      ? this.api.delete(action.endpoint(row))
      : this.api.patch(action.endpoint(row), action.body ? action.body(row) : {});
    request.subscribe({
      next: () => this.load(),
      error: () => this.error.set(`${action.label} failed.`),
    });
  }

  visibleActions(row: any): AdminResourceAction[] {
    return (this.config.actions || []).filter(action => !action.visible || action.visible(row));
  }

  optionsFor(field: AdminResourceField): { label: string; value: unknown }[] {
    return field.options || this.dynamicOptions()[field.key] || [];
  }

  display(row: any, column: AdminResourceColumn): string {
    const value = this.valueAt(row, column.path || column.key);
    if (column.type === 'boolean') return value ? 'Yes' : 'No';
    if (column.type === 'date') return value ? new Date(value as string | number | Date).toLocaleDateString() : '-';
    if (column.type === 'money') return value !== undefined && value !== null ? `${Number(value).toLocaleString()} ETB` : '-';
    return value !== undefined && value !== null && value !== '' ? String(value) : '-';
  }

  private loadOptions(): void {
    const fields = (this.config.fields || []).filter(field => field.optionsEndpoint);
    for (const field of fields) {
      this.api.get<any[]>(field.optionsEndpoint!).subscribe({
        next: (items: any[]) => {
          const options = items.map(item => ({
            label: item[field.optionLabel || 'name'],
            value: item[field.optionValue || 'id'],
          }));
          this.dynamicOptions.update(current => ({ ...current, [field.key]: options }));
        },
      });
    }
  }

  private normalizeBody(): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    for (const field of this.config.fields || []) {
      const value = this.form[field.key];
      if (value === '' || value === null || value === undefined) continue;
      body[field.key] = field.type === 'number' ? Number(value) : value;
    }
    return body;
  }

  private valueAt(row: any, path: string): unknown {
    return path.split('.').reduce((current, key) => current?.[key], row);
  }
}
