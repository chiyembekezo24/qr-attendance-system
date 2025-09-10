// Global variables
let stream = null;
let video = null;
let currentFacingMode = 'environment';
let isScanning = false;
let scanInterval = null;
let currentQRData = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Initialize application
function initializeApp() {
    // Check if device supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showCameraError('Camera not supported on this device');
        return;
    }
    
    // Check for HTTPS (required for camera access)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        showCameraError('Camera access requires HTTPS. Please use a secure connection.');
        return;
    }
    
    // Show QR required section by default
    showSection('qrRequiredSection');
}

// Setup event listeners
function setupEventListeners() {
    // QR Required section buttons
    document.getElementById('startCameraBtn').addEventListener('click', () => showSection('scannerSection'));
    document.getElementById('manualEntryBtn').addEventListener('click', () => showSection('manualEntrySection'));
    
    // Scanner section buttons
    document.getElementById('startCameraBtn2').addEventListener('click', startCamera);
    document.getElementById('stopCameraBtn').addEventListener('click', stopCamera);
    document.getElementById('switchCameraBtn').addEventListener('click', switchCamera);
    document.getElementById('backToQRBtn').addEventListener('click', () => showSection('qrRequiredSection'));
    
    // Manual entry section buttons
    document.getElementById('backToQRBtn2').addEventListener('click', () => showSection('qrRequiredSection'));
    document.getElementById('manualEntryForm').addEventListener('submit', handleManualEntry);
    
    // Student info form
    document.getElementById('studentInfoForm').addEventListener('submit', handleStudentInfo);
    
    // Success/Error buttons
    document.getElementById('markAnotherBtn').addEventListener('click', resetToQRRequired);
    document.getElementById('tryAgainBtn').addEventListener('click', resetToQRRequired);
    
    // QR data input change
    document.getElementById('qrDataInput').addEventListener('input', handleQRDataInput);
}

// Start camera
async function startCamera() {
    try {
        showLoading('Starting camera...');
        
        const constraints = {
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Create video element
        video = document.createElement('video');
        video.id = 'scannerVideo';
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        
        // Replace placeholder with video
        const scannerArea = document.getElementById('scannerArea');
        scannerArea.innerHTML = '';
        scannerArea.appendChild(video);
        
        // Wait for video to load
        video.addEventListener('loadedmetadata', () => {
            video.play();
            startQRScanning();
            updateCameraControls(true);
            hideLoading();
        });
        
    } catch (error) {
        console.error('Camera error:', error);
        hideLoading();
        showCameraError(getCameraErrorMessage(error));
    }
}

// Stop camera
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    if (video) {
        video.remove();
        video = null;
    }
    
    stopQRScanning();
    updateCameraControls(false);
    
    // Restore placeholder
    const scannerArea = document.getElementById('scannerArea');
    scannerArea.innerHTML = `
        <div class="scanner-placeholder">
            <i class="fas fa-qrcode"></i>
            <p>Camera will appear here</p>
            <button id="startCameraBtn" class="btn btn-primary">
                <i class="fas fa-camera"></i> Start Camera
            </button>
        </div>
    `;
    
    // Re-attach event listener
    document.getElementById('startCameraBtn').addEventListener('click', startCamera);
}

// Switch camera
async function switchCamera() {
    if (!stream) return;
    
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    
    // Stop current stream
    stream.getTracks().forEach(track => track.stop());
    
    // Start new stream
    await startCamera();
}

// Update camera controls
function updateCameraControls(isActive) {
    const startBtn = document.getElementById('startCameraBtn');
    const stopBtn = document.getElementById('stopCameraBtn');
    const switchBtn = document.getElementById('switchCameraBtn');
    
    if (isActive) {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
        switchBtn.style.display = 'inline-flex';
    } else {
        startBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
        switchBtn.style.display = 'none';
    }
}

// Start QR scanning
function startQRScanning() {
    if (isScanning) return;
    
    isScanning = true;
    scanInterval = setInterval(scanForQR, 100); // Check every 100ms
}

// Stop QR scanning
function stopQRScanning() {
    isScanning = false;
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
}

