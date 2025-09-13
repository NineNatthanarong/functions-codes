# Functions & Tools - Docker Deployment

This application is containerized and available on Docker Hub.

## Quick Start with Docker

### Option 1: Pull from Docker Hub (Recommended)
```bash
# Pull the latest image
docker pull ninenatthanarong/functions-tools:latest

# Run the container
docker run -p 3000:3000 ninenatthanarong/functions-tools:latest
```

### Option 2: Build Locally
```bash
# Clone the repository
git clone <your-repo-url>
cd functions-codes

# Build the Docker image
docker build -t functions-tools .

# Run the container
docker run -p 3000:3000 functions-tools
```

## Docker Commands

### Building the Image
```bash
docker build -t ninenatthanarong/functions-tools:latest .
```

### Running the Container
```bash
# Run in foreground
docker run -p 3000:3000 ninenatthanarong/functions-tools:latest

# Run in background (detached)
docker run -d -p 3000:3000 ninenatthanarong/functions-tools:latest

# Run with custom name
docker run -d --name functions-tools -p 3000:3000 ninenatthanarong/functions-tools:latest
```

### Managing Containers
```bash
# List running containers
docker ps

# Stop a container
docker stop functions-tools

# Remove a container
docker rm functions-tools

# View logs
docker logs functions-tools
```

## Deployment Script

Use the provided deployment script to build and push to Docker Hub:

```bash
# Make the script executable
chmod +x docker-deploy.sh

# Run the deployment
./docker-deploy.sh
```

## Environment Variables

The application runs on port 3000 by default. You can map it to any external port:

```bash
# Run on port 8080
docker run -p 8080:3000 ninenatthanarong/functions-tools:latest
```

## Docker Hub Repository

The image is available at: https://hub.docker.com/r/ninenatthanarong/functions-tools

## Features Included

- ✅ QR Code Generator with customization options
- ✅ Background Remover (Basic + AI-powered)
- ✅ Responsive design for all devices
- ✅ Modern, professional UI
- ✅ Client-side processing for privacy

## Technical Details

- **Base Image**: Node.js 18 Alpine
- **Framework**: Next.js 15
- **Build**: Multi-stage Docker build for optimization
- **Size**: Optimized for minimal footprint
- **Security**: Non-root user execution