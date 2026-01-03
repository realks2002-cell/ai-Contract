const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

async function migrate() {
    console.log('Testing connection to:', process.env.DATABASE_URL.split('@')[1]); // Log host only for safety

    // Try with SSL first (as in current app)
    let pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Attempting connection with SSL...');
        await pool.query('SELECT NOW()');
        console.log('Connection successful with SSL.');
    } catch (err) {
        console.warn('SSL connection failed:', err.message);
        console.log('Retrying WITHOUT SSL...');
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: false
        });
        try {
            await pool.query('SELECT NOW()');
            console.log('Connection successful WITHOUT SSL.');
        } catch (err2) {
            console.error('Connection failed entirely:', err2.message);
            process.exit(1);
        }
    }

    try {
        console.log('Adding points column to users table...');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;');
        console.log('Column "points" added or checked successfully.');

        console.log('Granting 10,000 points to all users...');
        const res = await pool.query('UPDATE users SET points = COALESCE(points, 0) + 10000');
        console.log(`Successfully granted points to ${res.rowCount} users.`);
    } catch (err) {
        console.error('Migration/Grant failed:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

migrate();
