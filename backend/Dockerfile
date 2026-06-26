FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache dumb-init openssl

# Install production deps
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Copy built output and prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Regenerate the Prisma client for the correct Alpine target
# (binaryTargets in schema.prisma includes linux-musl-openssl-3.0.x)
RUN npx prisma generate

RUN mkdir -p uploads && chown -R node:node /app
EXPOSE 3000
USER node
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