// Scan for QR codes
function scanForQR() {
    if (!video || !isScanning) return;
    
    try {
        // Simple QR detection using canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // This is a simplified approach - in a real app, you'd use a QR library
        // For now, we'll simulate QR detection
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Check for QR-like patterns (simplified)
        if (detectQRPattern(imageData)) {
            // Simulate QR code detection
            const mockQRData = generateMockQRData();
            handleQRDetected(mockQRData);
        }
        
    } catch (error) {
        console.error('QR scanning error:', error);
    }
}

// Detect QR pattern (simplified)
function detectQRPattern(imageData) {
    // This is a very simplified QR detection
    // In a real app, you'd use a proper QR code library like jsQR
    const data = imageData.data;
    let darkPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness < 128) {
            darkPixels++;
        }
    }
    
    // Simple heuristic - if there are enough dark pixels, assume QR code
    return darkPixels > (data.length / 4) * 0.3;
}

// Handle manual QR code entry from clipboard or manual input
function handleManualQRInput(qrText) {
    try {
        // Try to parse the QR code data
        const parsedData = JSON.parse(qrText);
        handleQRDetected(parsedData);
    } catch (error) {
        // If it's not valid JSON, show error
        showError('Invalid QR code data. Please make sure you copied the complete QR code data.');
    }
}

// Generate mock QR data for testing
function generateMockQRData() {
    return JSON.stringify({
        courseId: 'mock-course-id',
        courseName: 'Computer Science 101',
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    });
}

// Handle QR detected
function handleQRDetected(qrData) {
    stopQRScanning();
    
    try {
        // Handle both raw JSON string and already parsed data
        let parsedData;
        if (typeof qrData === 'string') {
            parsedData = JSON.parse(qrData);
        } else {
            parsedData = qrData;
        }
        
        // Validate the QR data structure
        if (!parsedData.courseId || !parsedData.courseName) {
            throw new Error('Invalid QR code format');
        }
        
        // Check if QR code is expired
        if (parsedData.expiresAt && new Date() > new Date(parsedData.expiresAt)) {
            showError('QR code has expired. Please ask your instructor for a new one.');
            return;
        }
        
        currentQRData = parsedData;
        // Go directly to attendance form after QR scanning
        showSection('studentInfoSection');
    } catch (error) {
        console.error('Invalid QR data:', error);
        showError('Invalid QR code. Please make sure you scanned the correct QR code from your instructor.');
    }
}

// Show course information
function showCourseInfo(courseData) {
    const courseInfoSection = document.getElementById('courseInfoSection');
    const courseInfo = document.getElementById('courseInfo');
    
    courseInfo.innerHTML = `
        <h4>${courseData.courseName}</h4>
        <p><strong>Course ID:</strong> ${courseData.courseId}</p>
        <p><strong>Generated:</strong> ${new Date(courseData.timestamp).toLocaleString()}</p>
        <p><strong>Expires:</strong> ${new Date(courseData.expiresAt).toLocaleString()}</p>
    `;
    
    courseInfoSection.style.display = 'block';
}

// Handle manual entry
async function handleManualEntry(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const qrData = formData.get('qrData');
    
    if (!qrData) {
        showError('Please enter QR code data');
        return;
    }
    
    // Clean the QR data (remove any extra characters)
    const cleanQRData = qrData.trim();
    
    try {
        const parsedData = JSON.parse(cleanQRData);
        
        // Validate the QR data structure
        if (!parsedData.courseId || !parsedData.courseName) {
            throw new Error('Invalid QR code format');
        }
        
        // Check if QR code is expired
        if (parsedData.expiresAt && new Date() > new Date(parsedData.expiresAt)) {
            showError('QR code has expired. Please ask your instructor for a new one.');
            return;
        }
        
        currentQRData = parsedData;
        // Go directly to attendance form after manual entry
        showSection('studentInfoSection');
    } catch (error) {
        console.error('Invalid QR data:', error);
        showError('Invalid QR code data. Please make sure you copied the complete QR code data from your instructor.');
    }
}

// Handle student info form
async function handleStudentInfo(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const studentName = formData.get('studentName');
    const studentId = formData.get('studentId');
    
    if (!studentName || !studentId) {
        showError('Please fill in all fields');
        return;
    }
    
    if (!currentQRData) {
        showError('QR code data not found. Please scan or enter QR code again.');
        return;
    }
    
    try {
        showLoading('Marking attendance...');
        
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
                qrData: JSON.stringify(currentQRData),
                studentName,
                studentId,
                location
            })
        });
        
        hideLoading();
        showSuccess(result);
        
    } catch (error) {
        console.error('Failed to mark attendance:', error);
        hideLoading();
        showError(error.message || 'Failed to mark attendance. Please try again.');
    }
}

