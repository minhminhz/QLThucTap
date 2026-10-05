const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vymi_internship',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+07:00'
});

// Test connection
pool.getConnection()
    .then((conn) => {
        console.log(`[Database] MySQL connected successfully to database: ${process.env.DB_NAME || 'vymi_internship'}`);
        conn.release();
    })
    .catch((err) => {
        console.error('[Database] MySQL connection error:', err.message);
    });

module.exports = pool;
