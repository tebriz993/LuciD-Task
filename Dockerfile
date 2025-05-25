# Base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the application
COPY . .

# Build the app
RUN npm run build

# Serve the app using a static server
RUN npm install -g serve
CMD ["serve", "-s", "dist"]

# Expose port
EXPOSE 3000
