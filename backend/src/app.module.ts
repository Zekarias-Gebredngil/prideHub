import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { EventsModule } from './modules/events/events.module';
import { ServicesModule } from './modules/services/services.module';
import { PackagesModule } from './modules/packages/packages.module';
import { VenuesModule } from './modules/venues/venues.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { BlogModule } from './modules/blog/blog.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadModule } from './modules/upload/upload.module';
import { MailModule } from './modules/mail/mail.module';
import { SearchModule } from './modules/search/search.module';
import { CrmModule } from './modules/crm/crm.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { FaqModule } from './modules/faq/faq.module';
import { ContactModule } from './modules/contact/contact.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SettingsModule } from './modules/settings/settings.module';
import { GatewayModule } from './gateway/gateway.module';
import { SmsModule } from './modules/sms/sms.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import storageConfig from './config/storage.config';
import mailConfig from './config/mail.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, storageConfig, mailConfig, redisConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // ── Rate Limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60) * 1000,
          limit: config.get('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // ── Event Emitter ────────────────────────────────────────────────────────
    EventEmitterModule.forRoot({ wildcard: true, maxListeners: 20 }),

    // ── Scheduler ───────────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Core ─────────────────────────────────────────────────────────────────
    PrismaModule,

    // ── Feature Modules ───────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    BookingsModule,
    EventsModule,
    ServicesModule,
    PackagesModule,
    VenuesModule,
    VendorsModule,
    PaymentsModule,
    GalleryModule,
    BlogModule,
    ReviewsModule,
    TestimonialsModule,
    NotificationsModule,
    MessagesModule,
    ReportsModule,
    AdminModule,
    UploadModule,
    MailModule,
    SearchModule,
    CrmModule,
    NewsletterModule,
    FaqModule,
    ContactModule,
    DashboardModule,
    SettingsModule,
    GatewayModule,
    SmsModule,
  ],
})
export class AppModule {}
