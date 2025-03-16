#!/bin/bash

echo "Testing application..."

# Test if the application runs
python app.py &
APP_PID=$!

# Wait a few seconds for the app to start
sleep 3

# Make a request to check if the app is running
if curl -s http://localhost:5000/ > /dev/null; then
    echo "✅ Application is running"
else
    echo "❌ Application failed to start"
    kill $APP_PID 2>/dev/null
    exit 1
fi

# Check API endpoints (adjust according to your API endpoints)
if curl -s http://localhost:5000/api/characters > /dev/null; then
    echo "✅ API endpoints are accessible"
else
    echo "❌ API endpoints are not accessible"
fi

# Stop the app
kill $APP_PID
echo "Application test complete"
