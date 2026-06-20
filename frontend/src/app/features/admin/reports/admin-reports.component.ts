import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1 class="font-display text-2xl font-bold text-dark dark:text-white mb-6">Reports & Analytics</h1>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Revenue -->
        <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
          <h2 class="font-semibold text-dark dark:text-white mb-4 flex items-center gap-2">
            <span class="material-icons text-primary">payments</span> Revenue Report
          </h2>
          @if (revenue()) {
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Total Revenue</span>
                <span class="font-bold text-primary">{{ revenue().total | number }} ETB</span>
              </div>
              @for (m of revenue().byMonth || []; track m.month) {
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-400 w-16">{{ m.month }}</span>
                  <div class="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                    <div class="h-full rounded-full bg-primary" [style.width]="getRevPct(m.revenue) + '%'"></div>
                  </div>
                  <span class="text-xs font-medium text-dark dark:text-white w-20 text-right">{{ m.revenue | number }} ETB</span>
                </div>
              }
            </div>
          } @else {
            <div class="skeleton h-32 rounded-xl"></div>
          }
        </div>

        <!-- Bookings by status -->
        <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm">
          <h2 class="font-semibold text-dark dark:text-white mb-4 flex items-center gap-2">
            <span class="material-icons text-primary">event_note</span> Bookings Report
          </h2>
          @if (bookings()) {
            <div class="space-y-2">
              <p class="text-sm text-gray-500">Total Bookings: <span class="font-bold text-dark dark:text-white">{{ bookings().total }}</span></p>
              @for (s of bookings().byStatus || []; track s.status) {
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-400 w-28 truncate">{{ s.status }}</span>
                  <div class="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                    <div class="h-full rounded-full bg-secondary"
                         [style.width]="bookings().total ? ((s._count || s.count || 0) / bookings().total * 100) + '%' : '0%'"></div>
                  </div>
                  <span class="text-xs font-medium text-dark dark:text-white w-8 text-right">{{ s._count || s.count || 0 }}</span>
                </div>
              }
            </div>
          } @else {
            <div class="skeleton h-32 rounded-xl"></div>
          }
        </div>

        <!-- Vendor Performance -->
        <div class="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm lg:col-span-2">
          <h2 class="font-semibold text-dark dark:text-white mb-4 flex items-center gap-2">
            <span class="material-icons text-primary">store</span> Top Vendors
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-gray-400 uppercase tracking-wider">
                  <th class="text-left py-2 font-medium">Vendor</th>
                  <th class="text-left py-2 font-medium">Category</th>
                  <th class="text-left py-2 font-medium">Rating</th>
                  <th class="text-left py-2 font-medium">Reviews</th>
                  <th class="text-left py-2 font-medium">Bookings</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-white/5">
                @for (v of vendors(); track v.id) {
                  <tr>
                    <td class="py-2 font-medium text-dark dark:text-white">{{ v.businessName }}</td>
                    <td class="py-2 text-gray-500">{{ v.category?.name }}</td>
                    <td class="py-2">
                      <span class="flex items-center gap-1 text-secondary text-xs font-bold">
                        <span class="material-icons text-xs">star</span> {{ v.averageRating }}
                      </span>
                    </td>
                    <td class="py-2 text-gray-500">{{ v.totalReviews }}</td>
                    <td class="py-2 text-gray-500">{{ v.totalBookings }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminReportsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly revenue = signal<any>(null);
  readonly bookings = signal<any>(null);
  readonly vendors = signal<any[]>([]);

  ngOnInit(): void {
    const start = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const end = new Date().toISOString();
    this.api.get<any>(`reports/revenue?start=${start}&end=${end}`).subscribe({ next: d => this.revenue.set(d) });
    this.api.get<any>(`reports/bookings?start=${start}&end=${end}`).subscribe({ next: d => this.bookings.set(d) });
    this.api.get<any[]>('reports/vendor-performance').subscribe({ next: d => this.vendors.set(d) });
  }

  getRevPct(val: number): number {
    const max = Math.max(...(this.revenue()?.byMonth || []).map((m: any) => Number(m.revenue) || 0), 1);
    return Math.max(4, (Number(val) / max) * 100);
  }
}
