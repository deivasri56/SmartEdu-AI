# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ gcc sqlite-dev

WORKDIR /app

# Install dependencies first (leverage Docker caching)
COPY package.json package-lock.json ./
RUN npm ci

# Cache bust to ensure fresh dev.db
ARG CACHEBUST=1

# Copy the rest of the application files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Run seed scripts to populate the database
RUN node prisma/seed-it-classes.js || true

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache sqlite-dev

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy output from builder stage
COPY --from=base /app/next.config.ts ./
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/dev.db ./dev.db
COPY --from=base /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
