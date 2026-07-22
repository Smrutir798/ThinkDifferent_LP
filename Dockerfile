FROM node:20-alpine

WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies for backend and frontend
RUN npm run install-all

# Copy all source files
COPY . .

# Build React frontend
RUN npm run build --prefix frontend

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start", "--prefix", "backend"]
