FROM node:16

COPY . /app

WORKDIR /app/backend

RUN npm run install

CMD npm run start
