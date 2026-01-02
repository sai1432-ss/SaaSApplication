FROM node:18-alpine

# Install curl for mandatory health check
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the mandatory port
EXPOSE 5000

# START THE SERVER (Mandatory)
CMD ["npm", "start"]
