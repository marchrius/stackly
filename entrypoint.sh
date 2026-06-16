#!/bin/sh
set -eu

echo "[entrypoint] Starting Stackly container..."

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${NEXTAUTH_SECRET:?NEXTAUTH_SECRET is required}"
: "${NEXTAUTH_URL:?NEXTAUTH_URL is required}"
: "${UPLOAD_DIR:=/var/lib/stackly/uploads}"

APP_UPLOADS_DIR="/app/apps/web/public/uploads"

if [ "$UPLOAD_DIR" != "$APP_UPLOADS_DIR" ]; then
  mkdir -p "$UPLOAD_DIR"
  mkdir -p "$(dirname "$APP_UPLOADS_DIR")"
  if [ -L "$APP_UPLOADS_DIR" ] || [ -d "$APP_UPLOADS_DIR" ]; then
    rm -rf "$APP_UPLOADS_DIR"
  fi
  ln -s "$UPLOAD_DIR" "$APP_UPLOADS_DIR"
else
  mkdir -p "$APP_UPLOADS_DIR"
fi

DB_NAME="$(node -e 'const u=new URL(process.env.DATABASE_URL); console.log((u.pathname || "").replace(/^\//, ""))')"
DB_ADMIN_URL="$(node -e 'const u=new URL(process.env.DATABASE_URL); u.pathname="/postgres"; u.search=""; console.log(u.toString())')"

if [ -z "$DB_NAME" ]; then
  echo "[entrypoint] Invalid DATABASE_URL: missing database name."
  exit 1
fi

echo "[entrypoint] Waiting for PostgreSQL..."
until psql "$DB_ADMIN_URL" -c "SELECT 1" >/dev/null 2>&1; do
  sleep 1
done

DB_EXISTS="$(psql "$DB_ADMIN_URL" -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'")"

if [ "$DB_EXISTS" != "1" ]; then
  echo "[entrypoint] Database '$DB_NAME' not found. Creating..."
  psql "$DB_ADMIN_URL" -c "CREATE DATABASE \"$DB_NAME\""
else
  echo "[entrypoint] Database '$DB_NAME' found. Applying migrations..."
fi

cd /app/packages/db
node /app/node_modules/prisma/build/index.js migrate deploy --schema /app/packages/db/prisma/schema.prisma
cd /app

echo "[entrypoint] Launching Next.js..."
exec node /app/apps/web/server.js
