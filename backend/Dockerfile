# Use official lightweight Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
