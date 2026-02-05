FROM node:22.11.0

WORKDIR /app

COPY package.json .



RUN npm i

COPY . .

EXPOSE 3000

ENV NODE_ENV=production

# ✅ Offline Order Feature Flags
ENV ENABLE_ADMIN_OFFLINE_ORDERS=true
ENV NEXT_PUBLIC_ENABLE_ADMIN_OFFLINE_ORDERS=true

# ✅ POS System Feature Flag
ENV NEXT_PUBLIC_ENABLE_POS=true

RUN npm run build

CMD ["npm", "start"]