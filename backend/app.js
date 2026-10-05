const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Middlewares
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes');
const positionRoutes = require('./routes/positionRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const cvRoutes = require('./routes/cvRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const hrRoutes = require('./routes/hrRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const internRoutes = require('./routes/internRoutes');
const taskRoutes = require('./routes/taskRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 1. Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Request Logger Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// 3. Static Files (CV uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. API Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'VYMI Tech Internship API is running normally.',
        timestamp: new Date()
    });
});

// 5. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/intern', internRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);

// 6. Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
