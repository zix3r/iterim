FROM node:20-alpine
WORKDIR /app

# Install dependencies first (caching layer)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Pass in the API URL argument and map to env var
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

# Expose port 3000 for Vite
EXPOSE 3000

# Start Vite dev server on 0.0.0.0 so it's accessible outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]