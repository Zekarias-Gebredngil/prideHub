import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const user = (role: User['role']): User => ({
    id: `${role.toLowerCase()}-id`,
    email: `${role.toLowerCase()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    role,
    status: 'ACTIVE',
    isEmailVerified: true,
    isPhoneVerified: false,
    isTwoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('emits the current user only after login tokens and profile are loaded', () => {
    let emittedUser: User | undefined;

    service.login({ email: 'admin@pridehub.com', password: 'Admin@123456' }).subscribe((loggedInUser) => {
      emittedUser = loggedInUser;
    });

    http.expectOne(`${environment.apiUrl}/auth/login`).flush({
      success: true,
      message: 'Success',
      data: { accessToken: 'access-token', tokenType: 'Bearer' },
      errors: [],
    });

    expect(emittedUser).toBeUndefined();
    expect(service.currentUser()).toBeNull();

    const superAdmin = user('SUPER_ADMIN');
    http.expectOne(`${environment.apiUrl}/users/me`).flush({
      success: true,
      message: 'Success',
      data: superAdmin,
      errors: [],
    });

    expect(emittedUser).toEqual(superAdmin);
    expect(service.currentUser()).toEqual(superAdmin);
  });

  it('maps users to their corresponding dashboard routes', () => {
    expect(service.dashboardUrlFor(user('SUPER_ADMIN'))).toBe('/admin');
    expect(service.dashboardUrlFor(user('ADMIN'))).toBe('/admin');
    expect(service.dashboardUrlFor(user('EVENT_PLANNER'))).toBe('/admin');
    expect(service.dashboardUrlFor(user('CLIENT'))).toBe('/dashboard');
    expect(service.dashboardUrlFor(user('VENDOR'))).toBe('/dashboard');
  });
});
