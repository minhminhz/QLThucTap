const pool = require('../backend/config/db');

async function migrate() {
    try {
        console.log('Starting migration for internship completion workflow...');

        const columns = [
            `ALTER TABLE interns ADD COLUMN rating DECIMAL(3,1) NULL`,
            `ALTER TABLE interns ADD COLUMN final_review TEXT NULL`,
            `ALTER TABLE interns ADD COLUMN mentor_recommendation ENUM('PASS', 'FAIL') DEFAULT 'PASS'`,
            `ALTER TABLE interns ADD COLUMN mentor_offer_recommendation TINYINT(1) DEFAULT 0`,
            `ALTER TABLE interns ADD COLUMN mentor_evaluated_at TIMESTAMP NULL`,
            `ALTER TABLE interns ADD COLUMN hr_result ENUM('NONE', 'PASSED', 'FAILED') DEFAULT 'NONE'`,
            `ALTER TABLE interns ADD COLUMN hr_review TEXT NULL`,
            `ALTER TABLE interns ADD COLUMN hr_confirmed_at TIMESTAMP NULL`,
            `ALTER TABLE interns ADD COLUMN hr_confirmed_by INT NULL`,
            `ALTER TABLE interns ADD COLUMN hiring_decision ENUM('NONE', 'CONSIDERING', 'OFFERED', 'HIRED', 'REJECTED') DEFAULT 'NONE'`,
            `ALTER TABLE interns ADD COLUMN hiring_note TEXT NULL`,
            `ALTER TABLE interns ADD COLUMN certificate_status ENUM('NONE', 'REQUESTED', 'APPROVED', 'REJECTED') DEFAULT 'NONE'`,
            `ALTER TABLE interns ADD COLUMN certificate_code VARCHAR(50) NULL`,
            `ALTER TABLE interns ADD COLUMN certificate_request_note TEXT NULL`,
            `ALTER TABLE interns ADD COLUMN certificate_requested_at TIMESTAMP NULL`,
            `ALTER TABLE interns ADD COLUMN certificate_approved_at TIMESTAMP NULL`,
            `ALTER TABLE interns ADD COLUMN certificate_approved_by INT NULL`,
            `ALTER TABLE interns ADD COLUMN certificate_rejection_reason TEXT NULL`,
            `ALTER TABLE interns ADD COLUMN school_name VARCHAR(255) NULL`,
            `ALTER TABLE interns ADD COLUMN student_code VARCHAR(50) NULL`
        ];

        for (const query of columns) {
            try {
                await pool.query(query);
                console.log('Added column successfully:', query);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping:', query.split(' ')[4]);
                } else {
                    console.error('Error executing query:', query, err.message);
                }
            }
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
