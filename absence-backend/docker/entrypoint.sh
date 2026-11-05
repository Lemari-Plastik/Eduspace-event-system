#!/bin/sh
set -e

echo "==> Configuring Nginx port to ${PORT:-10000}..."
export PORT="${PORT:-10000}"
sed -i "s/__PORT__/$PORT/g" /etc/nginx/http.d/default.conf

echo "==> Running Laravel database migrations..."
php artisan migrate --force || echo "Warning: Migration failed, will continue..."

echo "==> Seeding initial data..."
php artisan db:seed --class=SchoolSeeder --force || echo "Notice: SchoolSeeder skipped or already run"
php artisan db:seed --class=AdminSeeder --force || echo "Notice: AdminSeeder skipped or already run"

echo "==> Optimizing configuration cache..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Starting PHP-FPM..."
php-fpm -D

echo "==> Starting Nginx on port $PORT..."
exec nginx -g "daemon off;"

