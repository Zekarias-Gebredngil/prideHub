import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ActiveSession } from '../../../core/models/user.model';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-2xl">
      <div>
        <h1 class="font-display text-2xl font-bold text-dark dark:text-white">Security Settings</h1>
        <p class="text-sm text-gray-500 dark:text-white/50 mt-1">Manage your sessions, password and two-factor authentication</p>
      </div>

      @if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error() }}</div>
      }
      @if (success()) {
        <div class="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{{ success() }}</div>
      }

      <!-- Change Password -->
      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
        <h2 class="font-semibold text-dark dark:text-white mb-4 flex items-center gap-2">
          <span class="material-icons text-lg text-primary">lock</span>
          Change Password
        </h2>
        <div class="space-y-3">
          <label class="block space-y-1">
            <span class="text-xs font-medium text-gray-500 dark:text-white/50">Current Password</span>
            <input [(ngModel)]="pwForm.current" type="password"
                   class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
          </label>
          <label class="block space-y-1">
            <span class="text-xs font-medium text-gray-500 dark:text-white/50">New Password</span>
            <input [(ngModel)]="pwForm.newPw" type="password"
                   class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
          </label>
          <label class="block space-y-1">
            <span class="text-xs font-medium text-gray-500 dark:text-white/50">Confirm New Password</span>
            <input [(ngModel)]="pwForm.confirm" type="password"
                   class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-dark dark:text-white focus:outline-none focus:border-primary">
          </label>
        </div>
        <button (click)="changePassword()" [disabled]="changingPw() || !pwForm.current || !pwForm.newPw"
                class="mt-4 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-900 disabled:opacity-50">
          {{ changingPw() ? 'Updating...' : 'Update Password' }}
        </button>
      </div>

      <!-- Two-Factor Authentication -->
      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="font-semibold text-dark dark:text-white flex items-center gap-2">
              <span class="material-icons text-lg text-primary">security</span>
              Two-Factor Authentication (TOTP)
            </h2>
            <p class="text-sm text-gray-500 dark:text-white/50 mt-1">
              Adds an extra layer of security using an authenticator app (Google Authenticator, Authy).
            </p>
          </div>
          <span class="shrink-0 px-2 py-1 rounded-full text-xs font-semibold"
                [class]="currentUser()?.isTwoFactorEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
            {{ currentUser()?.isTwoFactorEnabled ? 'Enabled' : 'Disabled' }}
          </span>
        </div>

        @if (!currentUser()?.isTwoFactorEnabled) {
          @if (!totpSetup()) {
            <button (click)="enable2FA()" [disabled]="enabling2FA()"
                    class="mt-4 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-900 disabled:opacity-50">
              {{ enabling2FA() ? 'Setting up...' : 'Enable 2FA' }}
            </button>
          } @else {
            <div class="mt-4 space-y-4">
              <p class="text-sm text-gray-600 dark:text-white/70">
                Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
              </p>
              <img [src]="totpSetup()!.qrCode" alt="QR Code" class="w-40 h-40 rounded-xl border border-gray-200">
              <p class="text-xs text-gray-400 font-mono break-all">Secret: {{ totpSetup()!.secret }}</p>
              <div class="flex gap-3">
                <input [(ngModel)]="totpCode" type="text" maxlength="6" placeholder="000000"
                       class="w-32 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-center font-mono tracking-widest focus:outline-none focus:border-primary dark:text-white">
                <button (click)="verify2FA()" [disabled]="verifying2FA() || totpCode.length < 6"
                        class="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-900 disabled:opacity-50">
                  {{ verifying2FA() ? 'Verifying...' : 'Verify & Activate' }}
                </button>
              </div>
            </div>
          }
        } @else {
          <div class="mt-4 space-y-3">
            <p class="text-sm text-gray-500 dark:text-white/50">Enter your current TOTP code to disable 2FA.</p>
            <div class="flex gap-3">
              <input [(ngModel)]="disableCode" type="text" maxlength="6" placeholder="000000"
                     class="w-32 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-center font-mono tracking-widest focus:outline-none focus:border-primary dark:text-white">
              <button (click)="disable2FA()" [disabled]="disabling2FA() || disableCode.length < 6"
                      class="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {{ disabling2FA() ? 'Disabling...' : 'Disable 2FA' }}
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Active Sessions -->
      <div class="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-dark dark:text-white flex items-center gap-2">
            <span class="material-icons text-lg text-primary">devices</span>
            Active Sessions
          </h2>
          <button (click)="logoutAll()" [disabled]="loggingOutAll()"
                  class="text-sm text-red-500 hover:underline disabled:opacity-50">
            {{ loggingOutAll() ? 'Signing out...' : 'Sign out all devices' }}
          </button>
        </div>
        @if (loadingSessions()) {
          <div class="text-sm text-gray-400">Loading sessions...</div>
        } @else if (!sessions().length) {
          <div class="text-sm text-gray-400">No active sessions found.</div>
        } @else {
          <div class="space-y-3">
            @for (session of sessions(); track session.id) {
              <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span class="material-icons text-base text-primary">{{ deviceIcon(session) }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-dark dark:text-white">
                      {{ session.browser || 'Unknown browser' }}
                      @if (session.os) { <span class="text-gray-400"> · {{ session.os }}</span> }
                    </p>
                    <p class="text-xs text-gray-400">
                      {{ session.ipAddress || 'Unknown IP' }}
                      @if (session.lastUsedAt) { · Last used {{ session.lastUsedAt | date:'MMM d, HH:mm' }} }
                    </p>
                  </div>
                </div>
                <button (click)="revokeSession(session.id)" [disabled]="revokingId() === session.id"
                        class="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                        title="Revoke this session">
                  <span class="material-icons text-base">logout</span>
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class SecurityComponent implements OnInit {
  private readonly auth = inject(AuthService);

  readonly currentUser = this.auth.currentUser;
  readonly error = signal('');
  readonly success = signal('');

  // Password
  readonly changingPw = signal(false);
  pwForm = { current: '', newPw: '', confirm: '' };

  // 2FA
  readonly enabling2FA = signal(false);
  readonly verifying2FA = signal(false);
  readonly disabling2FA = signal(false);
  readonly totpSetup = signal<{ secret: string; qrCode: string } | null>(null);
  totpCode = '';
  disableCode = '';

  // Sessions
  readonly loadingSessions = signal(true);
  readonly sessions = signal<ActiveSession[]>([]);
  readonly loggingOutAll = signal(false);
  readonly revokingId = signal('');

  ngOnInit(): void {
    this.loadSessions();
  }

  // ── Password ────────────────────────────────────────────────────────────────

  changePassword(): void {
    if (this.pwForm.newPw !== this.pwForm.confirm) {
      this.error.set('New passwords do not match');
      return;
    }
    this.changingPw.set(true);
    this.error.set('');
    this.auth.changePassword(this.pwForm.current, this.pwForm.newPw).subscribe({
      next: () => {
        this.changingPw.set(false);
        this.pwForm = { current: '', newPw: '', confirm: '' };
        this.success.set('Password updated. You have been signed out from all other devices.');
      },
      error: (err) => {
        this.changingPw.set(false);
        this.error.set(err?.error?.message || 'Failed to change password');
      },
    });
  }

  // ── 2FA ─────────────────────────────────────────────────────────────────────

  enable2FA(): void {
    this.enabling2FA.set(true);
    this.auth.enable2FA().subscribe({
      next: (setup) => { this.enabling2FA.set(false); this.totpSetup.set(setup); },
      error: (err) => { this.enabling2FA.set(false); this.error.set(err?.error?.message || 'Failed to setup 2FA'); },
    });
  }

  verify2FA(): void {
    this.verifying2FA.set(true);
    this.auth.verify2FA(this.totpCode).subscribe({
      next: (res) => {
        this.verifying2FA.set(false);
        if (res.verified) {
          this.totpSetup.set(null);
          this.totpCode = '';
          this.success.set('Two-factor authentication is now active.');
          this.auth.loadCurrentUser();
        } else {
          this.error.set('Invalid code. Please try again.');
        }
      },
      error: (err) => { this.verifying2FA.set(false); this.error.set(err?.error?.message || 'Invalid code'); },
    });
  }

  disable2FA(): void {
    this.disabling2FA.set(true);
    this.auth.disable2FA(this.disableCode).subscribe({
      next: () => {
        this.disabling2FA.set(false);
        this.disableCode = '';
        this.success.set('Two-factor authentication disabled.');
        this.auth.loadCurrentUser();
      },
      error: (err) => { this.disabling2FA.set(false); this.error.set(err?.error?.message || 'Invalid code'); },
    });
  }

  // ── Sessions ─────────────────────────────────────────────────────────────────

  loadSessions(): void {
    this.auth.getSessions().subscribe({
      next: (s) => { this.sessions.set(s); this.loadingSessions.set(false); },
      error: () => this.loadingSessions.set(false),
    });
  }

  revokeSession(id: string): void {
    this.revokingId.set(id);
    this.auth.revokeSession(id).subscribe({
      next: () => { this.revokingId.set(''); this.loadSessions(); },
      error: () => { this.revokingId.set(''); this.error.set('Failed to revoke session'); },
    });
  }

  logoutAll(): void {
    this.loggingOutAll.set(true);
    this.auth.logoutAll().subscribe({
      next: () => { this.loggingOutAll.set(false); },
      error: () => { this.loggingOutAll.set(false); this.error.set('Failed to logout all devices'); },
    });
  }

  deviceIcon(session: ActiveSession): string {
    const os = (session.os || '').toLowerCase();
    const browser = (session.browser || '').toLowerCase();
    if (os.includes('android') || os.includes('ios') || browser.includes('mobile')) return 'smartphone';
    if (os.includes('ipad') || os.includes('tablet')) return 'tablet';
    return 'computer';
  }
}