// Handle QR data input
function handleQRDataInput(e) {
    const qrData = e.target.value.trim();
    
    if (qrData) {
        try {
            const parsedData = JSON.parse(qrData);
            showCourseInfo(parsedData);
        } catch (error) {
            // Invalid JSON, ignore
        }
    }
}

// Show success
function showSuccess(result) {
    hideAllSections();
    
    const successSection = document.getElementById('successSection');
    const successMessage = document.getElementById('successMessage');
    const successDetails = document.getElementById('successDetails');
    
    successMessage.textContent = 'Your response has been recorded.';
    
    successDetails.innerHTML = `
        <div class="success-details-content">
            <h4>Attendance Confirmed</h4>
            <p><strong>Student:</strong> ${result.attendance?.studentName || 'N/A'}</p>
            <p><strong>Student ID:</strong> ${result.attendance?.studentIdNumber || 'N/A'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Status:</strong> Present</p>
        </div>
    `;
    
    successSection.style.display = 'block';
    successSection.scrollIntoView({ behavior: 'smooth' });
}

// Show error
function showError(message) {
    hideAllSections();
    
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    errorSection.scrollIntoView({ behavior: 'smooth' });
}

// Show camera error
function showCameraError(message) {
    const scannerArea = document.getElementById('scannerArea');
    scannerArea.innerHTML = `
        <div class="camera-permission">
            <i class="fas fa-camera-slash"></i>
            <h3>Camera Access Required</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-refresh"></i> Reload Page
            </button>
        </div>
    `;
}

// Hide all sections
function hideAllSections() {
    document.getElementById('scannerSection').style.display = 'none';
    document.getElementById('courseInfoSection').style.display = 'none';
    document.getElementById('successSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
}

// Show specific section
function showSection(sectionId) {
    hideAllSections();
    document.getElementById(sectionId).style.display = 'block';
    
    // If showing student info section, focus on name input
    if (sectionId === 'studentInfoSection') {
        setTimeout(() => {
            document.getElementById('studentName').focus();
        }, 100);
    }
}

// Hide all sections
function hideAllSections() {
    const sections = [
        'qrRequiredSection',
        'scannerSection', 
        'manualEntrySection',
        'studentInfoSection',
        'courseInfoSection',
        'successSection',
        'errorSection'
    ];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none';
        }
    });
}

// Reset to QR required
function resetToQRRequired() {
    hideAllSections();
    showSection('qrRequiredSection');
    
    // Reset forms
    document.getElementById('manualEntryForm').reset();
    document.getElementById('studentInfoForm').reset();
    document.getElementById('qrDataInput').readOnly = false;
    
    // Clear QR data
    currentQRData = null;
    
    // Stop camera if running
    if (stream) {
        stopCamera();
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
            { 
                timeout: 10000, 
                enableHighAccuracy: true,
                maximumAge: 60000 // Cache for 1 minute
            }
        );
    });
}

// API call function
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Show loading
function showLoading(message = 'Loading...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = loadingOverlay.querySelector('p');
    
    loadingText.textContent = message;
    loadingOverlay.style.display = 'flex';
}

// Hide loading
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Get camera error message
function getCameraErrorMessage(error) {
    switch (error.name) {
        case 'NotAllowedError':
            return 'Camera access denied. Please allow camera access and try again.';
        case 'NotFoundError':
            return 'No camera found on this device.';
        case 'NotReadableError':
            return 'Camera is already in use by another application.';
        case 'OverconstrainedError':
            return 'Camera constraints cannot be satisfied.';
        case 'SecurityError':
            return 'Camera access blocked due to security restrictions.';
        default:
            return 'Unable to access camera. Please check your permissions and try again.';
    }
}

// Utility function to show status messages
function showStatusMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.status-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `status-message ${type}`;
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

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, stop camera to save resources
        if (stream && isScanning) {
            stopCamera();
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});

// Export functions for global access
window.startCamera = startCamera;
window.stopCamera = stopCamera;
window.switchCamera = switchCamera;
window.resetToQRRequired = resetToQRRequired;
window.showSection = showSection;
