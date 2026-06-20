import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (type) {
      @case ('card') {
        <div class="rounded-2xl overflow-hidden bg-white shadow-sm">
          <div class="skeleton h-48 w-full"></div>
          <div class="p-5 space-y-3">
            <div class="skeleton h-5 w-3/4 rounded-lg"></div>
            <div class="skeleton h-4 w-full rounded-lg"></div>
            <div class="skeleton h-4 w-2/3 rounded-lg"></div>
            <div class="flex justify-between mt-4">
              <div class="skeleton h-6 w-24 rounded-lg"></div>
              <div class="skeleton h-9 w-28 rounded-xl"></div>
            </div>
          </div>
        </div>
      }
      @case ('text') {
        <div class="space-y-2">
          @for (line of [1,2,3]; track line) {
            <div class="skeleton rounded-lg" [style.height.px]="16" [style.width]="getWidth(line)"></div>
          }
        </div>
      }
      @case ('avatar') {
        <div class="flex items-center gap-3">
          <div class="skeleton rounded-full" [style.width.px]="size" [style.height.px]="size"></div>
          <div class="flex-1 space-y-2">
            <div class="skeleton h-4 w-1/2 rounded-lg"></div>
            <div class="skeleton h-3 w-3/4 rounded-lg"></div>
          </div>
        </div>
      }
      @case ('list-item') {
        <div class="flex items-center gap-4 p-4 rounded-xl bg-white shadow-sm">
          <div class="skeleton rounded-xl w-16 h-16"></div>
          <div class="flex-1 space-y-2">
            <div class="skeleton h-4 w-2/3 rounded-lg"></div>
            <div class="skeleton h-3 w-1/2 rounded-lg"></div>
          </div>
          <div class="skeleton h-8 w-20 rounded-lg"></div>
        </div>
      }
      @default {
        <div class="skeleton rounded-lg" [style.height.px]="height" [style.width]="width"></div>
      }
    }
  `,
})
export class SkeletonLoaderComponent {
  @Input() type: 'card' | 'text' | 'avatar' | 'list-item' | 'block' = 'block';
  @Input() height = 20;
  @Input() width = '100%';
  @Input() size = 40;

  getWidth(line: number): string {
    const widths = ['100%', '85%', '70%'];
    return widths[line - 1] || '80%';
  }
}
