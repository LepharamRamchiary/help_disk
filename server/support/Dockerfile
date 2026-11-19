# Dockerfile for the server support application
# Use your current Node.js version as the base image
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8002

CMD ["npm", "start"]
