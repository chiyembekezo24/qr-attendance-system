const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const QRCode = require('qrcode');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const moment = require('moment');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Log environment info
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', PORT);
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Connected' : 'Not configured');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qr-attendance', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Models
const Course = require('./models/Course');
const Student = require('./models/Student');
const Attendance = require('./models/Attendance');

// Routes

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new course
app.post('/api/courses', async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new student
app.post('/api/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate QR Code for course
app.post('/api/generate-qr', async (req, res) => {
  try {
    const { courseId, duration = 5 } = req.body;
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const qrData = {
      courseId: course._id,
      courseName: course.name,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + duration * 60 * 1000) // 5 minutes default
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
    
    res.json({
      qrCode: qrCodeDataURL,
      course: course,
      expiresAt: qrData.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark attendance
app.post('/api/mark-attendance', async (req, res) => {
  try {
    const { qrData, studentName, studentId, location } = req.body;
    
    let parsedQRData;
    try {
      parsedQRData = JSON.parse(qrData);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid QR code data' });
    }

    // Check if QR code is expired
    if (new Date() > new Date(parsedQRData.expiresAt)) {
      return res.status(400).json({ error: 'QR code has expired' });
    }

    // Find or create student
    let student = await Student.findOne({ studentId });
    if (!student) {
      student = new Student({
        name: studentName,
        studentId: studentId,
        email: `${studentId}@student.local` // Placeholder email
      });
      await student.save();
    }

    // Check if already marked attendance for this session
    const existingAttendance = await Attendance.findOne({
      courseId: parsedQRData.courseId,
      studentId: student._id,
      date: moment().format('YYYY-MM-DD')
    });

    if (existingAttendance) {
      return res.status(400).json({ error: 'Attendance already marked for this session' });
    }

    // Create attendance record
    const attendance = new Attendance({
      courseId: parsedQRData.courseId,
      studentId: student._id,
      studentName: studentName,
      studentIdNumber: studentId,
      date: moment().format('YYYY-MM-DD'),
      time: moment().format('HH:mm:ss'),
      location: location || 'Not provided',
      status: 'present'
    });

    await attendance.save();

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      attendance: attendance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance for a course
app.get('/api/attendance/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;
    
    const query = { courseId };
    if (date) {
      query.date = date;
    }

    const attendance = await Attendance.find(query).populate('studentId', 'name studentId email');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all attendance records
app.get('/api/attendance', async (req, res) => {
  try {
    const { date, courseId } = req.query;
    const query = {};
    
    if (date) query.date = date;
    if (courseId) query.courseId = courseId;

    const attendance = await Attendance.find(query)
      .populate('courseId', 'name instructor')
      .populate('studentId', 'name studentId email')
      .sort({ date: -1, time: -1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download attendance as CSV
app.get('/api/attendance/:courseId/download', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;
    
    const query = { courseId };
    if (date) query.date = date;

    const attendance = await Attendance.find(query)
      .populate('courseId', 'name instructor')
      .populate('studentId', 'name studentId email')
      .sort({ time: 1 });

    const course = await Course.findById(courseId);
    const filename = `${course.name.replace(/\s+/g, '_')}_attendance_${date || moment().format('YYYY-MM-DD')}.csv`;

    const csvData = attendance.map(record => ({
      'Student Name': record.studentName,
      'Student ID': record.studentIdNumber,
      'Course': course.name,
      'Instructor': course.instructor,
      'Date': record.date,
      'Time': record.time,
      'Status': record.status,
      'Location': record.location
    }));

    const csvWriter = createCsvWriter({
      path: path.join(__dirname, 'temp', filename),
      header: [
        { id: 'Student Name', title: 'Student Name' },
        { id: 'Student ID', title: 'Student ID' },
        { id: 'Course', title: 'Course' },
        { id: 'Instructor', title: 'Instructor' },
        { id: 'Date', title: 'Date' },
        { id: 'Time', title: 'Time' },
        { id: 'Status', title: 'Status' },
        { id: 'Location', title: 'Location' }
      ]
    });

    await csvWriter.writeRecords(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.download(path.join(__dirname, 'temp', filename), filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Clean up temp file
      const fs = require('fs');
      fs.unlinkSync(path.join(__dirname, 'temp', filename));
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard statistics
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    const totalStudents = await Student.countDocuments();
    const todayAttendance = await Attendance.countDocuments({
      date: moment().format('YYYY-MM-DD')
    });
    
    // Calculate average attendance percentage
    const totalAttendanceRecords = await Attendance.countDocuments();
    const uniqueStudents = await Student.countDocuments();
    const avgAttendance = uniqueStudents > 0 ? Math.round((totalAttendanceRecords / uniqueStudents) * 100) : 0;

    res.json({
      totalCourses,
      totalStudents,
      todayAttendance,
      avgAttendance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve student scanner page
app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'student.html'));
});

// Create temp directory if it doesn't exist
const fs = require('fs');
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for the main interface`);
  console.log(`Visit http://localhost:${PORT}/student for the student scanner`);
});
