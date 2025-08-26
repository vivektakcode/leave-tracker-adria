#!/bin/bash

# Use the newer Node.js version for this project
export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH"

# Check Node.js version
echo "Using Node.js version: $(node --version)"
echo "Using npm version: $(npm --version)"

# Start the development server
npm run dev 