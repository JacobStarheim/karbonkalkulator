#backend/Dockerfile 
FROM node:22-alpine
USER node
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
RUN npm ci
COPY . .
ENV PORT=3001
EXPOSE 3001
CMD ["npx", "nodemon", "src/server.ts"]


# FROM node:22-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# COPY . .
# RUN npm run build

# FROM node:22-alpine as prod
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci --omit=dev


# FROM node:22-alpine
# ENV NODE_ENV production
# USER node
# WORKDIR /home/node/app
# COPY --from=prod --chown=node:node /app/node_modules ./node_modules
# COPY --from=builder --chown=node:node /app/dist ./dist
# COPY --from=builder --chown=node:node /app/package.json ./package.json
# EXPOSE 3001
# CMD ["npm", "start"]






