# Efficient and Effective Class Attendance QR Code System

A comprehensive QR code-based attendance system that allows lecturers to generate QR codes for courses and students to scan them to mark their attendance automatically.

## Features

### For Lecturers/Instructors
- **Course Management**: Create and manage courses with instructor details, schedules, and descriptions
- **QR Code Generation**: Generate time-limited QR codes for attendance sessions
- **Real-time Monitoring**: View attendance in real-time as students scan QR codes
- **Attendance Reports**: Generate detailed attendance reports with CSV download functionality
- **Student Management**: Add students manually or let them self-register
- **Dashboard Analytics**: View attendance statistics and recent activity

### For Students
- **QR Code Scanning**: Scan QR codes using mobile camera or manual entry
- **Self-Registration**: Students can register themselves by providing name and student ID
- **Location Tracking**: Automatic location capture when marking attendance
- **Mobile-Friendly**: Optimized interface for mobile devices
- **No Email Required**: Students only need to provide name and student ID

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **QR Code**: qrcode library
- **Styling**: Custom CSS with modern design
- **Icons**: Font Awesome

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qr-attendance-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/qr-attendance
   PORT=3000
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system. For local development:
   ```bash
   mongod
   ```

5. **Start the application**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Main interface: `http://localhost:3000`
   - Student scanner: `http://localhost:3000/student`

## Usage

### For Lecturers

1. **Add Courses**
   - Navigate to the "Courses" tab
   - Click "Add Course" and fill in course details
   - Include instructor name, schedule, and description

2. **Generate QR Codes**
   - Go to "Attendance" tab
   - Click "Generate QR Code"
   - Select a course and generate the QR code
   - Display the QR code to students (QR codes expire after 5 minutes by default)

3. **Monitor Attendance**
   - View real-time attendance in the "Attendance" tab
   - See who's present/absent for each course
   - Download attendance reports as CSV files

4. **View Reports**
   - Use the "Reports" tab to generate attendance reports
   - Filter by date and course
   - Download individual or all reports

### For Students

1. **Access Student Scanner**
   - Open `http://localhost:3000/student` on your mobile device
   - Allow camera permissions when prompted

2. **Scan QR Code**
   - Point your camera at the QR code displayed by the instructor
   - The system will automatically detect and process the QR code

3. **Manual Entry** (if camera doesn't work)
   - Use the manual entry form
   - Paste the QR code data provided by the instructor
   - Enter your name and student ID

4. **Mark Attendance**
   - Fill in your details (name and student ID)
   - The system will automatically capture your location
   - Click "Mark Attendance" to complete the process

## API Endpoints

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create new student

### Attendance
- `POST /api/generate-qr` - Generate QR code for course
- `POST /api/mark-attendance` - Mark student attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/:courseId` - Get attendance for specific course
- `GET /api/attendance/:courseId/download` - Download attendance CSV

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Database Schema

### Course
```javascript
{
  name: String,
  instructor: String,
  schedule: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Student
```javascript
{
  name: String,
  studentId: String (unique),
  email: String,
  enrolledCourses: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### Attendance
```javascript
{
  courseId: ObjectId,
  studentId: ObjectId,
  studentName: String,
  studentIdNumber: String,
  date: String,
  time: String,
  location: String,
  status: String (present/absent),
  createdAt: Date
}
```

## Features in Detail

### QR Code System
- QR codes contain course information and expiration time
- Default expiration: 5 minutes (configurable)
- Automatic validation of QR code expiry
- Secure JSON data encoding

### Location Tracking
- Automatic GPS location capture when students mark attendance
- Fallback to "Not provided" if location access is denied
- Location data stored with attendance records

### CSV Export
- Download attendance reports in CSV format
- Includes student details, course information, timestamps, and location
- Filterable by date and course

### Mobile Optimization
- Responsive design for mobile devices
- Touch-friendly interface
- Camera integration for QR scanning
- Offline-capable with service worker (future enhancement)

## Security Considerations

- QR codes have expiration times to prevent reuse
- Location tracking is optional and requires user permission
- No sensitive data stored in QR codes
- Input validation on all forms
- CORS enabled for cross-origin requests

## Troubleshooting

### Common Issues

1. **Camera not working**
   - Ensure HTTPS is enabled (required for camera access)
   - Check browser permissions
   - Try manual entry as fallback

2. **MongoDB connection issues**
   - Verify MongoDB is running
   - Check connection string in `.env` file
   - Ensure database exists

3. **QR code not scanning**
   - Ensure QR code is not expired
   - Check camera focus and lighting
   - Try manual entry method

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Development

### Project Structure
```
qr-attendance-system/
├── models/           # MongoDB models
├── public/           # Static files
├── server.js         # Express server
├── index.html        # Main interface
├── student.html      # Student scanner
├── styles.css        # Main styles
├── student-styles.css # Student page styles
├── script.js         # Main JavaScript
├── student-script.js # Student page JavaScript
└── package.json      # Dependencies
```

### Adding New Features
1. Create API endpoints in `server.js`
2. Update frontend JavaScript in `script.js` or `student-script.js`
3. Add UI components in HTML files
4. Style with CSS

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed description

---

**Note**: This system is designed for educational purposes. For production use, consider additional security measures and user authentication.
