# Use Node.js base image
FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port your Express app runs on
EXPOSE 3000

# Start the app with PM2 (optional) or plain Node
CMD ["node", "app.js"]