import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WinstonLogger } from './common/logger/winston.logger';

async function bootstrap() {
  const logger = new WinstonLogger();

  const app = await NestFactory.create(AppModule, { logger });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
  const isProd = configService.get('NODE_ENV') === 'production';

  // ── Security Headers (enterprise-grade Helmet) ────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'", 'https:', 'data:'],
              frameSrc: ["'none'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
            },
          }
        : false,
      hsts: isProd
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
      noSniff: true,
      frameguard: { action: 'deny' },
      permittedCrossDomainPolicies: false,
    }),
  );

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Middleware ─────────────────────────────────────────────────────────────
  app.use(compression());
  app.use(cookieParser());

  // ── Versioning ─────────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ── Validation ─────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      // Prevent large payloads from overwhelming validation
    }),
  );

  // ── Global Filters & Interceptors ─────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // ── Swagger ───────────────────────────────────────────────────────────────
  if (configService.get('SWAGGER_ENABLED') !== 'false') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('PrideHub API')
      .setDescription('PrideHub Event Management Marketplace — REST API')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addCookieAuth(REFRESH_COOKIE_NAME)
      .addTag('Auth', 'Authentication & Authorization')
      .addTag('Users', 'User Management')
      .addTag('Bookings', 'Event Booking System')
      .addTag('Events', 'Event Management')
      .addTag('Services', 'Event Services')
      .addTag('Packages', 'Service Packages')
      .addTag('Venues', 'Venue Management')
      .addTag('Vendors', 'Vendor Management')
      .addTag('Payments', 'Payment Processing')
      .addTag('Commission', 'Commission & Revenue Engine')
      .addTag('Settlement', 'Settlement Engine')
      .addTag('Wallet', 'Vendor Wallet')
      .addTag('Subscriptions', 'Vendor Subscriptions')
      .addTag('Gallery', 'Photo & Video Gallery')
      .addTag('Blog', 'Blog & Content')
      .addTag('Reviews', 'Reviews & Testimonials')
      .addTag('Notifications', 'Notifications')
      .addTag('Messages', 'Real-time Messaging')
      .addTag('Reports', 'Reports & Analytics')
      .addTag('Admin', 'Administration')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  logger.log(`🚀 PrideHub API running on: http://localhost:${port}/api/v1`, 'Bootstrap');
  logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
}

const REFRESH_COOKIE_NAME = 'refresh_token';

bootstrap();
