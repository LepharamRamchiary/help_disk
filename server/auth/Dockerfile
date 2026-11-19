# Dockerfile for the authentication application
# Use your current Node.js version as the base image
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8001

CMD ["npm", "start"]
