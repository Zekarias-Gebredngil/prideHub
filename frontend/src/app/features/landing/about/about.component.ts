import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Hero -->
    <section class="pt-32 pb-20" style="background:linear-gradient(135deg,#8B1538 0%,#2B2B2B 100%);">
      <div class="container mx-auto px-4 text-center">
        <span class="text-secondary text-sm font-semibold uppercase tracking-widest block mb-3">Our Story</span>
        <h1 class="font-display text-5xl md:text-6xl font-bold text-white mb-6">About PrideHub</h1>
        <p class="text-white/70 text-xl max-w-2xl mx-auto">
          Born from a passion for creating unforgettable celebrations, PrideHub has become Ethiopia's most trusted event management platform.
        </p>
      </div>
    </section>

    <!-- Story -->
    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span class="text-secondary text-sm font-semibold uppercase tracking-widest block mb-3">Our Journey</span>
            <h2 class="font-display text-4xl font-bold text-dark mb-6">Building Ethiopia's Premier Event Platform</h2>
            <p class="text-gray-500 leading-relaxed mb-4">
              Founded in 2020, PrideHub started with a simple vision: to make professional event planning accessible to every Ethiopian family and business. We saw the challenges people faced — unreliable vendors, scattered bookings, and lack of transparency.
            </p>
            <p class="text-gray-500 leading-relaxed mb-6">
              Today, we've helped over 500 clients create extraordinary celebrations — from intimate family gatherings to grand corporate events — with our network of 100+ verified vendors and 50+ premium venues across Ethiopia.
            </p>
            <div class="grid grid-cols-3 gap-4">
              @for (stat of stats; track stat.label) {
                <div class="text-center p-4 rounded-2xl bg-gray-50">
                  <p class="font-display font-bold text-3xl text-primary">{{ stat.value }}</p>
                  <p class="text-gray-500 text-xs mt-1">{{ stat.label }}</p>
                </div>
              }
            </div>
          </div>
          <div class="relative">
            <div class="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <span class="material-icons text-9xl text-primary/20">celebration</span>
            </div>
            <div class="absolute -bottom-6 -left-6 w-40 h-40 rounded-2xl bg-secondary/20 -z-10"></div>
            <div class="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-primary/10 -z-10"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Vision & Mission -->
    <section class="section" style="background:#F8F5F2;">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          @for (card of visionCards; track card.title) {
            <div class="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <span class="material-icons text-primary text-2xl">{{ card.icon }}</span>
              </div>
              <h3 class="font-display font-bold text-xl text-dark mb-3">{{ card.title }}</h3>
              <p class="text-gray-500 text-sm leading-relaxed">{{ card.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Core Values -->
    <section class="section bg-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="font-display text-4xl font-bold text-dark mb-4">Our Core Values</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          @for (v of values; track v.title) {
            <div class="text-center p-6 rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all">
              <span class="material-icons text-4xl text-secondary mb-3 block">{{ v.icon }}</span>
              <h4 class="font-semibold text-dark mb-2">{{ v.title }}</h4>
              <p class="text-gray-500 text-xs">{{ v.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Team -->
    <section class="section" style="background:#F8F5F2;">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <span class="text-secondary text-sm font-semibold uppercase tracking-widest block mb-3">The People Behind PrideHub</span>
          <h2 class="font-display text-4xl font-bold text-dark">Our Team</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          @for (member of team; track member.name) {
            <div class="bg-white rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
              <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span class="font-display font-bold text-2xl text-primary">{{ member.name[0] }}</span>
              </div>
              <h4 class="font-semibold text-dark text-sm">{{ member.name }}</h4>
              <p class="text-gray-400 text-xs mt-0.5">{{ member.title }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 bg-primary text-white text-center">
      <div class="container mx-auto px-4">
        <h2 class="font-display text-4xl font-bold mb-4">Ready to Work With Us?</h2>
        <p class="text-white/70 text-lg mb-8">Let's create something extraordinary together.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/book" class="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-secondary text-dark font-bold hover:bg-secondary/90 transition-all">
            <span class="material-icons">celebration</span> Plan Your Event
          </a>
          <a routerLink="/contact" class="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/30 font-semibold hover:bg-white/10 transition-all">
            <span class="material-icons">chat</span> Contact Us
          </a>
        </div>
      </div>
    </section>
  `,
})
export class AboutComponent {
  stats = [
    { value: '500+', label: 'Events Planned' },
    { value: '4.9★', label: 'Average Rating' },
    { value: '5+', label: 'Years of Excellence' },
  ];

  visionCards = [
    { icon: 'visibility', title: 'Our Vision', text: 'To become the leading event management platform across East Africa, empowering communities to celebrate life\'s most precious moments.' },
    { icon: 'flag', title: 'Our Mission', text: 'To connect clients with trusted vendors and venues, delivering seamless, memorable events through technology and passion.' },
    { icon: 'stars', title: 'Our Promise', text: 'Excellence in every detail. We treat every event as if it were our own celebration, bringing dedication and creativity to every project.' },
  ];

  values = [
    { icon: 'verified', title: 'Integrity', desc: 'Transparent pricing and honest communication' },
    { icon: 'favorite', title: 'Passion', desc: 'We love what we do and it shows' },
    { icon: 'diversity_3', title: 'Inclusion', desc: 'Celebrating every culture and tradition' },
    { icon: 'auto_awesome', title: 'Excellence', desc: 'Premium quality in everything we deliver' },
    { icon: 'psychology', title: 'Innovation', desc: 'Constantly improving with technology' },
    { icon: 'handshake', title: 'Partnership', desc: 'Your success is our success' },
    { icon: 'eco', title: 'Sustainability', desc: 'Mindful of our environmental impact' },
    { icon: 'speed', title: 'Reliability', desc: 'On-time, every time, no excuses' },
  ];

  team = [
    { name: 'Dawit Haile', title: 'CEO & Co-founder' },
    { name: 'Liya Tadesse', title: 'Head of Operations' },
    { name: 'Samuel Bekele', title: 'Lead Event Planner' },
    { name: 'Rahel Girma', title: 'Head of Marketing' },
    { name: 'Abel Tesfaye', title: 'Tech Lead' },
    { name: 'Hana Alemu', title: 'Creative Director' },
    { name: 'Biruk Kebede', title: 'Vendor Relations' },
    { name: 'Eden Mekonnen', title: 'Client Success' },
  ];
}
