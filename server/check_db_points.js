const { Pool } = require('pg');
require('dotenv').config();

async function checkPoints() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query('SELECT id, email, points FROM users');
        console.log('Current User Points:');
        console.table(res.rows);
    } catch (err) {
        console.error('Error checking points:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

checkPoints();
