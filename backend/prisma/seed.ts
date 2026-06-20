import { PrismaClient, UserRole, UserStatus, EventType, BookingStatus, PaymentMethod, PaymentStatus, BlogStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const firstNames = ['Abel', 'Blen', 'Chala', 'Dawit', 'Eden', 'Fikir', 'Girma', 'Hana', 'Iyasu', 'Jana',
  'Kedir', 'Liya', 'Meseret', 'Nardos', 'Olga', 'Pita', 'Rahel', 'Samuel', 'Tigist', 'Umer',
  'Vivian', 'Winta', 'Xara', 'Yemi', 'Zema', 'Aida', 'Biruk', 'Caleb', 'Desta', 'Eyob'];
const lastNames = ['Tadesse', 'Bekele', 'Alemu', 'Haile', 'Tesfaye', 'Girma', 'Kebede', 'Mekonnen',
  'Worku', 'Desta', 'Selassie', 'Mulugeta', 'Abebe', 'Tilahun', 'Gebre', 'Yohannes', 'Assefa',
  'Legesse', 'Demeke', 'Zewdie'];
const cities = ['Addis Ababa', 'Hawassa', 'Adama', 'Bahir Dar', 'Mekelle', 'Gondar', 'Dire Dawa'];

async function main() {
  console.log('🌱 Seeding PrideHub database...');

  // ── 1. Super Admin ─────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@pridehub.com' },
    update: {},
    create: {
      email: 'admin@pridehub.com',
      firstName: 'Super',
      lastName: 'Admin',
      fullName: 'Super Admin',
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    },
  });
  console.log('✅ Super admin created');

  // ── 2. Vendor Categories ───────────────────────────────────────────────────
  const vendorCategoryData = [
    { name: 'Photographer', slug: 'photographer', icon: '📷' },
    { name: 'Videographer', slug: 'videographer', icon: '🎥' },
    { name: 'DJ', slug: 'dj', icon: '🎧' },
    { name: 'Live Band', slug: 'live-band', icon: '🎸' },
    { name: 'Decorator', slug: 'decorator', icon: '🎨' },
    { name: 'Florist', slug: 'florist', icon: '💐' },
    { name: 'Caterer', slug: 'caterer', icon: '🍽️' },
    { name: 'Transport', slug: 'transport', icon: '🚗' },
    { name: 'Cake Designer', slug: 'cake-designer', icon: '🎂' },
    { name: 'Makeup Artist', slug: 'makeup-artist', icon: '💄' },
    { name: 'MC Services', slug: 'mc-services', icon: '🎤' },
    { name: 'Security', slug: 'security', icon: '🛡️' },
    { name: 'Equipment Rental', slug: 'equipment-rental', icon: '🔧' },
    { name: 'Cleaning', slug: 'cleaning', icon: '🧹' },
  ];

  const vendorCategories: any[] = [];
  for (const cat of vendorCategoryData) {
    const c = await prisma.vendorCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    vendorCategories.push(c);
  }
  console.log('✅ Vendor categories seeded');

  // ── 3. Service Categories ──────────────────────────────────────────────────
  const serviceCategoryData = [
    { name: 'Wedding', slug: 'wedding' },
    { name: 'Birthday', slug: 'birthday' },
    { name: 'Corporate', slug: 'corporate' },
    { name: 'Graduation', slug: 'graduation' },
    { name: 'Engagement', slug: 'engagement' },
    { name: 'Baby Shower', slug: 'baby-shower' },
    { name: 'Traditional', slug: 'traditional' },
    { name: 'Photography', slug: 'photography' },
    { name: 'Decoration', slug: 'decoration' },
    { name: 'Catering', slug: 'catering' },
  ];
  const serviceCategories: any[] = [];
  for (const cat of serviceCategoryData) {
    const c = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true },
    });
    serviceCategories.push(c);
  }
  console.log('✅ Service categories seeded');

  // ── 4. Services (100) ─────────────────────────────────────────────────────
  const serviceNames = [
    'Full Wedding Planning', 'Luxury Wedding Package', 'Birthday Party Setup',
    'Corporate Event Management', 'Graduation Ceremony', 'Engagement Party',
    'Baby Shower Planning', 'Traditional Wedding Coordination', 'Premium Photography',
    'Cinematic Videography', 'Professional DJ Services', 'Live Band Performance',
    'Balloon Decoration', 'Floral Arrangements', 'Wedding Catering',
    'Event Tent & Furniture Rental', 'Luxury Car Hire', 'Custom Cake Design',
    'Bridal Makeup & Hair', 'Professional MC', 'Stage & Lighting Setup',
    'Sound System Rental', 'Conference Room Setup', 'Kids Party Entertainment',
    'Outdoor Event Planning', 'Beach Party Setup', 'Rooftop Event Design',
    'Cultural Event Planning', 'VIP Lounge Setup', 'Full Event Cleanup',
  ];

  for (let i = 0; i < 100; i++) {
    const cat = randomItem(serviceCategories);
    const name = `${randomItem(serviceNames)} ${i + 1}`;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + i;
    await prisma.service.upsert({
      where: { slug },
      update: {},
      create: {
        categoryId: cat.id,
        name,
        slug,
        description: `Professional ${name} service tailored to your needs. We bring elegance, joy, and perfection to every occasion.`,
        shortDesc: `Premium ${name.split(' ').slice(0, 3).join(' ')} — crafted with love.`,
        price: randomInt(5000, 150000),
        priceUnit: 'per event',
        duration: `${randomInt(4, 12)} hours`,
        isFeatured: i < 8,
        isActive: true,
        sortOrder: i,
        seoTitle: name,
        seoDesc: `Book professional ${name} in Ethiopia.`,
      },
    });
  }
  console.log('✅ 100 services seeded');

  // ── 5. Packages ────────────────────────────────────────────────────────────
  const packageTiers = [
    { tier: 'Silver', price: 25000, color: '#C0C0C0', features: ['Basic decoration', 'Photography (4h)', 'Simple catering'] },
    { tier: 'Gold', price: 75000, color: '#D4AF37', features: ['Premium decoration', 'Photography & Video (8h)', 'Full catering', 'DJ services'] },
    { tier: 'Platinum', price: 150000, color: '#E5E4E2', features: ['Luxury decoration', 'Cinematic photography', 'Gourmet catering', 'Live band', 'MC services', 'Transport'] },
    { tier: 'Diamond', price: 300000, color: '#B9F2FF', features: ['Ultra-luxury decoration', '2-day photography', 'International catering', 'Live band + DJ', 'VIP transport', 'Full planning team', 'Custom cake'] },
  ];

  for (let i = 0; i < 50; i++) {
    const tierData = randomItem(packageTiers);
    const eventType = randomItem(['Wedding', 'Birthday', 'Corporate', 'Graduation']);
    const name = `${tierData.tier} ${eventType} Package ${i + 1}`;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + i;
    await prisma.package.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        tier: tierData.tier,
        description: `Our ${tierData.tier} ${eventType} package delivers an unforgettable experience.`,
        shortDesc: `${tierData.tier} tier — all-inclusive ${eventType.toLowerCase()} package.`,
        price: tierData.price + randomInt(-5000, 20000),
        discountPct: randomInt(0, 15),
        isFeatured: i < 8,
        isActive: true,
        maxGuests: randomInt(50, 500),
        duration: `${randomInt(6, 16)} hours`,
        color: tierData.color,
        sortOrder: i,
        items: {
          createMany: {
            data: tierData.features.map((desc, idx) => ({ description: desc, isIncluded: true, sortOrder: idx })),
          },
        },
        addOns: {
          createMany: {
            data: [
              { name: 'Extra Hours', price: 5000 },
              { name: 'Photo Album', price: 8000 },
              { name: 'Live Streaming', price: 15000 },
            ],
          },
        },
      },
    });
  }
  console.log('✅ 50 packages seeded');

  // ── 6. Venues (50) ────────────────────────────────────────────────────────
  const venueNames = [
    'Royal Palace Events', 'Skyline Rooftop', 'Garden of Eden Hall', 'Grand Millennium',
    'Azure Ballroom', 'Heritage Cultural Center', 'Sunrise Convention', 'The Golden Hall',
    'Lakeside Events', 'Mountain View Venue', 'Classic Banquet Hall', 'Emerald Gardens',
    'Summit Conference Center', 'Oasis Event Space', 'Crystal Hall',
  ];

  for (let i = 0; i < 50; i++) {
    const city = randomItem(cities);
    const name = `${randomItem(venueNames)} ${city} ${i + 1}`;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + i;
    await prisma.venue.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        description: `${name} is a premier event venue in ${city}, offering world-class facilities for any occasion.`,
        shortDesc: `Luxury event venue in ${city} for up to ${randomInt(100, 1000)} guests.`,
        address: `${randomInt(1, 999)} Main Street, ${city}`,
        city,
        country: 'Ethiopia',
        latitude: 9.0 + Math.random(),
        longitude: 38.7 + Math.random(),
        capacity: randomInt(100, 1000),
        minCapacity: randomInt(20, 80),
        pricePerDay: randomInt(15000, 200000),
        amenities: {
          parking: true,
          wifi: true,
          airConditioning: randomInt(0, 1) === 1,
          catering: randomInt(0, 1) === 1,
          audioVisual: true,
          security: true,
        },
        isFeatured: i < 6,
        isActive: true,
      },
    });
  }
  console.log('✅ 50 venues seeded');

  // ── 7. Users — Clients, Planners, Vendors (200) ───────────────────────────
  const password = await bcrypt.hash('User@123456', 12);
  const userIds: string[] = [];

  for (let i = 0; i < 200; i++) {
    const fn = randomItem(firstNames);
    const ln = randomItem(lastNames);
    const role = i < 10 ? UserRole.EVENT_PLANNER : i < 110 ? UserRole.CLIENT : UserRole.VENDOR;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`;
    try {
      const u = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          firstName: fn,
          lastName: ln,
          fullName: `${fn} ${ln}`,
          password,
          role,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          phone: `+2519${randomInt(10000000, 99999999)}`,
          profile: role === UserRole.CLIENT ? { create: {} } : undefined,
        },
      });
      userIds.push(u.id);
    } catch (e) {
      // skip duplicate
    }
  }
  console.log(`✅ ${userIds.length} users seeded`);

  // ── 8. Vendor Profiles (100) ──────────────────────────────────────────────
  const vendorUserIds = userIds.slice(110, 210);
  for (let i = 0; i < Math.min(100, vendorUserIds.length); i++) {
    const cat = randomItem(vendorCategories);
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const bizName = `${fn} ${cat.name} Studio`;
    const slug = `${fn.toLowerCase()}-${cat.slug}-${i}`;
    try {
      await prisma.vendorProfile.upsert({
        where: { slug },
        update: {},
        create: {
          userId: vendorUserIds[i],
          categoryId: cat.id,
          businessName: bizName,
          slug,
          description: `Professional ${cat.name} services in Ethiopia with over ${randomInt(2, 15)} years of experience.`,
          city: randomItem(cities),
          basePrice: randomInt(2000, 50000),
          priceUnit: 'per event',
          isVerified: randomInt(0, 1) === 1,
          isFeatured: i < 10,
          isAvailable: true,
          averageRating: (3 + Math.random() * 2).toFixed(2) as any,
          totalReviews: randomInt(0, 120),
        },
      });
    } catch (e) {
      // skip
    }
  }
  console.log('✅ Vendor profiles seeded');

  // ── 9. Gallery Albums ─────────────────────────────────────────────────────
  const albumCategories = ['Wedding', 'Birthday', 'Corporate', 'Graduation', 'Engagement'];
  for (const cat of albumCategories) {
    const slug = `${cat.toLowerCase()}-gallery`;
    await prisma.galleryAlbum.upsert({
      where: { slug },
      update: {},
      create: {
        title: `${cat} Gallery`,
        slug,
        description: `Beautiful ${cat.toLowerCase()} moments captured by our expert photographers.`,
        category: cat,
        isPublic: true,
      },
    });
  }
  console.log('✅ Gallery albums seeded');

  // ── 10. Testimonials (100) ────────────────────────────────────────────────
  const testimonialTexts = [
    'PrideHub made our wedding day absolutely perfect! Every detail was handled with care.',
    'The team was professional, responsive, and delivered beyond our expectations.',
    'I cannot imagine planning my event without PrideHub. Simply amazing service!',
    'From venue selection to catering, everything was flawless. Highly recommended!',
    'Our corporate event was a huge success thanks to the PrideHub team.',
    'The decoration was breathtaking and the coordination was impeccable.',
    'Best event planning experience in Ethiopia. Five stars without hesitation!',
    'They turned our vision into reality. The birthday party was magical.',
    'Professional, punctual, and passionate. PrideHub is the best choice.',
    'The graduation ceremony was beautifully organized. Our family was so proud.',
  ];

  for (let i = 0; i < 100; i++) {
    const fn = randomItem(firstNames);
    const ln = randomItem(lastNames);
    await prisma.testimonial.create({
      data: {
        clientName: `${fn} ${ln}`,
        clientTitle: randomItem(['Bride', 'Groom', 'Event Manager', 'CEO', 'Parent', 'Graduate', 'Client']),
        rating: randomInt(4, 5),
        content: randomItem(testimonialTexts),
        eventType: randomItem(['Wedding', 'Birthday', 'Corporate', 'Graduation', 'Engagement']),
        isApproved: true,
        isFeatured: i < 8,
        approvedAt: new Date(),
        sortOrder: i,
      },
    });
  }
  console.log('✅ 100 testimonials seeded');

  // ── 11. Blog Posts ────────────────────────────────────────────────────────
  const blogCategory = await prisma.category.upsert({
    where: { slug: 'wedding-tips' },
    update: {},
    create: { name: 'Wedding Tips', slug: 'wedding-tips' },
  });
  const eventTips = await prisma.category.upsert({
    where: { slug: 'event-tips' },
    update: {},
    create: { name: 'Event Tips', slug: 'event-tips' },
  });

  const blogTitles = [
    '10 Tips for Planning the Perfect Ethiopian Wedding',
    'How to Choose the Right Venue for Your Event',
    'Top Wedding Trends in Ethiopia for 2025',
    'The Ultimate Corporate Event Planning Checklist',
    'How to Plan a Surprise Birthday Party',
    'Traditional vs. Modern Wedding: A Complete Guide',
    'Budgeting for Your Dream Wedding',
    'The Best Wedding Venues in Addis Ababa',
    'How to Choose the Perfect Wedding Photographer',
    'Top 5 Catering Services for Ethiopian Weddings',
  ];

  for (let i = 0; i < 100; i++) {
    const title = `${randomItem(blogTitles)} — Edition ${i + 1}`;
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 80) + `-${i}`;
    const pub = randomDate(new Date('2024-01-01'), new Date());
    await prisma.blogPost.create({
      data: {
        authorId: superAdmin.id,
        categoryId: i % 2 === 0 ? blogCategory.id : eventTips.id,
        title,
        slug,
        excerpt: `Discover expert insights on ${title.split(' ').slice(0, 4).join(' ').toLowerCase()} and make your event unforgettable.`,
        content: `<h2>${title}</h2><p>Planning a memorable event requires attention to detail, creativity, and professional support. At PrideHub, we specialize in turning your vision into reality. This guide covers everything you need to know about ${title.split(' ').slice(0, 3).join(' ').toLowerCase()}.</p><h3>Key Takeaways</h3><ul><li>Start planning early — at least 6 months in advance</li><li>Set a realistic budget with 10% contingency</li><li>Choose vendors who align with your vision</li><li>Communication is key throughout the process</li></ul><p>Contact PrideHub today to begin your journey toward the perfect event.</p>`,
        status: BlogStatus.PUBLISHED,
        publishedAt: pub,
        readTime: randomInt(3, 12),
        views: randomInt(100, 10000),
        seoTitle: title,
        seoDesc: `Read our guide on ${title.toLowerCase()}.`,
      },
    });
  }
  console.log('✅ 100 blog posts seeded');

  // ── 12. FAQs ──────────────────────────────────────────────────────────────
  const faqs = [
    { q: 'How do I book an event with PrideHub?', a: 'Simply visit our website, select your desired service or package, fill in the booking form with your event details, and our team will contact you within 24 hours.', cat: 'Booking' },
    { q: 'What payment methods do you accept?', a: 'We accept Chapa, Telebirr, Stripe, and manual bank transfers. Payment plans and installments are available for packages over 50,000 ETB.', cat: 'Payment' },
    { q: 'Can I customize a package?', a: 'Absolutely! All our packages are fully customizable. Contact our team to discuss your specific requirements and we will create a tailored solution.', cat: 'Packages' },
    { q: 'What is your cancellation policy?', a: 'Cancellations made 30+ days before the event receive a full refund. Cancellations 14-29 days prior receive 50% refund. Cancellations under 14 days are non-refundable.', cat: 'Policy' },
    { q: 'Do you provide services outside Addis Ababa?', a: 'Yes! We operate across all major Ethiopian cities including Hawassa, Bahir Dar, Adama, Gondar, and Mekelle.', cat: 'General' },
    { q: 'How far in advance should I book?', a: 'We recommend booking at least 3-6 months in advance, especially for peak seasons (December-January and April-June).', cat: 'Booking' },
    { q: 'Do you offer wedding planning consultation?', a: 'Yes, we offer a free 30-minute initial consultation. You can schedule this through our website or by calling our office.', cat: 'Services' },
    { q: 'Are your vendors insured and verified?', a: 'All vendors on our platform undergo a thorough verification process including background checks, portfolio review, and client reference verification.', cat: 'Vendors' },
  ];

  for (let i = 0; i < faqs.length; i++) {
    const slug = faqs[i].q.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 60);
    await prisma.faq.upsert({
      where: { id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
        question: faqs[i].q,
        answer: faqs[i].a,
        category: faqs[i].cat,
        isActive: true,
        sortOrder: i,
      },
    });
  }
  console.log('✅ FAQs seeded');

  // ── 13. Bookings (500) ────────────────────────────────────────────────────
  const venues = await prisma.venue.findMany({ take: 50 });
  const packages = await prisma.package.findMany({ take: 50 });
  const clientIds = userIds.slice(10, 110);
  const plannerIds = userIds.slice(0, 10);
  const statuses = Object.values(BookingStatus);
  const eventTypes = Object.values(EventType);

  for (let i = 0; i < 500; i++) {
    const clientId = randomItem(clientIds);
    const venue = randomItem(venues);
    const pkg = randomItem(packages);
    const status = randomItem(statuses);
    const eventDate = randomDate(new Date('2024-01-01'), new Date('2026-12-31'));
    const bookingNumber = `PH-${Date.now().toString(36).toUpperCase()}-${i.toString(36).padStart(4, '0').toUpperCase()}`;

    try {
      const booking = await prisma.booking.create({
        data: {
          bookingNumber,
          clientId,
          assignedTo: randomItem(plannerIds),
          packageId: pkg.id,
          venueId: venue.id,
          eventType: randomItem(eventTypes),
          eventDate,
          guestCount: randomInt(30, 600),
          budgetMin: randomInt(20000, 80000),
          budgetMax: randomInt(80000, 500000),
          totalAmount: randomInt(30000, 400000),
          paidAmount: status === BookingStatus.COMPLETED ? randomInt(30000, 400000) : randomInt(0, 30000),
          status,
          specialRequests: randomInt(0, 1) === 1 ? 'Please ensure halal catering options are available.' : undefined,
        },
      });

      // Create payment for confirmed/completed bookings
      if (status === BookingStatus.CONFIRMED || status === BookingStatus.COMPLETED) {
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            amount: Number(booking.paidAmount),
            currency: 'ETB',
            method: randomItem(Object.values(PaymentMethod)),
            status: PaymentStatus.COMPLETED,
            paidAt: randomDate(new Date('2024-01-01'), new Date()),
            transactionRef: `TXN-${Date.now()}-${i}`,
          },
        });
      }
    } catch (e) {
      // skip duplicate booking numbers
    }
  }
  console.log('✅ 500 bookings seeded');

  // ── 14. System Settings ───────────────────────────────────────────────────
  const settings = [
    { key: 'site.name', value: 'PrideHub', group: 'general', isPublic: true },
    { key: 'site.tagline', value: 'Where Every Celebration Comes to Life', group: 'general', isPublic: true },
    { key: 'site.email', value: 'info@pridehub.com', group: 'general', isPublic: true },
    { key: 'site.phone', value: '+251911234567', group: 'general', isPublic: true },
    { key: 'site.address', value: 'Bole Road, Addis Ababa, Ethiopia', group: 'general', isPublic: true },
    { key: 'site.currency', value: 'ETB', group: 'general', isPublic: true },
    { key: 'site.depositPercent', value: 30, group: 'payments', isPublic: true },
    { key: 'site.taxRate', value: 15, group: 'payments', isPublic: false },
    { key: 'site.maintenanceMode', value: false, group: 'system', isPublic: false },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value as any },
      create: { key: s.key, value: s.value as any, group: s.group, isPublic: s.isPublic },
    });
  }
  console.log('✅ System settings seeded');

  console.log('\n🎉 Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin:  admin@pridehub.com');
  console.log('  Pass:   Admin@123456');
  console.log('  Users:  User@123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
