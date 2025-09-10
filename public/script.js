// Global variables
let courses = [];
let students = [];
let attendance = [];
let currentQRCode = null;
let qrTimer = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDashboardData();
});

// Initialize application
function initializeApp() {
    // Set up tab navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Set today's date in date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDate').value = today;
    document.getElementById('percentageDate').value = today;

    // Load initial data
    loadCourses();
    loadStudents();
    loadAttendance();
}

// Setup event listeners
function setupEventListeners() {
    // Form submissions
    document.getElementById('addCourseForm').addEventListener('submit', handleAddCourse);
    document.getElementById('addStudentForm').addEventListener('submit', handleAddStudent);
    document.getElementById('generateQRForm').addEventListener('submit', handleGenerateQR);
    document.getElementById('scanQRForm').addEventListener('submit', handleScanQR);

    // Modal close events
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

// Tab switching
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    console.log('Tab switched successfully to:', tabName);

    // Load data for specific tabs
    if (tabName === 'courses') {
        loadCourses();
    } else if (tabName === 'students') {
        loadStudents();
    } else if (tabName === 'attendance') {
        loadAttendance();
    } else if (tabName === 'reports') {
        loadReports();
    }
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showMessage('An error occurred. Please try again.', 'error');
        throw error;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const data = await apiCall('/api/dashboard');
        
        document.getElementById('totalCourses').textContent = data.totalCourses;
        document.getElementById('totalStudents').textContent = data.totalStudents;
        document.getElementById('todayAttendance').textContent = data.todayAttendance;
        document.getElementById('avgAttendance').textContent = data.avgAttendance + '%';
        
        loadRecentActivity();
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

// Load courses
async function loadCourses() {
    try {
        courses = await apiCall('/api/courses');
        displayCourses();
        populateCourseSelects();
    } catch (error) {
        console.error('Failed to load courses:', error);
    }
}

// Display courses
function displayCourses() {
    const container = document.getElementById('coursesList');
    
    if (courses.length === 0) {
        container.innerHTML = '<p class="no-data">No courses available</p>';
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="card">
            <h3>${course.name}</h3>
            <p><strong>Instructor:</strong> ${course.instructor}</p>
            <p><strong>Schedule:</strong> ${course.schedule || 'Not specified'}</p>
            <p><strong>Description:</strong> ${course.description || 'No description'}</p>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="generateQRForCourse('${course._id}')">
                    <i class="fas fa-qrcode"></i> Generate QR
                </button>
                <button class="btn btn-secondary" onclick="viewCourseAttendance('${course._id}')">
                    <i class="fas fa-eye"></i> View Attendance
                </button>
            </div>
        </div>
    `).join('');
}

// Load students
async function loadStudents() {
    try {
        students = await apiCall('/api/students');
        displayStudents();
        populateStudentSelects();
    } catch (error) {
        console.error('Failed to load students:', error);
    }
}

// Display students
function displayStudents() {
    const container = document.getElementById('studentsList');
    
    if (students.length === 0) {
        container.innerHTML = '<p class="no-data">No students available</p>';
        return;
    }

    container.innerHTML = students.map(student => `
        <div class="card">
            <h3>${student.name}</h3>
            <p><strong>Student ID:</strong> ${student.studentId}</p>
            <p><strong>Email:</strong> ${student.email}</p>
            <p><strong>Enrolled Courses:</strong> ${student.enrolledCourses ? student.enrolledCourses.length : 0}</p>
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="viewStudentAttendance('${student._id}')">
                    <i class="fas fa-chart-line"></i> View Attendance
                </button>
            </div>
        </div>
    `).join('');
}

// Load attendance
async function loadAttendance() {
    try {
        attendance = await apiCall('/api/attendance');
        displayAttendance();
    } catch (error) {
        console.error('Failed to load attendance:', error);
    }
}

// Display attendance
function displayAttendance() {
    const container = document.getElementById('attendanceList');
    
    if (attendance.length === 0) {
        container.innerHTML = '<p class="no-data">No attendance records available</p>';
        return;
    }

    // Group attendance by course and date
    const groupedAttendance = groupAttendanceByCourse(attendance);
    
    container.innerHTML = Object.entries(groupedAttendance).map(([courseId, courseData]) => `
        <div class="attendance-card">
            <h3>${courseData.courseName}</h3>
            <div class="attendance-stats">
                <div class="stat-item">
                    <h4>${courseData.totalStudents}</h4>
                    <p>Total Students</p>
                </div>
                <div class="stat-item">
                    <h4>${courseData.presentCount}</h4>
                    <p>Present</p>
                </div>
                <div class="stat-item">
                    <h4>${courseData.absentCount}</h4>
                    <p>Absent</p>
                </div>
                <div class="stat-item">
                    <h4>${courseData.attendancePercentage}%</h4>
                    <p>Attendance Rate</p>
                </div>
            </div>
            <div class="attendance-list">
                ${courseData.records.map(record => `
                    <div class="attendance-item ${record.status}">
                        <div class="student-info">
                            <h4>${record.studentName}</h4>
                            <p>ID: ${record.studentIdNumber} | Time: ${record.time}</p>
                        </div>
                        <div class="attendance-status ${record.status}">
                            ${record.status.toUpperCase()}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="card-actions" style="margin-top: 15px;">
                <button class="btn btn-primary" onclick="downloadAttendanceCSV('${courseId}', '${courseData.date}')">
                    <i class="fas fa-download"></i> Download CSV
                </button>
            </div>
        </div>
    `).join('');
}

// Group attendance by course
function groupAttendanceByCourse(attendanceRecords) {
    const grouped = {};
    
    attendanceRecords.forEach(record => {
        const courseId = record.courseId._id || record.courseId;
        const courseName = record.courseId.name || 'Unknown Course';
        const date = record.date;
        
        if (!grouped[courseId]) {
            grouped[courseId] = {
                courseName,
                date,
                records: [],
                totalStudents: 0,
                presentCount: 0,
                absentCount: 0,
                attendancePercentage: 0
            };
        }
        
        grouped[courseId].records.push(record);
        grouped[courseId].totalStudents++;
        
        if (record.status === 'present') {
            grouped[courseId].presentCount++;
        } else {
            grouped[courseId].absentCount++;
        }
    });
    
    // Calculate attendance percentage
    Object.values(grouped).forEach(courseData => {
        courseData.attendancePercentage = Math.round(
            (courseData.presentCount / courseData.totalStudents) * 100
        );
    });
    
    return grouped;
}

// Populate course selects
function populateCourseSelects() {
    const selects = ['qrCourseSelect', 'enrolledCourses'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Choose a course...</option>' +
                courses.map(course => 
                    `<option value="${course._id}">${course.name} - ${course.instructor}</option>`
                ).join('');
        }
    });
}

// Populate student selects
function populateStudentSelects() {
    const select = document.getElementById('scanStudentSelect');
    if (select) {
        select.innerHTML = '<option value="">Choose a student...</option>' +
            students.map(student => 
                `<option value="${student._id}">${student.name} (${student.studentId})</option>`
            ).join('');
    }
}

// Handle add course
async function handleAddCourse(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const courseData = Object.fromEntries(formData);
    
    try {
        const course = await apiCall('/api/courses', {
            method: 'POST',
            body: JSON.stringify(courseData)
        });
        
        courses.push(course);
        displayCourses();
        populateCourseSelects();
        closeModal('addCourseModal');
        e.target.reset();
        showMessage('Course added successfully!', 'success');
        loadDashboardData();
    } catch (error) {
        console.error('Failed to add course:', error);
    }
}

// Handle add student
async function handleAddStudent(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const studentData = Object.fromEntries(formData);
    
    // Convert courseIds to array
    if (studentData.courseIds) {
        studentData.courseIds = Array.isArray(studentData.courseIds) 
            ? studentData.courseIds 
            : [studentData.courseIds];
    }
    
    try {
        const student = await apiCall('/api/students', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
        
        students.push(student);
        displayStudents();
        populateStudentSelects();
        closeModal('addStudentModal');
        e.target.reset();
        showMessage('Student added successfully!', 'success');
        loadDashboardData();
    } catch (error) {
        console.error('Failed to add student:', error);
    }
}

// Handle generate QR
async function handleGenerateQR(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const courseId = formData.get('courseId');
    
    if (!courseId) {
        showMessage('Please select a course', 'error');
        return;
    }
    
    try {
        const result = await apiCall('/api/generate-qr', {
            method: 'POST',
            body: JSON.stringify({ courseId })
        });
        
        currentQRCode = result;
        displayQRCode(result);
        startQRTimer(result.expiresAt);
        showMessage('QR Code generated successfully!', 'success');
    } catch (error) {
        console.error('Failed to generate QR code:', error);
    }
}

// Display QR code
function displayQRCode(qrData) {
    const qrDisplay = document.getElementById('qrCodeDisplay');
    const qrImage = document.getElementById('qrCodeImage');
    
    qrImage.innerHTML = `<img src="${qrData.qrCode}" alt="QR Code" />`;
    qrDisplay.style.display = 'block';
}

// Start QR timer
function startQRTimer(expiresAt) {
    if (qrTimer) {
        clearInterval(qrTimer);
    }
    
    const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const timeLeft = expiry - now;
        
        if (timeLeft <= 0) {
            document.getElementById('qrTimer').textContent = 'Expired';
            clearInterval(qrTimer);
            return;
        }
        
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        document.getElementById('qrTimer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    
    updateTimer();
    qrTimer = setInterval(updateTimer, 1000);
}

// Handle scan QR
async function handleScanQR(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const qrData = formData.get('qrData');
    const studentId = formData.get('studentId');
    
    if (!qrData || !studentId) {
        showMessage('Please provide both QR code data and select a student', 'error');
        return;
    }
    
    try {
        const student = students.find(s => s._id === studentId);
        if (!student) {
            showMessage('Student not found', 'error');
            return;
        }
        
        // Get location if available
        let location = 'Not provided';
        if (navigator.geolocation) {
            try {
                const position = await getCurrentPosition();
                location = `${position.coords.latitude}, ${position.coords.longitude}`;
            } catch (error) {
                console.warn('Location access denied or failed:', error);
            }
        }
        
        const result = await apiCall('/api/mark-attendance', {
            method: 'POST',
            body: JSON.stringify({
                qrData,
                studentName: student.name,
                studentId: student.studentId,
                location
            })
        });
        
        showMessage('Attendance marked successfully!', 'success');
        closeModal('scanQRModal');
        e.target.reset();
        loadAttendance();
        loadDashboardData();
    } catch (error) {
        console.error('Failed to mark attendance:', error);
    }
}

// Get current position with timeout
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { timeout: 10000, enableHighAccuracy: true }
        );
    });
}

