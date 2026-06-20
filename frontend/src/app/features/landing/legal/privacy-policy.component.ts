import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="pt-32 pb-12" style="background:linear-gradient(135deg,#8B1538,#2B2B2B);">
      <div class="container mx-auto px-4 text-center">
        <h1 class="font-display text-5xl font-bold text-white mb-4">Privacy Policy</h1>
        <p class="text-white/60">Last updated: January 1, 2025</p>
      </div>
    </section>
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4 max-w-3xl">
        <div class="prose prose-gray max-w-none [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-dark [&>h2]:mt-8 [&>h2]:mb-4 [&>p]:text-gray-600 [&>p]:leading-relaxed [&>p]:mb-4 [&>ul]:text-gray-600 [&>ul]:pl-5 [&>ul>li]:mb-2 [&>ul>li]:list-disc">
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, make a booking, or contact us. This includes your name, email address, phone number, and payment information.</p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.</p>

          <h2>3. Information Sharing</h2>
          <p>We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information with our business partners and trusted affiliates.</p>

          <h2>4. Data Security</h2>
          <p>We implement appropriate technical and organizational security measures to protect your personal information against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access.</p>

          <h2>5. Cookies</h2>
          <p>We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>

          <h2>6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@pridehub.com or visit our <a routerLink="/contact" class="text-primary hover:underline">Contact page</a>.</p>
        </div>
      </div>
    </section>
  `,
})
export class PrivacyPolicyComponent {}
