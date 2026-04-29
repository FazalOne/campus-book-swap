FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV HOST=0.0.0.0
ENV PORT=3001
ENV VITE_PORT=3000

EXPOSE 3000 3001

CMD ["npm", "run", "start"]
