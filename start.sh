#!/bin/bash

echo "Starting QR Attendance System..."
echo

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies first..."
    npm install
    echo
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp env.example .env
    echo
fi

# Start the application
echo "Starting server..."
echo
echo "The application will be available at:"
echo "- Main interface: http://localhost:3000"
echo "- Student scanner: http://localhost:3000/student"
echo
echo "Press Ctrl+C to stop the server"
echo

node server.js
