const path = require('path');
require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv')).config({ path: path.join(__dirname, '..', 'backend', '.env') });
const pool = require('../backend/config/db');

async function migrate() {
    try {
        console.log('Starting migration for realistic evaluation template and deal job workflow...');

        const queries = [
            // Ensure certificate_status supports both PENDING and REQUESTED
            `ALTER TABLE interns MODIFY COLUMN certificate_status ENUM('NONE', 'REQUESTED', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'NONE'`,

            // Realistic evaluation sheet criteria
            `ALTER TABLE interns ADD COLUMN score_discipline DECIMAL(3,1) NULL COMMENT 'Ý thức kỷ luật (thang 2.0)'`,
            `ALTER TABLE interns ADD COLUMN score_competence DECIMAL(3,1) NULL COMMENT 'Năng lực chuyên môn (thang 5.0)'`,
            `ALTER TABLE interns ADD COLUMN score_skills DECIMAL(3,1) NULL COMMENT 'Kỹ năng mềm (thang 3.0)'`,
            `ALTER TABLE interns ADD COLUMN evaluation_advantages TEXT NULL COMMENT 'Ưu điểm nổi bật'`,
            `ALTER TABLE interns ADD COLUMN evaluation_limitations TEXT NULL COMMENT 'Điểm cần cải thiện'`,
            `ALTER TABLE interns ADD COLUMN academic_year VARCHAR(50) NULL COMMENT 'Khóa học'`,
            `ALTER TABLE interns ADD COLUMN university_class VARCHAR(100) NULL COMMENT 'Lớp sinh viên'`,
            `ALTER TABLE interns ADD COLUMN major_name VARCHAR(150) NULL COMMENT 'Chuyên ngành'`,

            // Deal Job Meeting negotiation between HR & Intern
            `ALTER TABLE interns ADD COLUMN deal_meeting_status ENUM('NONE', 'PENDING_HR', 'PENDING_INTERN', 'CONFIRMED', 'COMPLETED', 'CANCELLED') DEFAULT 'NONE'`,
            `ALTER TABLE interns ADD COLUMN deal_meeting_time DATETIME NULL`,
            `ALTER TABLE interns ADD COLUMN deal_meeting_type ENUM('OFFLINE', 'ONLINE') DEFAULT 'OFFLINE'`,
            `ALTER TABLE interns ADD COLUMN deal_meeting_location VARCHAR(255) NULL`,
            `ALTER TABLE interns ADD COLUMN deal_meeting_note TEXT NULL`,
            `ALTER TABLE interns ADD COLUMN deal_meeting_updated_by INT NULL`,
            `ALTER TABLE interns ADD COLUMN deal_meeting_updated_at TIMESTAMP NULL`
        ];

        for (const query of queries) {
            try {
                await pool.query(query);
                console.log('Successfully executed query:', query.slice(0, 60) + '...');
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Field already exists, skipping.');
                } else {
                    console.error('Error on query:', err.message);
                }
            }
        }

        console.log('Migration finished successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
