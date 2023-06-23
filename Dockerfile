FROM node:alpine
EXPOSE 3000
RUN mkdir /app
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
ENTRYPOINT npm run start
