FROM node:16

COPY . /app

WORKDIR /app/backend

RUN npm install

CMD npm run start
