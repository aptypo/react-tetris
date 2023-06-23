FROM node:alpine
EXPOSE 8080
RUN mkdir /app
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
ENTRYPOINT npm run start
