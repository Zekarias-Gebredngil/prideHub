import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Public Landing ──────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./layout/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/landing/home/home.component').then(m => m.HomeComponent) },
      { path: 'about', loadComponent: () => import('./features/landing/about/about.component').then(m => m.AboutComponent) },
      { path: 'services', loadComponent: () => import('./features/landing/services/services.component').then(m => m.ServicesComponent) },
      { path: 'services/:slug', loadComponent: () => import('./features/landing/services/service-detail/service-detail.component').then(m => m.ServiceDetailComponent) },
      { path: 'packages', loadComponent: () => import('./features/landing/packages/packages.component').then(m => m.PackagesComponent) },
      { path: 'packages/:slug', loadComponent: () => import('./features/landing/packages/package-detail/package-detail.component').then(m => m.PackageDetailComponent) },
      { path: 'venues', loadComponent: () => import('./features/landing/venues/venues.component').then(m => m.VenuesComponent) },
      { path: 'venues/:slug', loadComponent: () => import('./features/landing/venues/venue-detail/venue-detail.component').then(m => m.VenueDetailComponent) },
      { path: 'vendors', loadComponent: () => import('./features/landing/vendors/vendors.component').then(m => m.VendorsComponent) },
      { path: 'vendors/:slug', loadComponent: () => import('./features/landing/vendors/vendor-detail/vendor-detail.component').then(m => m.VendorDetailComponent) },
      { path: 'gallery', loadComponent: () => import('./features/landing/gallery/gallery.component').then(m => m.GalleryComponent) },
      { path: 'blog', loadComponent: () => import('./features/landing/blog/blog.component').then(m => m.BlogComponent) },
      { path: 'blog/:slug', loadComponent: () => import('./features/landing/blog/blog-post/blog-post.component').then(m => m.BlogPostComponent) },
      { path: 'testimonials', loadComponent: () => import('./features/landing/testimonials/testimonials.component').then(m => m.TestimonialsComponent) },
      { path: 'contact', loadComponent: () => import('./features/landing/contact/contact.component').then(m => m.ContactComponent) },
      { path: 'faq', loadComponent: () => import('./features/landing/faq/faq.component').then(m => m.FaqComponent) },
      { path: 'portfolio', loadComponent: () => import('./features/landing/portfolio/portfolio.component').then(m => m.PortfolioComponent) },
      { path: 'privacy-policy', loadComponent: () => import('./features/landing/legal/privacy-policy.component').then(m => m.PrivacyPolicyComponent) },
      { path: 'terms', loadComponent: () => import('./features/landing/legal/terms.component').then(m => m.TermsComponent) },
    ],
  },

  // ── Auth ─────────────────────────────────────────────────────────────────────
  {
    path: 'auth',
    loadComponent: () => import('./layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    canActivate: [guestGuard],
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
      { path: 'verify-email', loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent) },
      { path: 'oauth', loadComponent: () => import('./features/auth/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent) },
    ],
  },

  // ── Client Dashboard ─────────────────────────────────────────────────────────
  {
    path: 'dashboard',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/dashboard/overview/overview.component').then(m => m.OverviewComponent) },
      { path: 'bookings', loadComponent: () => import('./features/dashboard/bookings/bookings.component').then(m => m.BookingsComponent) },
      { path: 'bookings/new', loadComponent: () => import('./features/dashboard/bookings/new-booking/new-booking.component').then(m => m.NewBookingComponent) },
      { path: 'bookings/:id', loadComponent: () => import('./features/dashboard/bookings/booking-detail/booking-detail.component').then(m => m.BookingDetailComponent) },
      { path: 'payments', loadComponent: () => import('./features/dashboard/payments/payments.component').then(m => m.PaymentsComponent) },
      { path: 'messages', loadComponent: () => import('./features/dashboard/messages/messages.component').then(m => m.MessagesComponent) },
      { path: 'notifications', loadComponent: () => import('./features/dashboard/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'profile', loadComponent: () => import('./features/dashboard/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'settings', loadComponent: () => import('./features/dashboard/settings/settings.component').then(m => m.SettingsComponent) },
    ],
  },

  // ── Admin Panel ───────────────────────────────────────────────────────────────
  {
    path: 'admin',
    loadComponent: () => import('./layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'bookings', loadComponent: () => import('./features/admin/bookings/admin-bookings.component').then(m => m.AdminBookingsComponent) },
      { path: 'bookings/:id', loadComponent: () => import('./features/admin/bookings/booking-detail/admin-booking-detail.component').then(m => m.AdminBookingDetailComponent) },
      { path: 'events', loadComponent: () => import('./features/admin/events/admin-events.component').then(m => m.AdminEventsComponent) },
      { path: 'services', loadComponent: () => import('./features/admin/services/admin-services.component').then(m => m.AdminServicesComponent) },
      { path: 'packages', loadComponent: () => import('./features/admin/packages/admin-packages.component').then(m => m.AdminPackagesComponent) },
      { path: 'venues', loadComponent: () => import('./features/admin/venues/admin-venues.component').then(m => m.AdminVenuesComponent) },
      { path: 'vendors', loadComponent: () => import('./features/admin/vendors/admin-vendors.component').then(m => m.AdminVendorsComponent) },
      { path: 'payments', loadComponent: () => import('./features/admin/payments/admin-payments.component').then(m => m.AdminPaymentsComponent) },
      { path: 'gallery', loadComponent: () => import('./features/admin/gallery/admin-gallery.component').then(m => m.AdminGalleryComponent) },
      { path: 'blog', loadComponent: () => import('./features/admin/blog/admin-blog.component').then(m => m.AdminBlogComponent) },
      { path: 'testimonials', loadComponent: () => import('./features/admin/testimonials/admin-testimonials.component').then(m => m.AdminTestimonialsComponent) },
      { path: 'reports', loadComponent: () => import('./features/admin/reports/admin-reports.component').then(m => m.AdminReportsComponent) },
      { path: 'crm', loadComponent: () => import('./features/admin/crm/admin-crm.component').then(m => m.AdminCrmComponent) },
      { path: 'settings', loadComponent: () => import('./features/admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent) },
    ],
  },

  // ── Booking Flow ──────────────────────────────────────────────────────────────
  {
    path: 'book',
    canActivate: [authGuard],
    loadComponent: () => import('./features/booking-flow/booking-flow.component').then(m => m.BookingFlowComponent),
  },

  // ── Vendor Setup ──────────────────────────────────────────────────────────────
  {
    path: 'vendor-setup',
    canActivate: [authGuard],
    loadComponent: () => import('./features/vendor-setup/vendor-setup.component').then(m => m.VendorSetupComponent),
  },

  // ── 404 ───────────────────────────────────────────────────────────────────────
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) },
];
