const pool = require('../backend/config/db');

async function run() {
    try {
        console.log('Running migration: add DECLINED to hiring_decision...');
        await pool.query(
            "ALTER TABLE interns MODIFY COLUMN hiring_decision ENUM('NONE','CONSIDERING','OFFERED','NOT_OFFERED','HIRED','REJECTED','DECLINED') DEFAULT 'NONE'"
        );
        console.log('OK: hiring_decision updated with DECLINED');

        try {
            await pool.query("ALTER TABLE interns ADD COLUMN hiring_decline_reason TEXT NULL");
            console.log('OK: hiring_decline_reason added');
        } catch (e) {
            console.log('Column hiring_decline_reason exists or skipped:', e.message);
        }

        try {
            await pool.query("ALTER TABLE interns ADD COLUMN hiring_declined_at TIMESTAMP NULL");
            console.log('OK: hiring_declined_at added');
        } catch (e) {
            console.log('Column hiring_declined_at exists or skipped:', e.message);
        }

        console.log('Migration finished successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();
