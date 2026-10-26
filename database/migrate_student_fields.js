const mysql = require('../backend/node_modules/mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: 'localhost', port: 3306, user: 'root',
        password: '123456a@', database: 'vymi_internship'
    });

    const queries = [
        "ALTER TABLE interns ADD COLUMN custom_intern_name VARCHAR(255) NULL",
        "ALTER TABLE interns ADD COLUMN student_dob VARCHAR(20) NULL",
        "ALTER TABLE interns ADD COLUMN student_gender VARCHAR(10) DEFAULT 'Nam'",
        "ALTER TABLE interns ADD COLUMN student_phone VARCHAR(20) NULL",
        "ALTER TABLE interns ADD COLUMN student_address TEXT NULL",
        "ALTER TABLE interns ADD COLUMN faculty_name VARCHAR(255) NULL",
        "ALTER TABLE interns ADD COLUMN university_class VARCHAR(100) NULL",
        "ALTER TABLE interns ADD COLUMN major_name VARCHAR(255) NULL",
        "ALTER TABLE interns ADD COLUMN academic_year VARCHAR(50) NULL",
        "ALTER TABLE interns ADD COLUMN evaluation_advantages TEXT NULL",
        "ALTER TABLE interns ADD COLUMN evaluation_limitations TEXT NULL",
        "ALTER TABLE interns ADD COLUMN score_discipline DECIMAL(3,1) NULL",
        "ALTER TABLE interns ADD COLUMN score_competence DECIMAL(3,1) NULL",
        "ALTER TABLE interns ADD COLUMN score_skills DECIMAL(3,1) NULL",
        "ALTER TABLE interns ADD COLUMN hr_confirmed_by_name VARCHAR(255) NULL",
        "ALTER TABLE interns ADD COLUMN deal_meeting_time DATETIME NULL",
        "ALTER TABLE interns ADD COLUMN deal_meeting_type ENUM('OFFLINE','ONLINE') DEFAULT 'OFFLINE'",
        "ALTER TABLE interns ADD COLUMN deal_meeting_location VARCHAR(500) NULL",
        "ALTER TABLE interns ADD COLUMN deal_meeting_note TEXT NULL",
        "ALTER TABLE interns ADD COLUMN deal_meeting_status ENUM('NONE','PENDING_INTERN','PENDING_HR','CONFIRMED','COMPLETED','CANCELLED') DEFAULT 'NONE'",
        "ALTER TABLE interns MODIFY COLUMN certificate_status ENUM('NONE','REQUESTED','PENDING','APPROVED','REJECTED') DEFAULT 'NONE'",
        "ALTER TABLE interns MODIFY COLUMN hiring_decision ENUM('NONE','CONSIDERING','OFFERED','NOT_OFFERED','HIRED','REJECTED') DEFAULT 'NONE'"
    ];

    for (const q of queries) {
        try {
            await pool.query(q);
            const parts = q.split(' ');
            const name = parts[5] || parts[4];
            console.log('  OK:', name);
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('  SKIP (exists):', q.split(' ')[5]);
            } else {
                console.log('  INFO:', err.message.substring(0, 90));
            }
        }
    }

    console.log('Migration done!');
    await pool.end();
    process.exit(0);
}

run();
