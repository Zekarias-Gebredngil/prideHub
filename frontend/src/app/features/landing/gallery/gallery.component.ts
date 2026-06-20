import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { GalleryAlbum, Media } from '../../../core/models/content.model';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="pt-32 pb-16" style="background:linear-gradient(135deg,#8B1538,#2B2B2B);">
      <div class="container mx-auto px-4 text-center">
        <span class="text-secondary text-sm font-semibold uppercase tracking-widest block mb-3">Memories Made Here</span>
        <h1 class="font-display text-5xl font-bold text-white mb-4">Our Gallery</h1>
        <p class="text-white/70 text-lg">Beautiful moments captured from events we've proudly planned</p>
      </div>
    </section>

    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Category Filters -->
        <div class="flex flex-wrap gap-3 mb-10 justify-center">
          <button (click)="selectedCategory.set('')"
                  class="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  [class]="!selectedCategory() ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
            All Events
          </button>
          @for (cat of categories; track cat) {
            <button (click)="selectedCategory.set(cat)"
                    class="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                    [class]="selectedCategory() === cat ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
              {{ cat }}
            </button>
          }
        </div>

        @if (loading()) {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="skeleton aspect-square rounded-2xl"></div>
            }
          </div>
        } @else {
          <!-- Albums Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            @for (album of filteredAlbums(); track album.id) {
              <div class="group cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-luxury transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                   (click)="openAlbum(album)">
                <div class="relative h-56 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                  @if (album.coverImage) {
                    <img [src]="api.baseUrl.replace('/api/v1', '') + album.coverImage" [alt]="album.title"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                  } @else if (album.media && album.media[0]) {
                    <img [src]="album.media[0].url" [alt]="album.title"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <span class="material-icons text-6xl text-gray-200">photo_library</span>
                    </div>
                  }
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="absolute bottom-4 left-4 right-4">
                      <button class="w-full py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/30 flex items-center justify-center gap-2">
                        <span class="material-icons text-base">photo_library</span>
                        View Album
                      </button>
                    </div>
                  </div>
                  <!-- Photo count badge -->
                  <div class="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
                    <span class="material-icons text-xs">photo</span>
                    {{ album._count?.media || 0 }}
                  </div>
                </div>
                <div class="p-4 bg-white">
                  <h3 class="font-semibold text-dark group-hover:text-primary transition-colors">{{ album.title }}</h3>
                  @if (album.category) {
                    <span class="inline-block px-2 py-0.5 rounded-full bg-primary/5 text-primary text-xs font-medium mt-1">
                      {{ album.category }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>

          @if (filteredAlbums().length === 0) {
            <div class="text-center py-16">
              <span class="material-icons text-5xl text-gray-200 block mb-3">photo_library</span>
              <p class="text-gray-400">No albums in this category yet.</p>
            </div>
          }
        }
      </div>
    </section>

    <!-- Lightbox -->
    @if (lightboxOpen() && activeAlbum()) {
      <div class="fixed inset-0 z-50 bg-black/95 flex flex-col"
           (click)="closeLightbox()">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10" (click)="$event.stopPropagation()">
          <div>
            <h3 class="text-white font-semibold">{{ activeAlbum()!.title }}</h3>
            <p class="text-white/50 text-sm">{{ albumMedia().length }} photos</p>
          </div>
          <button (click)="closeLightbox()" class="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <span class="material-icons">close</span>
          </button>
        </div>

        <!-- Media Grid -->
        <div class="flex-1 overflow-y-auto p-4" (click)="$event.stopPropagation()">
          @if (albumLoading()) {
            <div class="flex items-center justify-center h-full">
              <span class="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></span>
            </div>
          } @else {
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              @for (media of albumMedia(); track media.id) {
                <div class="aspect-square rounded-xl overflow-hidden cursor-pointer group"
                     (click)="openMedia(media)">
                  <img [src]="media.thumbUrl || media.url" [alt]="media.title || 'Gallery'"
                       class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                </div>
              }
            </div>
          }
        </div>
      </div>
    }

    <!-- Single Image Viewer -->
    @if (activeMedia()) {
      <div class="fixed inset-0 z-[60] bg-black/98 flex items-center justify-center"
           (click)="activeMedia.set(null)">
        <button class="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
          <span class="material-icons">close</span>
        </button>
        <img [src]="activeMedia()!.url" [alt]="activeMedia()!.title || 'Image'"
             class="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
             (click)="$event.stopPropagation()">
      </div>
    }
  `,
})
export class GalleryComponent implements OnInit {
  readonly api = inject(ApiService);

  readonly albums = signal<GalleryAlbum[]>([]);
  readonly loading = signal(true);
  readonly lightboxOpen = signal(false);
  readonly albumLoading = signal(false);
  readonly activeAlbum = signal<GalleryAlbum | null>(null);
  readonly albumMedia = signal<Media[]>([]);
  readonly activeMedia = signal<Media | null>(null);
  readonly selectedCategory = signal('');

  categories = ['Wedding', 'Birthday', 'Corporate', 'Graduation', 'Engagement'];

  readonly filteredAlbums = () => {
    const cat = this.selectedCategory();
    if (!cat) return this.albums();
    return this.albums().filter(a => a.category === cat);
  };

  ngOnInit(): void {
    this.api.getPaginated<GalleryAlbum>('gallery/albums', { limit: 20 }).subscribe({
      next: (res) => { this.albums.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openAlbum(album: GalleryAlbum): void {
    this.activeAlbum.set(album);
    this.lightboxOpen.set(true);
    this.albumLoading.set(true);
    this.api.getPaginated<Media>(`gallery/albums/${album.id}/media`, { limit: 60 }).subscribe({
      next: (res) => { this.albumMedia.set(res.data); this.albumLoading.set(false); },
      error: () => this.albumLoading.set(false),
    });
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
    this.activeAlbum.set(null);
    this.albumMedia.set([]);
  }

  openMedia(media: Media): void {
    this.activeMedia.set(media);
  }
}
