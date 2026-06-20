import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="pt-32 pb-16" style="background:linear-gradient(135deg,#8B1538,#2B2B2B);">
      <div class="container mx-auto px-4 text-center">
        <span class="text-secondary text-sm font-semibold uppercase tracking-widest block mb-3">Our Work</span>
        <h1 class="font-display text-5xl font-bold text-white mb-4">Portfolio</h1>
        <p class="text-white/70 text-lg">A showcase of events we've planned and executed to perfection</p>
      </div>
    </section>

    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Filter row -->
        <div class="flex flex-wrap gap-3 mb-10 justify-center">
          @for (filter of filters; track filter) {
            <button (click)="activeFilter.set(filter)"
                    class="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                    [class]="activeFilter() === filter ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
              {{ filter }}
            </button>
          }
        </div>

        <!-- Masonry-style grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (item of portfolioItems; track item.title) {
            <div class="group rounded-2xl overflow-hidden shadow-sm hover:shadow-luxury border border-gray-100 transition-all duration-300 hover:-translate-y-1">
              <div class="relative overflow-hidden" [style.height]="item.tall ? '400px' : '260px'">
                <div class="w-full h-full bg-gradient-to-br from-primary/{{ item.shade }} to-secondary/10 flex items-center justify-center">
                  <span class="material-icons text-8xl text-gray-200">{{ item.icon }}</span>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
                  <div>
                    <span class="px-2.5 py-1 rounded-full bg-secondary text-dark text-xs font-bold mb-2 inline-block">{{ item.category }}</span>
                    <h3 class="text-white font-semibold text-lg">{{ item.title }}</h3>
                    <p class="text-white/70 text-sm">{{ item.client }} · {{ item.year }}</p>
                  </div>
                </div>
              </div>
              <div class="p-4 bg-white">
                <h3 class="font-semibold text-dark">{{ item.title }}</h3>
                <div class="flex items-center justify-between mt-1">
                  <span class="text-xs text-gray-400">{{ item.category }} · {{ item.venue }}</span>
                  <span class="flex items-center gap-1 text-xs text-secondary">
                    <span class="material-icons text-xs">people</span>{{ item.guests }} guests
                  </span>
                </div>
              </div>
            </div>
          }
        </div>

        <div class="text-center mt-10">
          <a routerLink="/book" class="btn-primary inline-flex items-center gap-2">
            <span class="material-icons">add</span> Plan Your Event
          </a>
        </div>
      </div>
    </section>
  `,
})
export class PortfolioComponent {
  readonly activeFilter = signal('All');

  filters = ['All', 'Wedding', 'Corporate', 'Birthday', 'Graduation', 'Engagement'];

  portfolioItems = [
    { title: 'Royal Wedding Ceremony', category: 'Wedding', client: 'Dawit & Sara', year: '2024', venue: 'Grand Millennium', guests: 450, icon: 'diamond', shade: '20', tall: true },
    { title: 'TechCorp Annual Gala', category: 'Corporate', client: 'TechCorp Ethiopia', year: '2024', venue: 'Skyline Rooftop', guests: 200, icon: 'business', shade: '10', tall: false },
    { title: 'Elegant Birthday Bash', category: 'Birthday', client: 'Eden F.', year: '2024', venue: 'Garden of Eden', guests: 80, icon: 'cake', shade: '15', tall: false },
    { title: 'Traditional Habesha Wedding', category: 'Wedding', client: 'Abel & Hana', year: '2024', venue: 'Heritage Hall', guests: 600, icon: 'celebration', shade: '20', tall: true },
    { title: 'AAU Graduation Ceremony', category: 'Graduation', client: 'AAU Class 2024', year: '2024', venue: 'Unity Park', guests: 1000, icon: 'school', shade: '10', tall: false },
    { title: 'Romantic Engagement Night', category: 'Engagement', client: 'Biruk & Liya', year: '2024', venue: 'Lakeside Venue', guests: 120, icon: 'favorite', shade: '15', tall: false },
  ];
}
