# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# 1) ติดตั้ง deps แต่ "ไม่รัน postinstall"
COPY package*.json ./
RUN npm ci --ignore-scripts

# 2) คัดลอกซอร์สทั้งหมด (รวม prisma/schema.prisma)
COPY . .

# 3) ให้ Prisma มี DATABASE_URL ตอน build (dummy แต่รูปแบบถูก)
ARG DATABASE_URL=postgresql://user:pass@localhost:5432/dummy
ENV DATABASE_URL=$DATABASE_URL

# 4) ตอนนี้ไฟล์ prisma อยู่แล้ว ค่อย generate client
RUN npx prisma generate

# 5) Build Next.js
RUN npm run build

# --- runtime stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# คัดลอกผล build เข้ามา
COPY --from=build /app ./

EXPOSE 3000

# ใช้ DATABASE_URL จริงจาก Railway ตอนรัน
CMD sh -c "npx prisma migrate deploy && npm start"
