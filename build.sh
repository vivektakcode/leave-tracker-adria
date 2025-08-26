#!/bin/bash

# Use the compatible Node.js version for this project
export PATH="$HOME/.nvm/versions/node/v18.20.8/bin:$PATH"

# Check Node.js version
echo "Using Node.js version: $(node --version)"
echo "Using npm version: $(npm --version)"

# Build the project
npm run build 