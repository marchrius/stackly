FROM node:24-alpine AS base

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/lib/package.json packages/lib/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN npm ci --include=dev

FROM deps AS builder

COPY . .

RUN cd packages/db && npx prisma generate
RUN cd apps/web && npx next build

FROM base AS runner

RUN apk add --no-cache postgresql-client

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV UPLOAD_DIR=/var/lib/stackly/uploads

COPY --from=builder /app /app
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && mkdir -p /var/lib/stackly/uploads

VOLUME ["/var/lib/stackly/uploads"]

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
