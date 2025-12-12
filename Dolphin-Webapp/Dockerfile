
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the Angular app in production mode
RUN npm run build -- --configuration production

# Production stage
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx config
# COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage to nginx
COPY --from=builder /app/dist/finance-webapp/browser/ /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
