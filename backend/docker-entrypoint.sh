#!/bin/sh
set -e

# Generate random app key
APP_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));")

# Buat .env dari environment variables Docker
cat > .env << EOF
APP_NAME=SecVis
APP_ENV=${APP_ENV:-production}
APP_DEBUG=${APP_DEBUG:-false}
APP_URL=${APP_URL:-http://localhost:8000}
APP_KEY=$APP_KEY

DB_CONNECTION=mysql
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE:-secvis}
DB_USERNAME=${DB_USERNAME:-secvis_user}
DB_PASSWORD=${DB_PASSWORD:-secret}

SESSION_DRIVER=file
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=public

SANCTUM_STATEFUL_DOMAINS=localhost
SESSION_DOMAIN=localhost

TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}
EOF

# Generate session table migration jika belum ada
php artisan session:table 2>/dev/null || true

# Run migrations
php artisan migrate --force

# Seed database
php artisan db:seed --force


# Storage link
php artisan storage:link || true

# Clear cache
php artisan config:clear
php artisan cache:clear

# Start server
exec php artisan serve --host=0.0.0.0 --port=8000