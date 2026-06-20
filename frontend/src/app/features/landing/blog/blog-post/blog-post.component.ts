import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { BlogPost } from '../../../../core/models/content.model';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  template: `
    @if (loading()) {
      <div class="min-h-screen flex items-center justify-center pt-20">
        <span class="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
      </div>
    } @else if (post()) {
      <!-- Hero -->
      <div class="relative h-80 md:h-[420px] bg-gradient-to-br from-primary/20 to-secondary/10 overflow-hidden pt-20">
        @if (post()!.coverImage) {
          <img [src]="post()!.coverImage" [alt]="post()!.title" class="w-full h-full object-cover">
        }
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-8">
          <div class="container mx-auto px-4 max-w-4xl">
            <nav class="text-white/60 text-sm mb-3 flex items-center gap-2">
              <a routerLink="/" class="hover:text-white">Home</a>
              <span>›</span>
              <a routerLink="/blog" class="hover:text-white">Blog</a>
              <span>›</span>
              <span class="text-white/80 truncate max-w-48">{{ post()!.title }}</span>
            </nav>
            @if (post()!.category) {
              <span class="inline-block px-3 py-1 rounded-full bg-secondary/80 text-dark text-xs font-bold mb-3">
                {{ post()!.category!.name }}
              </span>
            }
            <h1 class="font-display text-3xl md:text-4xl font-bold text-white leading-tight">{{ post()!.title }}</h1>
          </div>
        </div>
      </div>

      <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Article -->
          <article class="lg:col-span-3">
            <!-- Meta -->
            <div class="flex flex-wrap items-center gap-4 mb-8 text-sm text-gray-500 pb-6 border-b border-gray-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {{ post()!.author?.fullName?.[0] || 'P' }}
                </div>
                <span>{{ post()!.author?.fullName }}</span>
              </div>
              <span class="flex items-center gap-1">
                <span class="material-icons text-base">calendar_today</span>
                {{ post()!.publishedAt | date:'MMMM d, yyyy' }}
              </span>
              <span class="flex items-center gap-1">
                <span class="material-icons text-base">schedule</span>
                {{ post()!.readTime }} min read
              </span>
              <span class="flex items-center gap-1">
                <span class="material-icons text-base">visibility</span>
                {{ post()!.views }} views
              </span>
            </div>

            <!-- Content -->
            <div class="prose prose-lg max-w-none text-gray-700 leading-relaxed
                        [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-dark [&>h2]:mt-8 [&>h2]:mb-4
                        [&>h3]:font-semibold [&>h3]:text-xl [&>h3]:text-dark [&>h3]:mt-6 [&>h3]:mb-3
                        [&>p]:mb-4 [&>ul]:mb-4 [&>ul]:pl-5 [&>ul>li]:mb-1 [&>ul>li]:list-disc"
                 [innerHTML]="post()!.content">
            </div>

            <!-- Tags -->
            @if (post()!.tags && post()!.tags!.length > 0) {
              <div class="mt-8 pt-6 border-t border-gray-100">
                <p class="text-xs text-gray-400 uppercase tracking-wider mb-3">Tags</p>
                <div class="flex flex-wrap gap-2">
                  @for (tag of post()!.tags!; track tag.tag.id) {
                    <span class="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer">
                      #{{ tag.tag.name }}
                    </span>
                  }
                </div>
              </div>
            }

            <!-- Share -->
            <div class="mt-8 p-5 rounded-2xl bg-gray-50 flex items-center justify-between flex-wrap gap-4">
              <p class="font-semibold text-dark text-sm">Share this article</p>
              <div class="flex gap-3">
                @for (share of shareLinks; track share.label) {
                  <a [href]="share.url" target="_blank" rel="noopener"
                     class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors text-white text-sm"
                     [style.background]="share.color">
                    <span class="material-icons text-sm">share</span>
                  </a>
                }
              </div>
            </div>

            <!-- Comments -->
            <div class="mt-12">
              <h2 class="font-display text-2xl font-bold text-dark mb-6">
                Comments ({{ post()!.comments?.length || 0 }})
              </h2>

              @for (comment of post()!.comments || []; track comment.id) {
                <div class="flex gap-3 mb-5 pb-5 border-b border-gray-50">
                  <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {{ comment.authorName[0] }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-semibold text-dark text-sm">{{ comment.authorName }}</span>
                      <span class="text-gray-400 text-xs">{{ comment.createdAt | date:'MMM d, y' }}</span>
                    </div>
                    <p class="text-gray-600 text-sm leading-relaxed">{{ comment.content }}</p>
                  </div>
                </div>
              }

              <!-- Add Comment -->
              <div class="bg-gray-50 rounded-2xl p-6 mt-6">
                <h3 class="font-semibold text-dark mb-4">Leave a Comment</h3>
                @if (commentSubmitted()) {
                  <div class="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
                    <span class="material-icons text-green-500 block mb-1">check_circle</span>
                    <p class="text-green-800 text-sm">Comment submitted! It will appear after approval.</p>
                  </div>
                } @else {
                  <form [formGroup]="commentForm" (ngSubmit)="submitComment()" class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                      <input type="text" formControlName="authorName" placeholder="Your name"
                             class="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm transition-colors">
                      <input type="email" formControlName="authorEmail" placeholder="Email (not published)"
                             class="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm transition-colors">
                    </div>
                    <textarea formControlName="content" rows="3" placeholder="Share your thoughts..."
                              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-sm resize-none transition-colors"></textarea>
                    <button type="submit" [disabled]="commentForm.invalid || commentSubmitting()"
                            class="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-900 disabled:opacity-50 transition-colors flex items-center gap-2">
                      @if (commentSubmitting()) {
                        <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      }
                      Post Comment
                    </button>
                  </form>
                }
              </div>
            </div>
          </article>

          <!-- Sidebar -->
          <aside class="lg:col-span-1">
            <div class="sticky top-24 space-y-6">
              <!-- Newsletter CTA -->
              <div class="bg-gradient-to-br from-primary to-primary-900 rounded-2xl p-5 text-white">
                <span class="material-icons text-secondary text-3xl block mb-2">mail</span>
                <h3 class="font-semibold mb-2 text-sm">Get Event Tips</h3>
                <p class="text-white/60 text-xs mb-3">Subscribe for weekly event planning insights.</p>
                <input type="email" [(ngModel)]="newsletterEmail" placeholder="Your email"
                       class="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs placeholder-white/40 focus:outline-none focus:border-secondary mb-2">
                <button class="w-full py-2 rounded-lg bg-secondary text-dark text-xs font-semibold hover:bg-secondary/90 transition-colors"
                        (click)="subscribeNewsletter()">
                  Subscribe
                </button>
              </div>

              <!-- Plan Event CTA -->
              <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                <span class="material-icons text-4xl text-primary block mb-2">celebration</span>
                <h3 class="font-semibold text-dark text-sm mb-1">Plan Your Event</h3>
                <p class="text-gray-400 text-xs mb-4">Let us create your perfect celebration</p>
                <a routerLink="/book" class="block py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-900 transition-colors">
                  Get Started
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    }
  `,
})
export class BlogPostComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly post = signal<BlogPost | null>(null);
  readonly loading = signal(true);
  readonly commentSubmitted = signal(false);
  readonly commentSubmitting = signal(false);
  newsletterEmail = '';

  commentForm = this.fb.group({
    authorName:  ['', Validators.required],
    authorEmail: ['', [Validators.required, Validators.email]],
    content:     ['', [Validators.required, Validators.minLength(10)]],
  });

  shareLinks = [
    { label: 'Facebook', color: '#1877F2', url: '#' },
    { label: 'Twitter', color: '#1DA1F2', url: '#' },
    { label: 'WhatsApp', color: '#25D366', url: '#' },
  ];

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.get<BlogPost>(`blog/${slug}`).subscribe({
      next: (p) => { this.post.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  submitComment(): void {
    if (this.commentForm.invalid) return;
    this.commentSubmitting.set(true);
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.post(`blog/${slug}/comments`, this.commentForm.value).subscribe({
      next: () => { this.commentSubmitting.set(false); this.commentSubmitted.set(true); },
      error: () => { this.commentSubmitting.set(false); this.commentSubmitted.set(true); },
    });
  }

  subscribeNewsletter(): void {
    if (this.newsletterEmail) {
      this.api.post('newsletter/subscribe', { email: this.newsletterEmail }).subscribe();
    }
  }
}
