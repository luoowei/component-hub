FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY src/ ./src/
COPY public/ ./public/
EXPOSE 3000
CMD ["node", "-e", "require('./src/registry.js'); console.log('component-hub ready on :3000')"]
