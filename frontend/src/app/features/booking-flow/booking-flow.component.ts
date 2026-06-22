import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-booking-flow',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div class="max-w-2xl mx-auto">

        <!-- Header -->
        <div class="text-center mb-8">
          <a routerLink="/" class="inline-flex items-center gap-2 mb-6 text-primary hover:underline text-sm">
            <span class="material-icons text-sm">arrow_back</span> Back to Home
          </a>
          <h1 class="font-display text-3xl font-bold text-dark dark:text-white">Plan Your Event</h1>
          <p class="text-gray-500 dark:text-white/50 mt-2">Fill in the details below and we'll get back to you within 24 hours</p>
        </div>

        <!-- Steps -->
        <div class="flex items-center justify-center gap-2 mb-10">
          @for (s of steps; track s.num; let i = $index) {
            <div class="flex items-center gap-2">
              <div class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all"
                   [class]="step() > s.num
                     ? 'bg-green-500 text-white'
                     : step() === s.num
                     ? 'bg-primary text-white'
                     : 'bg-gray-200 dark:bg-white/10 text-gray-400'">
                @if (step() > s.num) {
                  <span class="material-icons text-sm">check</span>
                } @else {
                  {{ s.num }}
                }
              </div>
              <span class="text-xs font-medium hidden sm:block"
                    [class]="step() === s.num ? 'text-primary' : 'text-gray-400'">
                {{ s.label }}
              </span>
              @if (i < steps.length - 1) {
                <div class="w-8 h-px mx-1" [class]="step() > s.num ? 'bg-primary' : 'bg-gray-200'"></div>
              }
            </div>
          }
        </div>

        <!-- Form Card -->
        <div class="bg-white dark:bg-dark rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 p-8">

          <!-- Step 1: Event Details -->
          @if (step() === 1) {
            <div>
              <h2 class="font-display text-xl font-bold text-dark dark:text-white mb-1">Event Details</h2>
              <p class="text-gray-500 text-sm mb-6">Tell us about your event</p>

              <form [formGroup]="step1Form" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Event Type *</label>
                  <select formControlName="eventType"
                          class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                    <option value="">Select event type</option>
                    @for (type of eventTypes; track type.value) {
                      <option [value]="type.value">{{ type.label }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Event Date *</label>
                  <input type="date" formControlName="eventDate" [min]="minDate"
                         class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Estimated Guests</label>
                    <input type="number" formControlName="guestCount" placeholder="e.g. 150" min="1"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Budget (ETB)</label>
                    <input type="number" formControlName="budgetMax" placeholder="e.g. 100000" min="0"
                           class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors">
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1">Special Requests</label>
                  <textarea formControlName="specialRequests" rows="3"
                            placeholder="Any special requirements, cultural preferences, dietary needs..."
                            class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-dark dark:text-white text-sm focus:outline-none focus:border-primary transition-colors resize-none"></textarea>
                </div>
              </form>
            </div>
          }

          <!-- Step 2: Package Selection -->
          @if (step() === 2) {
            <div>
              <h2 class="font-display text-xl font-bold text-dark dark:text-white mb-1">Choose a Package</h2>
              <p class="text-gray-500 text-sm mb-6">Select a package or skip to get a custom quote</p>
              <div class="space-y-3">
                @for (pkg of packages(); track pkg.id) {
                  <label class="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all"
                         [class]="selectedPackageId() === pkg.id
                           ? 'border-primary bg-primary/3 dark:bg-primary/10'
                           : 'border-gray-200 dark:border-white/10 hover:border-gray-300'">
                    <input type="radio" name="package" [value]="pkg.id" [(ngModel)]="selectedPkg"
                           (change)="selectedPackageId.set(pkg.id)" class="accent-primary">
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-dark dark:text-white text-sm">{{ pkg.name }}</span>
                        <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                              [style.background]="(pkg.color || '#8B1538') + '20'"
                              [style.color]="pkg.color || '#8B1538'">{{ pkg.tier }}</span>
                      </div>
                      <p class="text-gray-400 text-xs mt-0.5">{{ pkg.shortDesc }}</p>
                    </div>
                    <p class="font-bold text-primary text-sm">{{ pkg.price | number }} ETB</p>
                  </label>
                }
                <label class="flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all"
                       [class]="selectedPackageId() === 'custom' ? 'border-primary bg-primary/3' : 'border-dashed border-gray-200 hover:border-gray-300'">
                  <input type="radio" name="package" value="custom" [(ngModel)]="selectedPkg"
                         (change)="selectedPackageId.set('custom')" class="accent-primary">
                  <div>
                    <p class="font-semibold text-dark dark:text-white text-sm">Custom Package</p>
                    <p class="text-gray-400 text-xs">Get a personalized quote tailored to your needs</p>
                  </div>
                </label>
              </div>
            </div>
          }

          <!-- Step 3: Confirm -->
          @if (step() === 3) {
            <div>
              <h2 class="font-display text-xl font-bold text-dark dark:text-white mb-1">Confirm Booking</h2>
              <p class="text-gray-500 text-sm mb-6">Review your booking details</p>

              <div class="space-y-3 bg-gray-50 dark:bg-white/5 rounded-2xl p-5 mb-6">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Event Type</span>
                  <span class="font-medium text-dark dark:text-white">{{ step1Form.get('eventType')?.value }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Event Date</span>
                  <span class="font-medium text-dark dark:text-white">{{ step1Form.get('eventDate')?.value | date:'MMMM d, y' }}</span>
                </div>
                @if (step1Form.get('guestCount')?.value) {
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Guests</span>
                    <span class="font-medium text-dark dark:text-white">{{ step1Form.get('guestCount')?.value }}</span>
                  </div>
                }
                @if (step1Form.get('budgetMax')?.value) {
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Budget</span>
                    <span class="font-medium text-dark dark:text-white">{{ step1Form.get('budgetMax')?.value | number }} ETB</span>
                  </div>
                }
                @if (selectedPackageId() && selectedPackageId() !== 'custom') {
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Package</span>
                    <span class="font-medium text-dark dark:text-white">{{ getPackageName() }}</span>
                  </div>
                }
                @if (venue()) {
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Selected Venue</span>
                    <span class="font-medium text-dark dark:text-white">{{ venue().name }}</span>
                  </div>
                }
                @if (vendor()) {
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Selected Vendor</span>
                    <span class="font-medium text-dark dark:text-white">{{ vendor().businessName }}</span>
                  </div>
                }
              </div>

              <div class="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary">
                <span class="material-icons text-sm mr-1">info</span>
                Our team will contact you within 24 hours to discuss details and send a quotation.
              </div>
            </div>
          }

          <!-- Success -->
          @if (step() === 4) {
            <div class="text-center py-4">
              <div class="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <span class="material-icons text-3xl text-green-500">check_circle</span>
              </div>
              <h2 class="font-display text-2xl font-bold text-dark dark:text-white mb-2">Booking Submitted!</h2>
              <p class="text-gray-500 mb-2">Your booking reference is:</p>
              <div class="inline-block px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
                <span class="font-mono font-bold text-primary text-lg">{{ bookingRef() }}</span>
              </div>
              <p class="text-gray-400 text-sm mt-4 mb-6">We'll send a confirmation to {{ auth.currentUser()?.email }} and reach out within 24 hours.</p>
              <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <a routerLink="/dashboard/bookings" class="btn-primary inline-flex items-center gap-2">
                  <span class="material-icons text-base">event_note</span> View My Bookings
                </a>
                <a routerLink="/" class="btn-outline inline-flex items-center gap-2">
                  <span class="material-icons text-base">home</span> Back to Home
                </a>
              </div>
            </div>
          }

          <!-- Navigation -->
          @if (step() < 4) {
            <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
              @if (step() > 1) {
                <button [disabled]="step() === 1" (click)="prev()"
                        class="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors">
                  <span class="material-icons text-base">arrow_back</span> Back
                </button>
              }
              @if (step() < 3) {
                <button (click)="next()" [disabled]="step() === 1 && step1Form.invalid"
                        class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-900 disabled:opacity-50 transition-colors ml-auto">
                  Continue <span class="material-icons text-base">arrow_forward</span>
                </button>
              } @else {
                <button (click)="submit()" [disabled]="submitting()"
                        class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-900 disabled:opacity-50 transition-colors ml-auto">
                  @if (submitting()) {
                    <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  } @else {
                    <span class="material-icons text-base">celebration</span>
                  }
                  {{ submitting() ? 'Submitting...' : 'Confirm Booking' }}
                </button>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class BookingFlowComponent {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly venueId = signal<string | null>(null);
  readonly vendorId = signal<string | null>(null);
  readonly venue = signal<any>(null);
  readonly vendor = signal<any>(null);

  readonly step = signal(1);
  readonly packages = signal<any[]>([]);
  readonly selectedPackageId = signal('');
  readonly submitting = signal(false);
  readonly bookingRef = signal('');
  selectedPkg = '';

  readonly minDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  steps = [
    { num: 1, label: 'Event Details' },
    { num: 2, label: 'Package' },
    { num: 3, label: 'Confirm' },
  ];

  eventTypes = [
    { value: 'WEDDING', label: '💍 Wedding' },
    { value: 'BIRTHDAY', label: '🎂 Birthday Party' },
    { value: 'CORPORATE', label: '🏢 Corporate Event' },
    { value: 'GRADUATION', label: '🎓 Graduation' },
    { value: 'ENGAGEMENT', label: '💕 Engagement' },
    { value: 'BABY_SHOWER', label: '👶 Baby Shower' },
    { value: 'TRADITIONAL_WEDDING', label: '👗 Traditional Wedding' },
    { value: 'CONFERENCE', label: '📊 Conference' },
    { value: 'OTHER', label: '🎉 Other' },
  ];

  step1Form = this.fb.group({
    eventType:       ['', Validators.required],
    eventDate:       ['', Validators.required],
    guestCount:      [null as number | null],
    budgetMax:       [null as number | null],
    specialRequests: [''],
  });

  constructor() {
    this.api.getPaginated<any>('packages', { limit: 6 }).subscribe({
      next: (res) => this.packages.set(res.data),
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['venueId']) {
        this.venueId.set(params['venueId']);
        this.api.get<any>(`venues/${params['venueId']}`).subscribe(v => this.venue.set(v));
      }
      if (params['vendorId']) {
        this.vendorId.set(params['vendorId']);
        this.api.get<any>(`vendors/${params['vendorId']}`).subscribe(v => this.vendor.set(v));
      }
    });
  }

  next(): void { this.step.update(s => s + 1); }
  prev(): void { this.step.update(s => s - 1); }

  getPackageName(): string {
    return this.packages().find(p => p.id === this.selectedPackageId())?.name || '';
  }

  submit(): void {
    this.submitting.set(true);
    const payload: any = {
      ...this.step1Form.value,
      packageId: this.selectedPackageId() && this.selectedPackageId() !== 'custom'
        ? this.selectedPackageId()
        : undefined,
      venueId: this.venueId(),
      vendorId: this.vendorId(),
    };
    this.api.post<any>('bookings', payload).subscribe({
      next: (b) => {
        this.submitting.set(false);
        this.bookingRef.set(b.bookingNumber);
        this.step.set(4);
      },
      error: () => this.submitting.set(false),
    });
  }
}
