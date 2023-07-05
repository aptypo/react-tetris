FROM bitnami/node
EXPOSE 80
RUN mkdir /tetris
WORKDIR /tetris
COPY package.json /tetris
RUN npm install
RUN npm install -g http-server
COPY . /tetris
RUN npm run build
ENTRYPOINT ["http-server", "-p", "80", "build"]