// Generate QR for specific course
function generateQRForCourse(courseId) {
    const course = courses.find(c => c._id === courseId);
    if (course) {
        document.getElementById('qrCourseSelect').value = courseId;
        showModal('generateQRModal');
    }
}

// View course attendance
function viewCourseAttendance(courseId) {
    // Switch to attendance tab and filter by course
    switchTab('attendance');
    // You could add filtering logic here
}

// View student attendance
function viewStudentAttendance(studentId) {
    // Switch to reports tab and filter by student
    switchTab('reports');
    // You could add filtering logic here
}

// Download attendance CSV
async function downloadAttendanceCSV(courseId, date) {
    try {
        const url = `/api/attendance/${courseId}/download?date=${date}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_${date}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showMessage('CSV download started!', 'success');
    } catch (error) {
        console.error('Failed to download CSV:', error);
        showMessage('Failed to download CSV', 'error');
    }
}

// Load reports
async function loadReports() {
    const date = document.getElementById('reportDate').value;
    if (!date) return;
    
    try {
        const reports = await apiCall(`/api/attendance?date=${date}`);
        displayReports(reports);
    } catch (error) {
        console.error('Failed to load reports:', error);
    }
}

// Display reports
function displayReports(reports) {
    const container = document.getElementById('reportsContainer');
    
    if (reports.length === 0) {
        container.innerHTML = '<p class="no-data">No attendance records for this date</p>';
        return;
    }
    
    const groupedReports = groupAttendanceByCourse(reports);
    
    container.innerHTML = Object.entries(groupedReports).map(([courseId, courseData]) => `
        <div class="report-card">
            <h3>${courseData.courseName}</h3>
            <p><strong>Date:</strong> ${courseData.date}</p>
            <div class="attendance-stats">
                <div class="stat-item">
                    <h4>${courseData.totalStudents}</h4>
                    <p>Total Students</p>
                </div>
                <div class="stat-item">
                    <h4>${courseData.presentCount}</h4>
                    <p>Present</p>
                </div>
                <div class="stat-item">
                    <h4>${courseData.absentCount}</h4>
                    <p>Absent</p>
                </div>
                <div class="stat-item">
                    <h4>${courseData.attendancePercentage}%</h4>
                    <p>Attendance Rate</p>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="downloadAttendanceCSV('${courseId}', '${courseData.date}')">
                    <i class="fas fa-download"></i> Download CSV
                </button>
            </div>
        </div>
    `).join('');
}

// Generate reports
function generateReports() {
    loadReports();
}

// Download all reports
async function downloadAllReports() {
    const date = document.getElementById('reportDate').value;
    if (!date) {
        showMessage('Please select a date first', 'error');
        return;
    }
    
    try {
        const reports = await apiCall(`/api/attendance?date=${date}`);
        const groupedReports = groupAttendanceByCourse(reports);
        
        // Download each course's CSV
        for (const [courseId, courseData] of Object.entries(groupedReports)) {
            await downloadAttendanceCSV(courseId, courseData.date);
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        showMessage('All reports downloaded!', 'success');
    } catch (error) {
        console.error('Failed to download all reports:', error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    
    // This would typically come from an API endpoint
    const activities = [
        {
            icon: 'fas fa-user-plus',
            title: 'New student registered',
            description: 'John Doe registered for Computer Science 101',
            time: '2 minutes ago'
        },
        {
            icon: 'fas fa-qrcode',
            title: 'QR Code generated',
            description: 'QR code generated for Mathematics 201',
            time: '15 minutes ago'
        },
        {
            icon: 'fas fa-check-circle',
            title: 'Attendance marked',
            description: '25 students marked present for Physics 101',
            time: '1 hour ago'
        }
    ];
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="no-data">No recent activity</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
}

// Load attendance percentages
async function loadAttendancePercentages() {
    const date = document.getElementById('percentageDate').value;
    if (!date) {
        showMessage('Please select a date first', 'error');
        return;
    }
    
    try {
        const attendance = await apiCall(`/api/attendance?date=${date}`);
        displayAttendancePercentages(attendance);
        
        // Show percentages container
        document.getElementById('attendancePercentagesContainer').style.display = 'block';
        document.getElementById('studentsList').style.display = 'none';
    } catch (error) {
        console.error('Failed to load attendance percentages:', error);
    }
}

// Display attendance percentages
function displayAttendancePercentages(attendanceRecords) {
    const container = document.getElementById('attendancePercentagesList');
    
    // Group by student
    const studentAttendance = {};
    
    attendanceRecords.forEach(record => {
        const studentId = record.studentId._id || record.studentId;
        const studentName = record.studentId.name || record.studentName;
        
        if (!studentAttendance[studentId]) {
            studentAttendance[studentId] = {
                name: studentName,
                presentCount: 0,
                totalCount: 0
            };
        }
        
        studentAttendance[studentId].totalCount++;
        if (record.status === 'present') {
            studentAttendance[studentId].presentCount++;
        }
    });
    
    const percentages = Object.values(studentAttendance).map(student => ({
        ...student,
        percentage: Math.round((student.presentCount / student.totalCount) * 100)
    })).sort((a, b) => b.percentage - a.percentage);
    
    if (percentages.length === 0) {
        container.innerHTML = '<p class="no-data">No attendance data for this date</p>';
        return;
    }
    
    container.innerHTML = percentages.map(student => `
        <div class="percentage-item">
            <div class="percentage-info">
                <h4>${student.name}</h4>
                <p>Present: ${student.presentCount}/${student.totalCount} sessions</p>
            </div>
            <div class="percentage-bar">
                <div class="percentage-fill" style="width: ${student.percentage}%"></div>
            </div>
            <div class="percentage-text">${student.percentage}%</div>
        </div>
    `).join('');
}

// Show students list
function showStudentsList() {
    document.getElementById('attendancePercentagesContainer').style.display = 'none';
    document.getElementById('studentsList').style.display = 'grid';
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset forms
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
    }
    
    // Hide QR display
    if (modalId === 'generateQRModal') {
        document.getElementById('qrCodeDisplay').style.display = 'none';
        if (qrTimer) {
            clearInterval(qrTimer);
        }
    }
}

// Show message
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(messageDiv, mainContent.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

function formatTime(time) {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString();
}

// Export functions for global access
window.showModal = showModal;
window.closeModal = closeModal;
window.switchTab = switchTab;
window.generateQRForCourse = generateQRForCourse;
window.viewCourseAttendance = viewCourseAttendance;
window.viewStudentAttendance = viewStudentAttendance;
window.downloadAttendanceCSV = downloadAttendanceCSV;
window.generateReports = generateReports;
window.downloadAllReports = downloadAllReports;
window.loadAttendancePercentages = loadAttendancePercentages;
window.showStudentsList = showStudentsList;
