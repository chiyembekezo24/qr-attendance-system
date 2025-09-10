#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up QR Attendance System...\n');

// Check if Node.js is installed
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
    console.error('❌ Node.js is not installed. Please install Node.js first.');
    process.exit(1);
}

// Check if npm is installed
try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm version: ${npmVersion}`);
} catch (error) {
    console.error('❌ npm is not installed. Please install npm first.');
    process.exit(1);
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
} catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ Created .env file from template');
    } else {
        // Create basic .env file
        const envContent = `# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/qr-attendance

# Server Configuration
PORT=3000
`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Created .env file with default settings');
    }
} else {
    console.log('✅ .env file already exists');
}

// Create temp directory for CSV downloads
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
    console.log('✅ Created temp directory for CSV downloads');
}

// Check if MongoDB is running
console.log('\n🔍 Checking MongoDB connection...');
try {
    execSync('mongosh --eval "db.runCommand({ping: 1})" --quiet', { stdio: 'pipe' });
    console.log('✅ MongoDB is running');
} catch (error) {
    console.log('⚠️  MongoDB is not running. Please start MongoDB before running the application.');
    console.log('   On Windows: Start MongoDB service or run "mongod"');
    console.log('   On macOS: brew services start mongodb-community');
    console.log('   On Linux: sudo systemctl start mongod');
}

console.log('\n🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Make sure MongoDB is running');
console.log('2. Start the application: npm start');
console.log('3. Open http://localhost:3000 in your browser');
console.log('4. For student scanner: http://localhost:3000/student');
console.log('\n📚 See README.md for detailed usage instructions');

console.log('\n🔧 Configuration:');
console.log('- Edit .env file to change MongoDB connection or port');
console.log('- Default MongoDB URI: mongodb://localhost:27017/qr-attendance');
console.log('- Default port: 3000');
