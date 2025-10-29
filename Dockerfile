# --- STAGE 1: Dependencies & Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# نصب pnpm
RUN npm install -g pnpm

# کپی کردن فایل‌های وابستگی و Prisma
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# نصب همه‌ی وابستگی‌ها (شامل devDependencies برای بیلد و پریزما)
RUN pnpm install --frozen-lockfile --prod=false

# کپی کردن بقیه سورس کد
COPY . .

# اجرای Prisma Generate و بیلد پروژه
RUN pnpm prisma generate
RUN pnpm build

# حذف وابستگی‌های توسعه (dev) برای کوچک‌سازی
RUN pnpm prune --prod

# --- STAGE 2: Production ---
# ایمیج نهایی که روی سرور اجرا می‌شود
FROM node:20-alpine AS production
WORKDIR /app

# کپی کردن فایل‌های بیلد شده و node_modules از مرحله قبل
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENV PORT 3000

# ما CMD را اینجا نمی‌گذاریم، چون داکپلوی آن را بازنویسی (override) می‌کند