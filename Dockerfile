# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
# กันไม่ให้ .env dev ติดเข้า image ไปกวน DATABASE_URL ของโปรดักชัน
RUN rm -f .env

# dummy DB URL ให้ prisma generate ผ่านตอน build
ARG DATABASE_URL=postgresql://user:pass@localhost:5432/dummy
ENV DATABASE_URL=$DATABASE_URL
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

RUN npx prisma generate
RUN npm run build

# --- runtime stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

COPY --from=build /app ./
RUN rm -f .env

EXPOSE 3000

# ✅ ไม่บล็อกสตาร์ท: migrate รันเบื้องหลัง
# ✅ บังคับ Next bind 0.0.0.0 และใช้พอร์ตจาก Railway
CMD sh -lc '(npx prisma migrate deploy || npx prisma db push --accept-data-loss) & exec ./node_modules/.bin/next start -H 0.0.0.0 -p ${PORT:-3000}'
