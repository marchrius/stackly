FROM node:20-bookworm-slim AS base

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/lib/package.json packages/lib/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN npm ci

FROM deps AS builder

ARG DATABASE_URL="postgresql://build:build@localhost:5432/koillection"
ARG NEXTAUTH_SECRET="build-time-secret-change-me"
ARG NEXTAUTH_URL="http://localhost:3000"
ARG UPLOAD_DIR="./apps/web/public/uploads"

ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV UPLOAD_DIR=$UPLOAD_DIR

COPY . .

RUN npm run db:generate --workspace=@koillection/db
RUN npm run build --workspace=@koillection/web

FROM base AS runner

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV UPLOAD_DIR="./apps/web/public/uploads"

COPY --from=builder /app /app

RUN mkdir -p /app/apps/web/public/uploads

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=@koillection/web"]
