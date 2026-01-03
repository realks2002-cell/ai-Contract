const { Pool } = require('pg');
require('dotenv').config();

async function setTimezone() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Current timezone:');
        const cur = await pool.query('SHOW timezone');
        console.table(cur.rows);

        console.log('Setting database timezone to Asia/Seoul...');
        // This sets it for the current database for all new sessions
        await pool.query("ALTER DATABASE postgres SET timezone TO 'Asia/Seoul'");

        console.log('Verifying in new session...');
        const verify = await pool.query('SHOW timezone');
        console.table(verify.rows);

        console.log('Timezone updated successfully.');
    } catch (err) {
        console.error('Error setting timezone:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

setTimezone();
