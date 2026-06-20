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

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet({ crossOriginEmbedderPolicy: false }));
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
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
    }),
  );

  // ── Global Filters & Interceptors ─────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // ── Swagger ───────────────────────────────────────────────────────────────
  if (configService.get('SWAGGER_ENABLED') !== 'false') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('PrideHub API')
      .setDescription('PrideHub Event Management Platform — REST API Documentation')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addTag('Auth', 'Authentication & Authorization')
      .addTag('Users', 'User Management')
      .addTag('Bookings', 'Event Booking System')
      .addTag('Events', 'Event Management')
      .addTag('Services', 'Event Services')
      .addTag('Packages', 'Service Packages')
      .addTag('Venues', 'Venue Management')
      .addTag('Vendors', 'Vendor Management')
      .addTag('Payments', 'Payment Processing')
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

bootstrap();
