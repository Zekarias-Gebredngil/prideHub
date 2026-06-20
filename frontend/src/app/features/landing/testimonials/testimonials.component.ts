import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Testimonial } from '../../../core/models/content.model';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, StarRatingComponent],
  template: `
    <section class="pt-32 pb-16" style="background:linear-gradient(135deg,#8B1538,#2B2B2B);">
      <div class="container mx-auto px-4 text-center">
        <span class="text-secondary text-sm font-semibold uppercase tracking-widest block mb-3">Happy Clients</span>
        <h1 class="font-display text-5xl font-bold text-white mb-4">Client Testimonials</h1>
        <p class="text-white/70 text-lg">Real stories from real clients who trusted us with their celebrations</p>
        <!-- Aggregate rating -->
        <div class="flex items-center justify-center gap-3 mt-6">
          <div class="flex">
            @for (s of [1,2,3,4,5]; track s) {
              <span class="material-icons text-secondary text-2xl">star</span>
            }
          </div>
          <span class="text-white/80 text-lg font-semibold">4.9 / 5.0</span>
          <span class="text-white/50">· Based on 100+ reviews</span>
        </div>
      </div>
    </section>

    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Filter by event type -->
        <div class="flex flex-wrap gap-3 mb-10 justify-center">
          <button (click)="selectedType.set('')"
                  class="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  [class]="!selectedType() ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
            All Events
          </button>
          @for (type of eventTypes; track type) {
            <button (click)="selectedType.set(type)"
                    class="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                    [class]="selectedType() === type ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
              {{ type }}
            </button>
          }
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          @for (t of filteredTestimonials(); track t.id) {
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-luxury hover:-translate-y-1 transition-all duration-300">
              <!-- Stars -->
              <div class="flex items-center gap-0.5 mb-4">
                @for (s of [1,2,3,4,5]; track s) {
                  <span class="material-icons text-lg" [class]="s <= t.rating ? 'text-secondary' : 'text-gray-200'">star</span>
                }
              </div>
              <!-- Content -->
              <p class="text-gray-600 text-sm leading-relaxed mb-6 italic">"{{ t.content }}"</p>
              <!-- Client -->
              <div class="flex items-center gap-3 pt-4 border-t border-gray-50">
                <div class="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                  @if (t.avatar) {
                    <img [src]="t.avatar" [alt]="t.clientName" class="w-full h-full object-cover">
                  } @else {
                    <span class="font-bold text-primary">{{ t.clientName[0] }}</span>
                  }
                </div>
                <div>
                  <p class="font-semibold text-dark text-sm">{{ t.clientName }}</p>
                  <p class="text-gray-400 text-xs">{{ t.clientTitle }} · {{ t.eventType }}</p>
                </div>
              </div>
            </div>
          }
        </div>

        @if (filteredTestimonials().length === 0) {
          <div class="text-center py-12">
            <p class="text-gray-400">No testimonials for this event type yet.</p>
          </div>
        }

        <!-- Submit form -->
        <div class="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 class="font-display text-2xl font-bold text-dark mb-2 text-center">Share Your Experience</h2>
          <p class="text-gray-500 text-sm text-center mb-6">We'd love to hear about your event with PrideHub</p>

          @if (submitted()) {
            <div class="text-center p-6 rounded-2xl bg-green-50 border border-green-200">
              <span class="material-icons text-3xl text-green-500 block mb-2">check_circle</span>
              <p class="font-semibold text-green-800">Thank you for your review!</p>
              <p class="text-sm text-green-600 mt-1">It will appear after approval by our team.</p>
            </div>
          }
          @if (submitError()) {
            <div class="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              {{ submitError() }}
            </div>
          }
          @if (!submitted()) {
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input type="text" formControlName="clientName" placeholder="Full name"
                         class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm transition-colors">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select formControlName="eventType"
                          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm bg-white transition-colors">
                    <option value="">Select type</option>
                    @for (type of eventTypes; track type) {
                      <option [value]="type">{{ type }}</option>
                    }
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Your Title / Role</label>
                <input type="text" formControlName="clientTitle" placeholder="e.g. Bride, Event Manager, CEO"
                       class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm transition-colors">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <app-star-rating [value]="form.get('rating')?.value || 0" [interactive]="true"
                                 (ratingChange)="form.patchValue({ rating: $event })" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                <textarea formControlName="content" rows="4" placeholder="Tell us about your experience..."
                          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm resize-none transition-colors"></textarea>
              </div>
              <button type="submit" [disabled]="form.invalid || submitting()"
                      class="w-full py-3.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary-900 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                @if (submitting()) {
                  <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                } @else {
                  <span class="material-icons">send</span>
                }
                {{ submitting() ? 'Submitting...' : 'Submit Review' }}
              </button>
            </form>
          }
        </div>
      </div>
    </section>
  `,
})
export class TestimonialsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly testimonials = signal<Testimonial[]>([]);
  readonly selectedType = signal('');
  readonly submitted = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');

  eventTypes = ['Wedding', 'Birthday', 'Corporate', 'Graduation', 'Engagement', 'Baby Shower'];

  form = this.fb.group({
    clientName:  ['', Validators.required],
    clientTitle: [''],
    eventType:   [''],
    rating:      [5, [Validators.required, Validators.min(1)]],
    content:     ['', [Validators.required, Validators.minLength(30)]],
  });

  readonly filteredTestimonials = () => {
    const type = this.selectedType();
    if (!type) return this.testimonials();
    return this.testimonials().filter(t => t.eventType === type);
  };

  ngOnInit(): void {
    this.api.getPaginated<Testimonial>('testimonials', { limit: 50 }).subscribe({
      next: (res) => this.testimonials.set(res.data),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.submitError.set('');
    this.api.post('testimonials', this.form.value).subscribe({
      next: () => { this.submitting.set(false); this.submitted.set(true); },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.message || 'Review could not be submitted. Please try again.');
      },
    });
  }
}
