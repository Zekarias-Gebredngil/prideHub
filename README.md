# PrideHub — Where Every Celebration Comes to Life

> Ethiopia's premier event management platform

---

## Project Structure

```
prideHub/
├── frontend/          # Angular 20 SPA
├── backend/           # NestJS REST API
├── nginx/             # Reverse proxy config
├── docker-compose.yml # Full stack orchestration
├── .env.example       # Environment template
└── README.md
```

---

## Tech Stack

| Layer     | Technology                                              |
|-----------|---------------------------------------------------------|
| Frontend  | Angular 20, Tailwind CSS, Angular Material, Signals     |
| Backend   | NestJS, TypeScript, Prisma ORM, JWT, Passport           |
| Database  | PostgreSQL 16 (via Docker)                              |
| Cache     | Redis 7                                                 |
| Storage   | Local / AWS S3 / Cloudinary (configurable)              |
| Real-time | Socket.IO WebSockets                                    |
| Auth      | JWT + Refresh Tokens, Google, Facebook OAuth            |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### 1. Clone and configure

```bash
cd prideHub
cp .env.example .env
# Edit .env with your secrets
```

### 2. Start with Docker Compose

```bash
docker-compose up -d
```

### 3. Local development

**Backend:**
```bash
cd backend
npm install
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## URLs

| Service   | URL                              |
|-----------|----------------------------------|
| Frontend  | http://localhost:4200            |
| Backend   | http://localhost:3000/api/v1     |
| Swagger   | http://localhost:3000/api/docs   |
| Prisma    | `npm run prisma:studio`          |

---

## Seed Data

The seed script generates:
- 1 Super Admin (`admin@pridehub.com` / `Admin@123456`)
- 200 Users (clients, planners, vendors)
- 100 Services, 50 Packages, 50 Venues
- 500 Bookings, 100 Testimonials, 100 Blog Posts

```bash
cd backend
npm run prisma:seed
```

---

## Environment Variables

See `.env.example` for the full list. Key variables:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
REDIS_URL=redis://...
STORAGE_PROVIDER=local|s3|cloudinary
GOOGLE_CLIENT_ID=...
CHAPA_SECRET_KEY=...
```

---

## API Standards

All responses follow:
```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "errors": []
}
```

Pagination:
```
GET /api/v1/services?page=1&limit=10&search=wedding&sortBy=price&sortOrder=asc
```

---

## Roles & Permissions

| Role          | Access                                      |
|---------------|---------------------------------------------|
| SUPER_ADMIN   | Full platform access                        |
| ADMIN         | Manage all content, users, bookings         |
| EVENT_PLANNER | Manage bookings, events, reports            |
| VENDOR        | Manage own profile, view bookings           |
| CLIENT        | Create bookings, view own data              |

---

## Production Deployment

```bash
# Build and deploy
docker-compose -f docker-compose.yml up -d --build

# Run migrations
docker exec pridehub_backend npx prisma migrate deploy

# View logs
docker-compose logs -f backend
```

---

## License

MIT © PrideHub Team
