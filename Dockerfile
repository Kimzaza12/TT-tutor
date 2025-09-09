# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# ติดตั้ง deps
COPY package*.json ./
RUN npm ci

# คัดลอกซอร์สทั้งหมด รวมถึง prisma/schema.prisma
COPY . .

# ให้ Prisma มี DATABASE_URL ตอน build (dummy ที่ฟอร์แมตถูกต้อง)
ARG DATABASE_URL=postgresql://user:pass@localhost:5432/dummy
ENV DATABASE_URL=$DATABASE_URL

# generate client (ต้องมี prisma/schema.prisma)
RUN npx prisma generate

# build Next.js
RUN npm run build

# --- runtime stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# คัดลอกไฟล์ที่ build แล้วเข้ามา
COPY --from=build /app ./

EXPOSE 3000

# ใช้ DATABASE_URL จริงจาก Railway ตอน runtime
CMD sh -c "npx prisma migrate deploy && npm start"
