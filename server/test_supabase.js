require('dotenv').config();
const { Pool } = require('pg');

async function testSupabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Connecting to Supabase...');
        const res = await pool.query('SELECT NOW()');
        console.log('Connection Successful! Server time:', res.rows[0].now);

        // Optional: Check if tables exist
        const tableRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables found:', tableRes.rows.map(t => t.table_name));

        await pool.end();
    } catch (err) {
        console.error('Connection Failed:', err.message);
        process.exit(1);
    }
}

testSupabase();
