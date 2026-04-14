#!/bin/bash

echo "=== START SCRIPT RUNNING ==="
echo "PORT=${PORT}"
echo "DB_HOST=${DB_HOST}"
echo "APP_KEY=${APP_KEY:0:20}..."

# Write .env file
cat > /app/.env << EOF
APP_NAME=SERS
APP_ENV=${APP_ENV:-production}
APP_KEY=${APP_KEY}
APP_DEBUG=${APP_DEBUG:-false}
APP_URL=${APP_URL:-http://localhost}
LOG_CHANNEL=stderr
DB_CONNECTION=${DB_CONNECTION:-mysql}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
SCOUT_DRIVER=${SCOUT_DRIVER:-database}
SANCTUM_STATEFUL_DOMAINS=${SANCTUM_STATEFUL_DOMAINS}
FIREBASE_CREDENTIALS=${FIREBASE_CREDENTIALS}
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
EOF

echo "=== .env file created ==="
cat /app/.env | head -10

echo "=== Running migrations ==="
php artisan migrate --force 2>&1 || true

echo "=== Starting PHP built-in server on port ${PORT:-8080} ==="
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8080} 2>&1
