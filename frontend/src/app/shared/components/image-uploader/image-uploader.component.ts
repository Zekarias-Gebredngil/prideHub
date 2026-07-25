import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-2">
      @if (label) {
        <label class="block text-xs font-semibold text-gray-700 dark:text-white/80">
          {{ label }}
        </label>
      }

      <!-- Main Uploader Box -->
      <div class="relative rounded-2xl border-2 border-dashed transition-all overflow-hidden"
           [class]="borderClasses()">

        @if (uploading()) {
          <!-- Uploading Overlay -->
          <div class="p-6 text-center flex flex-col items-center justify-center bg-gray-50 dark:bg-white/5 min-h-[120px]">
            <span class="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-2"></span>
            <p class="text-xs font-semibold text-primary">Uploading Image...</p>
            <p class="text-[11px] text-gray-400">Optimizing & saving file</p>
          </div>
        } @else if (imageUrl) {
          <!-- Image Preview -->
          <div class="relative group min-h-[140px] bg-gray-900/5 dark:bg-white/5 flex items-center justify-center">
            <img [src]="resolvedUrl()" [alt]="label || 'Image preview'"
                 class="w-full h-full object-cover max-h-[260px] rounded-xl">
            
            <!-- Hover overlay actions -->
            <div class="absolute inset-0 bg-dark/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <label class="px-3.5 py-2 rounded-xl bg-white text-dark text-xs font-semibold cursor-pointer hover:bg-gray-100 shadow-md flex items-center gap-1.5 transition-transform active:scale-95">
                <span class="material-icons text-sm">cloud_upload</span> Replace File
                <input type="file" accept="image/*" (change)="onFileSelected($event)" class="hidden">
              </label>
              <button type="button" (click)="removeImage()"
                      class="px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 shadow-md flex items-center gap-1.5 transition-transform active:scale-95">
                <span class="material-icons text-sm">delete</span> Remove
              </button>
            </div>
          </div>
        } @else {
          <!-- Dropzone State -->
          <label class="p-6 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors min-h-[140px]">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <span class="material-icons text-2xl">cloud_upload</span>
            </div>
            <p class="text-xs font-semibold text-gray-800 dark:text-white">Click to Upload Image File</p>
            <p class="text-[11px] text-gray-400 mt-0.5">PNG, JPG, WebP, GIF up to 10MB</p>
            <input type="file" accept="image/*" (change)="onFileSelected($event)" class="hidden">
          </label>
        }
      </div>

      <!-- Error Message -->
      @if (error()) {
        <p class="text-xs text-red-500 flex items-center gap-1">
          <span class="material-icons text-xs">error</span> {{ error() }}
        </p>
      }

      <!-- Collapsible URL Fallback for convenience -->
      <div class="pt-1">
        <button type="button" (click)="showUrlInput.set(!showUrlInput())"
                class="text-[11px] text-gray-400 hover:text-primary transition-colors flex items-center gap-1">
          <span class="material-icons text-xs">{{ showUrlInput() ? 'expand_less' : 'link' }}</span>
          {{ showUrlInput() ? 'Hide Image URL input' : 'Paste Direct Image URL instead' }}
        </button>

        @if (showUrlInput()) {
          <div class="mt-2 flex gap-2">
            <input [ngModel]="imageUrl" (ngModelChange)="onUrlTyped($event)" type="text"
                   placeholder="https://example.com/image.jpg or /uploads/..."
                   class="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs text-dark dark:text-white focus:outline-none focus:border-primary">
          </div>
        }
      </div>
    </div>
  `,
})
export class ImageUploaderComponent {
  private readonly api = inject(ApiService);

  @Input() imageUrl = '';
  @Input() label = '';
  @Input() hint = 'PNG, JPG, WebP up to 10MB';
  @Input() shape: 'banner' | 'square' | 'avatar' = 'banner';

  @Output() imageUrlChange = new EventEmitter<string>();

  readonly uploading = signal(false);
  readonly error = signal('');
  readonly showUrlInput = signal(false);

  resolvedUrl(): string {
    if (!this.imageUrl) return '';
    if (this.imageUrl.startsWith('http://') || this.imageUrl.startsWith('https://') || this.imageUrl.startsWith('data:')) {
      return this.imageUrl;
    }
    if (this.imageUrl.startsWith('/')) {
      return `${this.api.baseUrl.replace('/api/v1', '')}${this.imageUrl}`;
    }
    return this.imageUrl;
  }

  borderClasses(): string {
    if (this.error()) return 'border-red-300 dark:border-red-800 bg-red-50/20';
    if (this.imageUrl) return 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5';
    return 'border-gray-300 dark:border-white/20 bg-gray-50/50 dark:bg-white/5 hover:border-primary';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.error.set('Please select a valid image file (PNG, JPG, WebP, GIF)');
      return;
    }

    this.error.set('');
    this.uploading.set(true);

    const formData = new FormData();
    formData.append('file', file);

    this.api.upload<any>('upload/single', formData).subscribe({
      next: (res) => {
        this.uploading.set(false);
        const uploadedUrl = res?.url || res?.data?.url || '';
        if (uploadedUrl) {
          this.imageUrl = uploadedUrl;
          this.imageUrlChange.emit(uploadedUrl);
        } else {
          this.error.set('Upload failed: Invalid server response');
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(err?.error?.message || 'Could not upload file. Please try again.');
      },
    });
  }

  removeImage() {
    this.imageUrl = '';
    this.imageUrlChange.emit('');
  }

  onUrlTyped(val: string) {
    this.imageUrl = val;
    this.imageUrlChange.emit(val);
  }
}
