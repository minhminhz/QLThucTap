// Catch synchronous uncaught exceptions at the top level
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception detected! ->', err.name, err.message);
    console.error(err.stack);
});

const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  VYMI Tech Internship Management System - Backend API  `);
    console.log(`  Server running on: http://localhost:${PORT}          `);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
});

// Catch asynchronous unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('CRITICAL: Unhandled Promise Rejection detected! ->', err);
});

// Graceful shutdown on termination signals
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing HTTP server gracefully...');
    server.close(() => {
        console.log('HTTP server closed.');
        pool.end();
    });
});
