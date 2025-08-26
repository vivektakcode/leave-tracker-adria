#!/bin/bash

# Use the working Node.js version for this project
export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"

# Check Node.js version
echo "Using Node.js version: $(~/.nvm/versions/node/v22.18.0/bin/node --version)"

# Start the development server directly with next
echo "Starting Next.js development server..."
~/.nvm/versions/node/v22.18.0/bin/node ./node_modules/.bin/next dev -p 4444 