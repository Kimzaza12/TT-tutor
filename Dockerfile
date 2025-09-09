# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# ติดตั้ง deps
COPY package*.json ./
RUN npm ci

# คัดลอกซอร์ส
COPY . .

# ให้ Prisma มี DATABASE_URL ตอน build (ค่า dummy ที่ฟอร์แมตถูกต้อง)
ARG DATABASE_URL=postgresql://user:pass@localhost:5432/dummy
ENV DATABASE_URL=$DATABASE_URL

# สร้าง Prisma Client และ build Next
RUN npx prisma generate
RUN npm run build

# --- runtime stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# คัดลอกผล build เข้ามา
COPY --from=build /app ./

EXPOSE 3000

# ใช้ DATABASE_URL จริงจาก Railway ตอนรัน
# apply migrations แล้วสตาร์ทแอป
CMD sh -c "npx prisma migrate deploy && npm start"
