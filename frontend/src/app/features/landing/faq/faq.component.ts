import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Faq } from '../../../core/models/content.model';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="pt-32 pb-16" style="background:linear-gradient(135deg,#8B1538,#2B2B2B);">
      <div class="container mx-auto px-4 text-center">
        <h1 class="font-display text-5xl font-bold text-white mb-4">Frequently Asked Questions</h1>
        <p class="text-white/70 text-lg">Everything you need to know about PrideHub</p>
      </div>
    </section>

    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        @for (cat of groupedFaqs() | keyvalue; track cat.key) {
          <div class="mb-10">
            <h2 class="font-semibold text-primary text-sm uppercase tracking-widest mb-4">{{ cat.key }}</h2>
            <div class="space-y-3">
              @for (faq of cat.value; track faq.id) {
                <div class="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <button (click)="toggle(faq.id)"
                          class="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                    <span class="font-medium text-dark text-sm pr-4">{{ faq.question }}</span>
                    <span class="material-icons text-primary transition-transform shrink-0"
                          [class.rotate-180]="open() === faq.id">expand_more</span>
                  </button>
                  @if (open() === faq.id) {
                    <div class="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50">
                      {{ faq.answer }}
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <div class="mt-12 p-8 rounded-2xl bg-primary/5 text-center">
          <h3 class="font-semibold text-dark text-lg mb-2">Still have questions?</h3>
          <p class="text-gray-500 text-sm mb-4">Our team is ready to help you.</p>
          <a routerLink="/contact" class="btn-primary inline-flex items-center gap-2 text-sm">
            <span class="material-icons text-sm">chat</span> Contact Us
          </a>
        </div>
      </div>
    </section>
  `,
})
export class FaqComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly faqs = signal<Faq[]>([]);
  readonly open = signal('');
  readonly groupedFaqs = signal<Record<string, Faq[]>>({});

  ngOnInit() {
    this.api.get<Faq[]>('faqs').subscribe({
      next: (data) => {
        this.faqs.set(data);
        const grouped: Record<string, Faq[]> = {};
        data.forEach(f => {
          const cat = f.category || 'General';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(f);
        });
        this.groupedFaqs.set(grouped);
      },
    });
  }

  toggle(id: string) {
    this.open.set(this.open() === id ? '' : id);
  }
}
