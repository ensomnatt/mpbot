FROM node:slim

RUN apt-get update && apt-get install -y python3 python3-pip build-essential

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["node", "dist/src/bot.js"]
