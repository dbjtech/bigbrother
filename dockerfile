FROM node:alpine AS build-stage

WORKDIR /src/app

COPY portal /src/app

RUN npm i
RUN npm run-script build

FROM node:alpine

WORKDIR /src/app

COPY server server
COPY package.json package.json
COPY --from=build-stage /src/app/dist portal/dist
COPY --from=build-stage /src/app/index.html portal/dist/index.html

RUN ls

RUN npm i --production

CMD node server/webserver.js --port 80

EXPOSE 80
