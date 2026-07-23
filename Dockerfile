# Multi-stage production build Dockerfile for Vinebot using Bun
# Stage 1: Build Frontend SPA & Backend CJS server
FROM oven/bun:1 AS builder

WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Build both frontend assets (to dist/) and backend server (to dist/server.cjs)
RUN bun run build

# Stage 2: Production runtime image
FROM oven/bun:1 AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy built production targets from builder stage
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["bun", "dist/server.cjs"]
