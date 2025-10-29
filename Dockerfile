# --- STAGE 1: Build ---
FROM node:20-alpine
WORKDIR /app

# نصب pnpm
RUN npm install -g pnpm

# کپی کردن فایل‌های وابستگی
COPY package.json pnpm-lock.yaml ./

# نصب همه‌ی وابستگی‌ها (شامل devDependencies برای drizzle-kit)
# ما به prod=false نیاز داریم تا drizzle-kit در ایمیج نهایی بماند
RUN pnpm install --frozen-lockfile --prod=false

# کپی کردن بقیه سورس کد
COPY . .

# بیلد کردن پروژه
RUN pnpm build

EXPOSE 3000
ENV PORT 3000

# دستور CMD را خالی می‌گذاریم تا داکپلوی آن را تنظیم کند