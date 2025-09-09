# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# ติดตั้ง deps แต่ไม่รัน postinstall (กัน prisma generate ก่อนมี schema)
COPY package*.json ./
RUN npm ci --ignore-scripts

# คัดลอกซอร์สทั้งหมด (รวม prisma/schema.prisma)
COPY . .

# กันพลาด: ถ้ามี .env ในโปรเจกต์ ให้ลบทิ้งจาก image
RUN rm -f .env

# ให้ Prisma มี DATABASE_URL ตอน build (dummy ที่ฟอร์แมตถูกต้อง)
ARG DATABASE_URL=postgresql://user:pass@localhost:5432/dummy
ENV DATABASE_URL=$DATABASE_URL

# ปิด npm notice (เพื่อไม่ให้ log รก)
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# ตอนนี้มี schema แล้ว ค่อย generate client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# --- runtime stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# คัดลอกผล build เข้ามา
COPY --from=build /app ./

# ensure ไม่มี .env ใน runtime image
RUN rm -f .env

EXPOSE 3000

# ใช้ DATABASE_URL จริงจาก Railway ตอนรัน
CMD sh -c "npx prisma migrate deploy && npm start"
