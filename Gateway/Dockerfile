FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install express-rate-limit
RUN npm install
COPY . .
EXPOSE 5004
CMD ["npm", "start"]