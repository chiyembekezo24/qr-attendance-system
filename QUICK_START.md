# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start MongoDB
Make sure MongoDB is running on your system:
- **Windows**: Start MongoDB service or run `mongod`
- **macOS**: `brew services start mongodb-community`
- **Linux**: `sudo systemctl start mongod`

### 3. Start the Application
```bash
npm start
```

Or use the provided scripts:
- **Windows**: Double-click `start.bat`
- **Unix/Linux/macOS**: Run `./start.sh`

## 🌐 Access the System

- **Main Interface**: http://localhost:3000
- **Student Scanner**: http://localhost:3000/student

## 📱 How to Use

### For Lecturers:
1. Add courses in the "Courses" tab
2. Generate QR codes in the "Attendance" tab
3. Display QR code to students
4. Monitor attendance in real-time
5. Download reports as CSV files

### For Students:
1. Open the student scanner on your phone
2. Scan the QR code displayed by the instructor
3. Enter your name and student ID
4. Your attendance is automatically marked!

## 🔧 Configuration

Edit the `.env` file to change:
- MongoDB connection string
- Server port
- Other settings

## 📋 Features

✅ QR Code Generation & Scanning  
✅ Real-time Attendance Tracking  
✅ Location Tracking  
✅ CSV Report Downloads  
✅ Mobile-Friendly Interface  
✅ Student Self-Registration  
✅ Course Management  
✅ Attendance Analytics  

## 🆘 Need Help?

1. Check the full README.md for detailed instructions
2. Ensure MongoDB is running
3. Check browser console for errors
4. Verify all dependencies are installed

## 🎯 System Requirements

- Node.js 14+ 
- MongoDB 4.4+
- Modern web browser
- Camera access (for QR scanning)

---

**Ready to go!** 🎉
