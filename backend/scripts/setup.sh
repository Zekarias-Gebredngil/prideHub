#!/usr/bin/env bash
# PrideHub Backend Setup Script
set -e

echo "🚀 Setting up PrideHub backend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "📊 Running database migrations..."
npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
npx ts-node prisma/seed.ts

echo ""
echo "✅ Setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Start:  npm run start:dev"
echo "  Docs:   http://localhost:3000/api/docs"
echo "  Studio: npx prisma studio"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
