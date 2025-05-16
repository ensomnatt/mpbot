FROM node:latest

RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./

RUN npm install --build-from-source=better-sqlite3

COPY . .

RUN npm run build

CMD ["node", "dist/src/bot.js"]
