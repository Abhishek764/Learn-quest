FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev
COPY src ./src
EXPOSE 3006
CMD ["node", "src/index.js"]
