
#use the official node.js 20 image withalpine linux as the base image.
# check=skip=JSONArgsRecommended
FROM node:20-alpine-3.21

# working directory
WORKDIR /use/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD [ "node", "src/server.js" ]

