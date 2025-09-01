FROM node:22.11.0

WORKDIR /app

COPY package.json .



RUN npm i

COPY . .

EXPOSE 3000

ENV NODE_ENV=production

RUN npm run build

CMD ["npm", "start"]