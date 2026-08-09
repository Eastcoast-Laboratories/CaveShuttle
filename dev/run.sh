#!/bin/bash
# Start the Vite development server and Geckos.io signaling server.
echo "Haupt-App: https://localhost:5173 (Vite)"
echo "Level Editor: https://localhost:5173/level-editor/"
echo "Geckos Server: https://localhost:9208"

# Check if dependencies are installed, install if not
if [ ! -d "node_modules" ]; then
  echo "Dependencies not found, running npm install..."
  npm install
fi
if [ ! -d "server/node_modules" ]; then
  echo "Server dependencies not found, running npm install in server/..."
  cd server && npm install && cd ..
fi

# Kill any existing process on port 5173 (Vite)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Killing existing process on port 5173..."
  lsof -ti :5173 | xargs kill -9
fi

# Kill any existing process on port 9208 (Geckos)
if lsof -Pi :9208 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Killing existing process on port 9208..."
  lsof -ti :9208 | xargs kill -9
fi

# Start Geckos server in background
node server/index.js &
GECKOS_PID=$!

# Start Vite dev server (foreground)
npm run dev

# When Vite exits, kill Geckos too
kill $GECKOS_PID 2>/dev/null
