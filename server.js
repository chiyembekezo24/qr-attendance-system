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
app.use(express.static('public'));

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
      instructor: course.instructor,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + duration * 60 * 1000) // 5 minutes default
    };

    // Create a URL that redirects to student page with QR data
    const baseUrl = req.protocol + '://' + req.get('host');
    const qrUrl = `${baseUrl}/student?data=${encodeURIComponent(JSON.stringify(qrData))}`;
    
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl);
    
    res.json({
      qrCode: qrCodeDataURL,
      qrUrl: qrUrl,
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

// Get attendance session report
app.get('/api/attendance/:courseId/session-report', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;
    
    const query = { courseId };
    if (date) query.date = date;

    const attendance = await Attendance.find(query)
      .populate('courseId', 'name instructor')
      .sort({ time: 1 });

    const course = await Course.findById(courseId);
    
    // Calculate session statistics
    const totalStudents = attendance.length;
    const presentStudents = attendance.filter(record => record.status === 'Present').length;
    const absentStudents = totalStudents - presentStudents;
    const attendanceRate = totalStudents > 0 ? ((presentStudents / totalStudents) * 100).toFixed(1) : 0;
    
    // Get unique students who attended
    const uniqueStudents = [...new Set(attendance.map(record => record.studentIdNumber))];
    const uniquePresentCount = uniqueStudents.length;
    
    // Get time range
    const times = attendance.map(record => record.time).sort();
    const firstAttendance = times[0] || 'N/A';
    const lastAttendance = times[times.length - 1] || 'N/A';
    
    const sessionReport = {
      course: {
        name: course.name,
        instructor: course.instructor,
        date: date || moment().format('YYYY-MM-DD')
      },
      statistics: {
        totalStudents: totalStudents,
        presentStudents: presentStudents,
        absentStudents: absentStudents,
        attendanceRate: attendanceRate + '%',
        uniqueStudents: uniquePresentCount,
        firstAttendance: firstAttendance,
        lastAttendance: lastAttendance
      },
      attendance: attendance.map(record => ({
        studentName: record.studentName,
        studentId: record.studentIdNumber,
        time: record.time,
        status: record.status,
        location: record.location
      }))
    };

    res.json(sessionReport);
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

// Get recent activity
app.get('/api/recent-activity', async (req, res) => {
  try {
    const activities = [];
    
    // Get recent courses (last 3)
    const recentCourses = await Course.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name instructor createdAt');
    
    recentCourses.forEach(course => {
      activities.push({
        type: 'course_created',
        icon: 'fas fa-book',
        title: 'New course added',
        description: `${course.name} by ${course.instructor}`,
        timestamp: course.createdAt,
        time: moment(course.createdAt).fromNow()
      });
    });
    
    // Get recent students (last 3)
    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name studentId createdAt');
    
    recentStudents.forEach(student => {
      activities.push({
        type: 'student_added',
        icon: 'fas fa-user-plus',
        title: 'New student added',
        description: `${student.name} (ID: ${student.studentId})`,
        timestamp: student.createdAt,
        time: moment(student.createdAt).fromNow()
      });
    });
    
    // Get recent attendance records (last 5)
    const recentAttendance = await Attendance.find()
      .populate('courseId', 'name')
      .sort({ timestamp: -1 })
      .limit(5)
      .select('studentName studentIdNumber status courseId timestamp');
    
    recentAttendance.forEach(attendance => {
      activities.push({
        type: 'attendance_marked',
        icon: attendance.status === 'Present' ? 'fas fa-check-circle' : 'fas fa-times-circle',
        title: 'Attendance marked',
        description: `${attendance.studentName} marked ${attendance.status.toLowerCase()} for ${attendance.courseId.name}`,
        timestamp: attendance.timestamp,
        time: moment(attendance.timestamp).fromNow()
      });
    });
    
    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Return only the 10 most recent activities
    res.json(activities.slice(0, 10));
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
