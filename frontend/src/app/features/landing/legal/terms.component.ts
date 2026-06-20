import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="pt-32 pb-12" style="background:linear-gradient(135deg,#8B1538,#2B2B2B);">
      <div class="container mx-auto px-4 text-center">
        <h1 class="font-display text-5xl font-bold text-white mb-4">Terms of Service</h1>
        <p class="text-white/60">Last updated: January 1, 2025</p>
      </div>
    </section>
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4 max-w-3xl">
        <div class="prose prose-gray max-w-none [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-dark [&>h2]:mt-8 [&>h2]:mb-4 [&>p]:text-gray-600 [&>p]:leading-relaxed [&>p]:mb-4">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using PrideHub, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>

          <h2>2. Use of Service</h2>
          <p>PrideHub grants you a limited, non-exclusive, non-transferable, revocable license to access and use our platform for personal and commercial event planning purposes.</p>

          <h2>3. Bookings and Payments</h2>
          <p>All bookings made through PrideHub are subject to our cancellation and refund policy. Deposits are required for all confirmed bookings and are non-refundable within 14 days of the event date.</p>

          <h2>4. Vendor Responsibilities</h2>
          <p>Vendors listed on PrideHub are independent contractors. PrideHub acts as an intermediary and is not responsible for the quality, safety, or legality of vendor services.</p>

          <h2>5. Intellectual Property</h2>
          <p>All content, trademarks, and data on PrideHub, including but not limited to software, databases, text, graphics, icons, and hyperlinks are the property of or licensed to PrideHub.</p>

          <h2>6. Limitation of Liability</h2>
          <p>PrideHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>

          <h2>7. Contact</h2>
          <p>Questions about the Terms of Service should be sent to legal@pridehub.com.</p>
        </div>
      </div>
    </section>
  `,
})
export class TermsComponent {}
