import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-0.5">
      @for (star of stars; track star) {
        <button
          type="button"
          (click)="interactive && onRate(star)"
          (mouseenter)="interactive && (hover = star)"
          (mouseleave)="interactive && (hover = 0)"
          [disabled]="!interactive"
          class="transition-transform"
          [class.cursor-pointer]="interactive"
          [class.hover:scale-110]="interactive">
          <span class="material-icons text-lg"
                [class.text-secondary]="star <= (hover || value)"
                [class.text-gray-300]="star > (hover || value)">
            {{ star <= (hover || value) ? 'star' : (star - 0.5 <= (hover || value) ? 'star_half' : 'star_border') }}
          </span>
        </button>
      }
      @if (showCount && count !== undefined) {
        <span class="text-sm text-gray-500 ml-1">({{ count }})</span>
      }
    </div>
  `,
})
export class StarRatingComponent {
  @Input() value = 0;
  @Input() max = 5;
  @Input() interactive = false;
  @Input() showCount = false;
  @Input() count?: number;
  @Output() ratingChange = new EventEmitter<number>();

  hover = 0;

  get stars(): number[] {
    return Array.from({ length: this.max }, (_, i) => i + 1);
  }

  onRate(star: number) {
    this.value = star;
    this.ratingChange.emit(star);
  }
}
