FROM node:18-alpine

WORKDIR /app

# Copy package files from root
COPY package*.json ./
RUN npm install

# Copy project files from root
COPY . .

EXPOSE 3000

# Start Vite server with host binding for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]