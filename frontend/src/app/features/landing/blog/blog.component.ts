import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { BlogPost } from '../../../core/models/content.model';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SkeletonLoaderComponent],
  template: `
    <section class="pt-32 pb-16" style="background:linear-gradient(135deg,#8B1538,#2B2B2B);">
      <div class="container mx-auto px-4 text-center">
        <span class="text-secondary text-sm font-semibold uppercase tracking-widest block mb-3">Insights & Tips</span>
        <h1 class="font-display text-5xl font-bold text-white mb-4">Our Blog</h1>
        <p class="text-white/70 text-lg">Expert advice, event inspiration, and industry trends</p>
      </div>
    </section>

    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap gap-3 mb-8 items-center">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-base">search</span>
            <input [(ngModel)]="search" (ngModelChange)="load()" type="text" placeholder="Search articles..."
                   class="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm w-64">
          </div>
          @for (cat of categories(); track cat.id) {
            <button (click)="selectedCat.set(cat.id); load()"
                    class="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    [class]="selectedCat() === cat.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
              {{ cat.name }}
            </button>
          }
          @if (selectedCat()) {
            <button (click)="selectedCat.set(''); load()" class="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-sm hover:bg-gray-200 flex items-center gap-1">
              <span class="material-icons text-sm">close</span> Clear
            </button>
          }
        </div>

        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (i of [1,2,3,4,5,6]; track i) { <app-skeleton-loader type="card" /> }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (post of posts(); track post.id) {
              <a [routerLink]="['/blog', post.slug]"
                 class="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-luxury border border-gray-100 transition-all duration-300 hover:-translate-y-1">
                <div class="h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                  @if (post.coverImage) {
                    <img [src]="post.coverImage" [alt]="post.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <span class="material-icons text-5xl text-gray-200">article</span>
                    </div>
                  }
                </div>
                <div class="p-5">
                  <div class="flex items-center gap-2 mb-3">
                    @if (post.category) {
                      <span class="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-xs font-medium">{{ post.category.name }}</span>
                    }
                    <span class="text-gray-400 text-xs">{{ post.readTime }} min read</span>
                    <span class="text-gray-300 text-xs">·</span>
                    <span class="flex items-center gap-0.5 text-gray-400 text-xs">
                      <span class="material-icons text-xs">visibility</span> {{ post.views }}
                    </span>
                  </div>
                  <h3 class="font-semibold text-dark text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">{{ post.title }}</h3>
                  <p class="text-gray-500 text-sm line-clamp-2 mb-4">{{ post.excerpt }}</p>
                  <div class="flex items-center gap-2 text-xs text-gray-400">
                    <span class="material-icons text-xs">person</span>
                    {{ post.author?.fullName }}
                    <span>·</span>
                    {{ post.publishedAt | date:'MMM d, y' }}
                  </div>
                </div>
              </a>
            }
          </div>
          @if (posts().length === 0) {
            <div class="text-center py-16">
              <span class="material-icons text-5xl text-gray-200 block mb-3">article</span>
              <p class="text-gray-400">No articles found.</p>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class BlogComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly posts = signal<BlogPost[]>([]);
  readonly categories = signal<any[]>([]);
  readonly loading = signal(true);
  readonly selectedCat = signal('');
  search = '';

  ngOnInit() {
    this.api.get<any[]>('blog/categories').subscribe({ next: (d) => this.categories.set(d) });
    this.load();
  }

  load() {
    this.loading.set(true);
    const params: any = { limit: 12 };
    if (this.selectedCat()) params['categoryId'] = this.selectedCat();
    if (this.search) params['search'] = this.search;
    this.api.getPaginated<BlogPost>('blog', params).subscribe({
      next: (res) => { this.posts.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
