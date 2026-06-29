import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(ctrl: AbstractControl) {
  const pass = ctrl.get('password')?.value;
  const confirm = ctrl.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

interface RoleOption {
  role: string;
  label: string;
  tagline: string;
  icon: string;
  gradient: string;
  border: string;
  iconBg: string;
  features: string[];
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div>
      <!-- Step 1: Role Selection -->
      @if (step() === 1) {
        <div>
          <h2 class="font-display text-3xl font-bold text-dark dark:text-white mb-1">Join PrideHub</h2>
          <p class="text-gray-500 dark:text-white/60 mb-7">Who are you? Choose your account type to get started.</p>

          <div class="space-y-3">
            @for (opt of roleOptions; track opt.role) {
              <button type="button" (click)="selectRole(opt.role)"
                      class="w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 group"
                      [class]="selectedRole() === opt.role ? opt.border + ' ' + opt.gradient : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/5'">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all"
                       [class]="selectedRole() === opt.role ? opt.iconBg : 'bg-gray-100 dark:bg-white/10'">
                    <span class="material-icons text-2xl"
                          [class]="selectedRole() === opt.role ? 'text-white' : 'text-gray-500 dark:text-white/60'">
                      {{ opt.icon }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <p class="font-semibold text-dark dark:text-white">{{ opt.label }}</p>
                      @if (selectedRole() === opt.role) {
                        <span class="material-icons text-primary text-xl">check_circle</span>
                      }
                    </div>
                    <p class="text-sm text-gray-500 dark:text-white/50 mt-0.5">{{ opt.tagline }}</p>
                    <div class="flex flex-wrap gap-1.5 mt-2">
                      @for (f of opt.features; track f) {
                        <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60">{{ f }}</span>
                      }
                    </div>
                  </div>
                </div>
              </button>
            }
          </div>

          <button (click)="goToForm()"
                  [disabled]="!selectedRole()"
                  class="mt-6 w-full py-3.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm">
            <span class="material-icons text-lg">arrow_forward</span>
            Continue as {{ selectedRoleLabel() }}
          </button>

          <p class="text-center text-sm text-gray-500 dark:text-white/50 mt-5">
            Already have an account?
            <a routerLink="/auth/login" class="text-primary font-semibold hover:underline ml-1">Sign in</a>
          </p>
        </div>
      }

      <!-- Step 2: Registration Form -->
      @if (step() === 2) {
        <div>
          <!-- Back + Role Badge -->
          <div class="flex items-center gap-3 mb-5">
            <button (click)="step.set(1)" class="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <span class="material-icons text-gray-500 dark:text-white/60">arrow_back</span>
            </button>
            <div>
              <h2 class="font-display text-2xl font-bold text-dark dark:text-white">Create Account</h2>
              <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    [class]="roleBadgeClass()">{{ selectedRoleLabel() }}</span>
            </div>
          </div>

          @if (success()) {
            <div class="p-5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-center">
              <span class="material-icons text-3xl text-green-500 block mb-2">mark_email_read</span>
              <p class="font-semibold mb-1">Account created!</p>
              <p class="text-sm">Check your email to verify your account.</p>
              <a routerLink="/auth/login" class="inline-block mt-3 text-sm font-semibold text-primary hover:underline">
                Go to Login →
              </a>
            </div>
          } @else {
            @if (error()) {
              <div class="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-5 text-sm">
                <span class="material-icons text-red-500">error_outline</span>
                {{ error() }}
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1">First Name</label>
                  <input type="text" formControlName="firstName" placeholder="Abel"
                         class="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary transition-colors">
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1">Last Name</label>
                  <input type="text" formControlName="lastName" placeholder="Tadesse"
                         class="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary transition-colors">
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1">Email Address</label>
                <div class="relative">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-base">email</span>
                  <input type="email" formControlName="email" placeholder="you@example.com"
                         class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary transition-colors">
                </div>
              </div>

              @if (selectedRole() === 'VENDOR') {
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1">Business / Brand Name</label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-base">storefront</span>
                    <input type="text" formControlName="businessName" placeholder="e.g. Dream Events Photography"
                           class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary transition-colors">
                  </div>
                </div>
              }

              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1">Phone (Optional)</label>
                <div class="relative">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-base">phone</span>
                  <input type="tel" formControlName="phone" placeholder="+251 911 234 567"
                         class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary transition-colors">
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1">Password</label>
                <div class="relative">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-base">lock</span>
                  <input [type]="showPass() ? 'text' : 'password'" formControlName="password" placeholder="Min. 8 characters"
                         class="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary transition-colors">
                  <button type="button" (click)="togglePass()" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <span class="material-icons text-base">{{ showPass() ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
                @if (form.get('password')?.invalid && form.get('password')?.touched) {
                  <p class="text-xs text-red-500 mt-1">Min 8 chars, uppercase, number & special char required</p>
                }
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1">Confirm Password</label>
                <input [type]="showPass() ? 'text' : 'password'" formControlName="confirmPassword" placeholder="Re-enter password"
                       class="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary transition-colors"
                       [class.border-red-300]="form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched">
                @if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
                  <p class="text-xs text-red-500 mt-1">Passwords do not match</p>
                }
              </div>

              <label class="flex items-start gap-2 text-sm text-gray-600 dark:text-white/60 cursor-pointer">
                <input type="checkbox" formControlName="agree" class="mt-0.5 accent-primary">
                <span>I agree to the
                  <a routerLink="/terms" class="text-primary hover:underline">Terms of Service</a> and
                  <a routerLink="/privacy-policy" class="text-primary hover:underline">Privacy Policy</a>
                </span>
              </label>

              <button type="submit" [disabled]="form.invalid || loading()"
                      class="w-full py-3.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                @if (loading()) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Creating account...
                } @else {
                  <span class="material-icons text-base">person_add</span>
                  Create Account
                }
              </button>
            </form>
          }

          <p class="text-center text-sm text-gray-500 dark:text-white/50 mt-5">
            Already have an account?
            <a routerLink="/auth/login" class="text-primary font-semibold hover:underline ml-1">Sign in</a>
          </p>
        </div>
      }
    </div>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly step = signal(1);
  readonly selectedRole = signal('');
  readonly error = signal('');
  readonly loading = signal(false);
  readonly success = signal(false);
  readonly showPass = signal(false);

  togglePass(): void { this.showPass.update(v => !v); }

  readonly roleOptions: RoleOption[] = [
    {
      role: 'CLIENT',
      label: 'Client',
      tagline: 'I want to plan amazing events',
      icon: 'celebration',
      gradient: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-500',
      iconBg: 'bg-blue-500',
      features: ['Book events', 'Hire vendors & venues', 'Track payments'],
    },
    {
      role: 'VENDOR',
      label: 'Vendor / Service Provider',
      tagline: 'I offer services for events',
      icon: 'storefront',
      gradient: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-500',
      iconBg: 'bg-amber-500',
      features: ['List services', 'Get bookings', 'Earn & withdraw'],
    },
    {
      role: 'EVENT_PLANNER',
      label: 'Event Planner',
      tagline: 'I professionally plan & manage events',
      icon: 'event_note',
      gradient: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-500',
      iconBg: 'bg-purple-500',
      features: ['Manage client events', 'Coordinate vendors', 'Full event oversight'],
    },
  ];

  form = this.fb.group({
    firstName:    ['', [Validators.required, Validators.maxLength(100)]],
    lastName:     ['', [Validators.required, Validators.maxLength(100)]],
    email:        ['', [Validators.required, Validators.email]],
    phone:        [''],
    businessName: [''],
    password:     ['', [Validators.required, Validators.minLength(8),
                        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)]],
    confirmPassword: ['', Validators.required],
    agree:        [false, Validators.requiredTrue],
  }, { validators: passwordMatchValidator });

  selectRole(role: string): void { this.selectedRole.set(role); }

  selectedRoleLabel(): string {
    return this.roleOptions.find(o => o.role === this.selectedRole())?.label ?? '';
  }

  roleBadgeClass(): string {
    const map: Record<string, string> = {
      CLIENT:        'bg-blue-100 text-blue-700',
      VENDOR:        'bg-amber-100 text-amber-700',
      EVENT_PLANNER: 'bg-purple-100 text-purple-700',
    };
    return map[this.selectedRole()] ?? 'bg-gray-100 text-gray-600';
  }

  goToForm(): void {
    if (this.selectedRole()) this.step.set(2);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const { firstName, lastName, email, phone, password } = this.form.value;
    this.auth.register({
      firstName: firstName!,
      lastName: lastName!,
      email: email!,
      phone: phone || undefined,
      password: password!,
      role: this.selectedRole(),
    }).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: (err) => { this.loading.set(false); this.error.set(err?.error?.message || 'Registration failed'); },
    });
  }
}
