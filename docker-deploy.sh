#!/bin/bash

# Build and Deploy Functions & Tools to Docker Hub
# Usage: ./docker-deploy.sh

set -e

# Configuration
DOCKER_USERNAME="ninenatthanarong"
IMAGE_NAME="functions-tools"
VERSION="latest"
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$VERSION"

echo "🚀 Starting Docker build and deployment process..."

# Step 1: Build the Docker image
echo "📦 Building Docker image: $FULL_IMAGE_NAME"
docker build -t $FULL_IMAGE_NAME .

# Step 2: Tag additional versions if needed
docker tag $FULL_IMAGE_NAME $DOCKER_USERNAME/$IMAGE_NAME:$(date +%Y%m%d)

echo "✅ Docker image built successfully!"

# Step 3: Login to Docker Hub (you'll be prompted for credentials)
echo "🔐 Logging into Docker Hub..."
echo "Please enter your Docker Hub credentials:"
docker login

# Step 4: Push the image
echo "⬆️ Pushing image to Docker Hub..."
docker push $FULL_IMAGE_NAME
docker push $DOCKER_USERNAME/$IMAGE_NAME:$(date +%Y%m%d)

echo "🎉 Deployment complete!"
echo "Your image is available at: https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME"
echo ""
echo "To run the container:"
echo "docker run -p 3000:3000 $FULL_IMAGE_NAME"
echo ""
echo "To pull and run from Docker Hub:"
echo "docker pull $FULL_IMAGE_NAME"
echo "docker run -p 3000:3000 $FULL_IMAGE_NAME"