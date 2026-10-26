FROM node:22-bookworm-slim AS assets
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY resources ./resources
COPY vite.config.ts tsconfig.json ./
RUN npm run build

FROM php:8.4-fpm-bookworm AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx supervisor unzip libpq-dev libicu-dev libzip-dev libonig-dev libsqlite3-dev \
    && docker-php-ext-install -j2 pdo_pgsql pdo_sqlite mbstring intl zip bcmath opcache \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /app
ENV APP_ENV=production APP_DEBUG=false DESK_DEMO_ENABLED=false DESK_IDENTITY_PROVIDER=pitmetric \
    DB_CONNECTION=pgsql SESSION_DRIVER=file SESSION_COOKIE=buttidesk_session \
    SESSION_SECURE_COOKIE=true CACHE_STORE=file QUEUE_CONNECTION=sync MAIL_MAILER=array LOG_CHANNEL=stderr \
    COMPOSER_ALLOW_SUPERUSER=1
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction
COPY . .
RUN mkdir -p storage/framework/cache/data storage/framework/cache/locks storage/framework/sessions \
    storage/framework/views storage/logs storage/app/private bootstrap/cache \
    && composer dump-autoload --no-dev --optimize --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache
COPY --from=assets /build/public/build ./public/build
COPY docker/production/nginx.conf /etc/nginx/sites-enabled/default
COPY docker/production/supervisord.conf /etc/supervisor/conf.d/buttidesk.conf
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD php -r "exit(@file_get_contents('http://127.0.0.1:8080/up') === false ? 1 : 0);"
CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/buttidesk.conf"]
